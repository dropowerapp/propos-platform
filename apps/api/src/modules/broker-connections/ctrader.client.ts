// ─── cTrader Open API client ─────────────────────────────────────────────────
// OAuth + account listing use simple HTTPS (testable today).
// Deal/trade history requires the Open API protobuf channel (TCP/WebSocket to
// *.ctraderapi.com) — that is a separate, heavier piece flagged below.

import { fetchCtraderDeals } from './ctrader-protobuf';

const AUTH_BASE = 'https://openapi.ctrader.com';
const SPOTWARE_API = 'https://api.spotware.com';

export interface CtraderTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;       // seconds
  obtainedAt: number;      // epoch ms
}

export interface CtraderAccount {
  ctidTraderAccountId: number;
  traderLogin: number;
  isLive: boolean;
  brokerName?: string;
}

/** Build the consent URL the user is redirected to. */
export function buildAuthUrl(state: string): string {
  const clientId = process.env.CTRADER_CLIENT_ID ?? '';
  const redirectUri = process.env.CTRADER_REDIRECT_URI ?? '';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'trading',
    response_type: 'code',
    state,
  });
  return `${AUTH_BASE}/apps/auth?${params.toString()}`;
}

/** Exchange the authorization code for access + refresh tokens. */
export async function exchangeCode(code: string): Promise<CtraderTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.CTRADER_REDIRECT_URI ?? '',
    client_id: process.env.CTRADER_CLIENT_ID ?? '',
    client_secret: process.env.CTRADER_CLIENT_SECRET ?? '',
  });
  const res = await fetch(`${AUTH_BASE}/apps/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`cTrader token exchange failed: ${res.status} ${await res.text()}`);
  const json: any = await res.json();
  return {
    accessToken: json.accessToken ?? json.access_token,
    refreshToken: json.refreshToken ?? json.refresh_token,
    expiresIn: json.expiresIn ?? json.expires_in ?? 2628000,
    obtainedAt: Date.now(),
  };
}

/** Refresh an expired access token. */
export async function refreshTokens(refreshToken: string): Promise<CtraderTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.CTRADER_CLIENT_ID ?? '',
    client_secret: process.env.CTRADER_CLIENT_SECRET ?? '',
  });
  const res = await fetch(`${AUTH_BASE}/apps/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`cTrader token refresh failed: ${res.status}`);
  const json: any = await res.json();
  return {
    accessToken: json.accessToken ?? json.access_token,
    refreshToken: json.refreshToken ?? json.refresh_token ?? refreshToken,
    expiresIn: json.expiresIn ?? json.expires_in ?? 2628000,
    obtainedAt: Date.now(),
  };
}

/** List the trading accounts authorised under this access token. */
export async function getTradingAccounts(accessToken: string): Promise<CtraderAccount[]> {
  const res = await fetch(`${SPOTWARE_API}/connect/tradingaccounts?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error(`cTrader account list failed: ${res.status}`);
  const json: any = await res.json();
  const arr = json.data ?? json ?? [];
  return (Array.isArray(arr) ? arr : []).map((a: any) => ({
    ctidTraderAccountId: a.traderId ?? a.ctidTraderAccountId,
    traderLogin: a.traderLogin ?? a.login,
    isLive: a.live ?? a.isLive ?? false,
    brokerName: a.brokerName ?? a.brokerTitle,
  }));
}

/**
 * Fetch closed deals (trade history) for an account via the Open API protobuf
 * channel. Returns closing deals (round-trip trades) with realized P&L.
 */
export async function getDeals(
  accessToken: string,
  ctidTraderAccountId: number,
  fromMs: number,
  toMs: number,
  isLive = true,
): Promise<any[]> {
  return fetchCtraderDeals({ accessToken, ctidTraderAccountId, fromMs, toMs, isLive });
}
