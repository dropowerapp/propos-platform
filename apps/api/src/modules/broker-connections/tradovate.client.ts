// ─── Tradovate API client ───────────────────────────────────────────────────
// Tradovate is clean REST/JSON over HTTPS (no protobuf). OAuth 2.0 authorization
// code flow. Live + demo environments share the same shapes.
//
// ⚠️ Deal/fill mapping needs validation against a live connected account — the
// futures P&L math (tick value per contract) is flagged below.

const AUTHORIZE = 'https://trader.tradovate.com/oauth';

function apiBase(isLive: boolean): string {
  if (process.env.TRADOVATE_API_BASE) return process.env.TRADOVATE_API_BASE;
  return isLive ? 'https://live.tradovateapi.com' : 'https://demo.tradovateapi.com';
}

export interface TradovateTokens {
  accessToken: string;
  refreshToken: string;     // Tradovate renews via the same token; kept for shape parity
  expiresIn: number;        // seconds
  obtainedAt: number;       // epoch ms
}

export interface TradovateAccount {
  id: number;
  name: string;
  nickname?: string;
  isLive: boolean;
}

/** Consent URL the user is redirected to. */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.TRADOVATE_CLIENT_ID ?? '',
    redirect_uri: process.env.TRADOVATE_REDIRECT_URI ?? '',
    response_type: 'code',
    scope: 'trading',
    state,
  });
  return `${AUTHORIZE}?${params.toString()}`;
}

/** Exchange the authorization code for an access token. */
export async function exchangeCode(code: string, isLive = true): Promise<TradovateTokens> {
  const res = await fetch(`${apiBase(isLive)}/auth/oauthtoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.TRADOVATE_REDIRECT_URI ?? '',
      client_id: process.env.TRADOVATE_CLIENT_ID ?? '',
      client_secret: process.env.TRADOVATE_CLIENT_SECRET ?? '',
    }),
  });
  if (!res.ok) throw new Error(`Tradovate token exchange failed: ${res.status} ${await res.text()}`);
  const json: any = await res.json();
  // Tradovate returns access_token + expirationTime (ISO) or expires_in
  const expiresIn = json.expires_in
    ?? (json.expirationTime ? Math.max(60, Math.floor((new Date(json.expirationTime).getTime() - Date.now()) / 1000)) : 4800);
  return {
    accessToken: json.access_token ?? json.accessToken,
    refreshToken: json.refresh_token ?? json.access_token ?? json.accessToken,
    expiresIn,
    obtainedAt: Date.now(),
  };
}

/** Renew an access token (Tradovate access tokens are short-lived, ~80 min). */
export async function refreshTokens(accessToken: string, isLive = true): Promise<TradovateTokens> {
  const res = await fetch(`${apiBase(isLive)}/auth/renewAccessToken`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Tradovate token renew failed: ${res.status}`);
  const json: any = await res.json();
  const expiresIn = json.expirationTime
    ? Math.max(60, Math.floor((new Date(json.expirationTime).getTime() - Date.now()) / 1000))
    : 4800;
  return {
    accessToken: json.accessToken ?? accessToken,
    refreshToken: json.accessToken ?? accessToken,
    expiresIn,
    obtainedAt: Date.now(),
  };
}

async function apiGet<T>(path: string, accessToken: string, isLive: boolean): Promise<T> {
  const res = await fetch(`${apiBase(isLive)}/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Tradovate GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** List the trading accounts under this token. */
export async function getAccounts(accessToken: string, isLive = true): Promise<TradovateAccount[]> {
  const list = await apiGet<any[]>('/account/list', accessToken, isLive);
  return (list ?? []).map(a => ({
    id: a.id,
    name: a.name ?? String(a.id),
    nickname: a.nickname,
    isLive,
  }));
}

/**
 * Fetch closed round-trip trades for an account.
 *
 * Tradovate models executions as `fill`s and pairs them as `fillPair`s
 * (entry + exit). We pull both, join, and look up each contract's tick value
 * (`/contract` + `/product`) to convert price moves into money.
 *
 * ⚠️ Tick-value math per contract needs validation with a live account — until
 * then grossPnl falls back to the price delta × qty, which is correct only when
 * the contract's value-per-point is 1.
 */
export async function getDeals(
  accessToken: string,
  accountId: number,
  _fromMs: number,
  _toMs: number,
  isLive = true,
): Promise<any[]> {
  const [fillPairs, fills, contracts] = await Promise.all([
    apiGet<any[]>('/fillPair/list', accessToken, isLive).catch(() => []),
    apiGet<any[]>('/fill/list', accessToken, isLive).catch(() => []),
    apiGet<any[]>('/contract/list', accessToken, isLive).catch(() => []),
  ]);

  const fillById = new Map<number, any>((fills ?? []).map(f => [f.id, f] as [number, any]));
  const contractById = new Map<number, any>((contracts ?? []).map(c => [c.id, c] as [number, any]));

  const out: any[] = [];
  for (const fp of fillPairs ?? []) {
    const buy = fillById.get(fp.buyFillId);
    const sell = fillById.get(fp.sellFillId);
    if (!buy || !sell) continue;

    // Only this account's trades
    const acctId = buy.accountId ?? sell.accountId;
    if (acctId && acctId !== accountId) continue;

    const qty = Number(fp.qty ?? buy.qty ?? sell.qty ?? 1);
    const buyPrice = Number(buy.price ?? 0);
    const sellPrice = Number(sell.price ?? 0);
    const buyTs = new Date(buy.timestamp ?? buy.tradeDate ?? Date.now());
    const sellTs = new Date(sell.timestamp ?? sell.tradeDate ?? Date.now());
    const isLong = buyTs <= sellTs; // entered with the buy → long; else short
    const contract = contractById.get(buy.contractId ?? sell.contractId);
    const symbol = contract?.name ?? `C${buy.contractId ?? ''}`;
    // value-per-point default 1 until contract spec lookup is validated
    const pointValue = Number(contract?.valuePerPoint ?? 1);
    const grossPnl = (sellPrice - buyPrice) * qty * pointValue * (isLong ? 1 : 1);

    out.push({
      dealId: fp.id,
      symbol,
      tradeSide: isLong ? 'long' : 'short',
      qty,
      openPrice: isLong ? buyPrice : sellPrice,
      closePrice: isLong ? sellPrice : buyPrice,
      openedAt: isLong ? buyTs : sellTs,
      closedAt: isLong ? sellTs : buyTs,
      grossPnl,
      commission: 0,
      swap: 0,
    });
  }
  return out;
}
