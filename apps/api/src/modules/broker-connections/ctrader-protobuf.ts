import * as protobuf from 'protobufjs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// ─── cTrader Open API — protobuf over WebSocket ─────────────────────────────────
// Deal history is only available through this channel (not plain HTTPS). We load
// Spotware's official .proto files and speak the ProtoMessage envelope protocol.
//
// ⚠️ Needs validation against a live "Active" cTrader app + connected account.
// Host/port are env-overridable in case Spotware changes endpoints.

const PAYLOAD = {
  APP_AUTH_REQ: 2100, APP_AUTH_RES: 2101,
  ACCOUNT_AUTH_REQ: 2102, ACCOUNT_AUTH_RES: 2103,
  SYMBOLS_LIST_REQ: 2114, SYMBOLS_LIST_RES: 2115,
  DEAL_LIST_REQ: 2133, DEAL_LIST_RES: 2134,
  ERROR_RES: 2142,
} as const;

let rootPromise: Promise<protobuf.Root> | null = null;
function loadRoot(): Promise<protobuf.Root> {
  if (!rootPromise) {
    const dir = join(__dirname, 'proto');
    rootPromise = protobuf.load([
      join(dir, 'OpenApiCommonMessages.proto'),
      join(dir, 'OpenApiMessages.proto'),
    ]);
  }
  return rootPromise;
}

interface Pending { resolve: (v: any) => void; reject: (e: any) => void; }

export interface CtraderDeal {
  symbolId: number;
  symbolName: string;
  tradeSide: 'long' | 'short';
  volume: number;            // raw cents
  openPrice: number;
  closePrice: number;
  openedAt: Date;
  closedAt: Date;
  grossPnl: number;
  commission: number;
  swap: number;
  dealId: string;
}

/**
 * Connect, authenticate, fetch closed deals for an account, and disconnect.
 * Returns only closing deals (round-trip trades) with realized P&L.
 */
export async function fetchCtraderDeals(opts: {
  accessToken: string;
  ctidTraderAccountId: number;
  fromMs: number;
  toMs: number;
  isLive: boolean;
}): Promise<CtraderDeal[]> {
  const root = await loadRoot();
  const ProtoMessage = root.lookupType('ProtoMessage');

  const clientId = process.env.CTRADER_CLIENT_ID ?? '';
  const clientSecret = process.env.CTRADER_CLIENT_SECRET ?? '';
  const host = process.env.CTRADER_WS_HOST
    ?? (opts.isLive ? 'wss://live.ctraderapi.com:5036' : 'wss://demo.ctraderapi.com:5036');

  const ws = new WebSocket(host);
  (ws as any).binaryType = 'arraybuffer';
  const pending = new Map<string, Pending>();

  function send(payloadType: number, typeName: string, payload: Record<string, any>): Promise<any> {
    const InnerType = root.lookupType(typeName);
    const innerBytes = InnerType.encode(InnerType.create(payload)).finish();
    const clientMsgId = randomUUID();
    const envelope = ProtoMessage.encode(ProtoMessage.create({
      payloadType, payload: innerBytes, clientMsgId,
    })).finish();
    return new Promise((resolve, reject) => {
      pending.set(clientMsgId, { resolve, reject });
      ws.send(envelope);
      setTimeout(() => {
        if (pending.has(clientMsgId)) {
          pending.delete(clientMsgId);
          reject(new Error(`cTrader request ${payloadType} timed out`));
        }
      }, 20_000);
    });
  }

  function decodeResponse(data: ArrayBuffer): { payloadType: number; clientMsgId: string; payload: Uint8Array } {
    const msg: any = ProtoMessage.decode(new Uint8Array(data));
    return { payloadType: msg.payloadType, clientMsgId: msg.clientMsgId, payload: msg.payload };
  }

  return new Promise<CtraderDeal[]>((resolve, reject) => {
    const fail = (e: any) => { try { ws.close(); } catch {} reject(e); };

    ws.onerror = () => fail(new Error('cTrader WebSocket error'));
    ws.onclose = () => {
      for (const p of pending.values()) p.reject(new Error('cTrader connection closed'));
      pending.clear();
    };

    ws.onmessage = (ev: any) => {
      try {
        const { payloadType, clientMsgId, payload } = decodeResponse(ev.data);
        const waiter = clientMsgId ? pending.get(clientMsgId) : undefined;
        if (payloadType === PAYLOAD.ERROR_RES) {
          const ErrRes = root.lookupType('ProtoOAErrorRes');
          const err: any = ErrRes.decode(payload);
          if (waiter) { pending.delete(clientMsgId); waiter.reject(new Error(`cTrader error: ${err.errorCode} ${err.description ?? ''}`)); }
          return;
        }
        if (waiter) { pending.delete(clientMsgId); waiter.resolve({ payloadType, payload }); }
      } catch (e) { /* ignore non-correlated frames (e.g. heartbeats) */ }
    };

    ws.onopen = async () => {
      try {
        // 1. Application auth
        await send(PAYLOAD.APP_AUTH_REQ, 'ProtoOAApplicationAuthReq', { clientId, clientSecret });
        // 2. Account auth
        await send(PAYLOAD.ACCOUNT_AUTH_REQ, 'ProtoOAAccountAuthReq', {
          ctidTraderAccountId: opts.ctidTraderAccountId,
          accessToken: opts.accessToken,
        });
        // 3. Symbols map (id → name)
        const symRes = await send(PAYLOAD.SYMBOLS_LIST_REQ, 'ProtoOASymbolsListReq', {
          ctidTraderAccountId: opts.ctidTraderAccountId,
        });
        const SymbolsListRes = root.lookupType('ProtoOASymbolsListRes');
        const symParsed: any = SymbolsListRes.decode(symRes.payload);
        const symMap = new Map<string, string>();
        for (const s of symParsed.symbol ?? []) symMap.set(String(s.symbolId), s.symbolName ?? '');

        // 4. Deal list (paginated via hasMore)
        const DealListRes = root.lookupType('ProtoOADealListRes');
        const deals: CtraderDeal[] = [];
        let from = opts.fromMs;
        for (let guard = 0; guard < 50; guard++) {
          const res = await send(PAYLOAD.DEAL_LIST_REQ, 'ProtoOADealListReq', {
            ctidTraderAccountId: opts.ctidTraderAccountId,
            fromTimestamp: from,
            toTimestamp: opts.toMs,
          });
          const parsed: any = DealListRes.decode(res.payload);
          const batch = parsed.deal ?? [];
          for (const d of batch) {
            // Only closing deals carry realized P&L
            const cpd = d.closePositionDetail;
            if (!cpd) continue;
            const moneyDigits = Number(cpd.moneyDigits ?? 2);
            const scale = Math.pow(10, moneyDigits);
            deals.push({
              symbolId: Number(d.symbolId),
              symbolName: symMap.get(String(d.symbolId)) || `SYM${d.symbolId}`,
              tradeSide: Number(d.tradeSide) === 2 ? 'short' : 'long',
              volume: Number(d.filledVolume ?? d.volume ?? 0),
              openPrice: Number(cpd.entryPrice ?? 0),
              closePrice: Number(d.executionPrice ?? 0),
              openedAt: new Date(Number(d.createTimestamp ?? d.executionTimestamp)),
              closedAt: new Date(Number(d.executionTimestamp)),
              grossPnl: Number(cpd.grossProfit ?? 0) / scale,
              commission: Number(cpd.commission ?? 0) / scale,
              swap: Number(cpd.swap ?? 0) / scale,
              dealId: String(d.dealId),
            });
          }
          if (!parsed.hasMore || batch.length === 0) break;
          // Advance the window past the last deal to fetch the next chunk
          const lastTs = Number(batch[batch.length - 1].executionTimestamp);
          if (!lastTs || lastTs <= from) break;
          from = lastTs + 1;
        }

        try { ws.close(); } catch {}
        resolve(deals);
      } catch (e) {
        fail(e);
      }
    };
  });
}
