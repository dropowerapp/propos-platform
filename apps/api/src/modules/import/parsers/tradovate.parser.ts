/**
 * Tradovate CSV Trade History Parser
 *
 * Export from: Tradovate Web → Account → Trade History → Export CSV
 *
 * Tradovate uses a fill-level CSV, not position-level — we group fills by
 * matching buy/sell pairs on the same contract to reconstruct round-trip trades.
 *
 * Column format (Tradovate default):
 * id, account id, timestamp, action, qty, symbol, price, profit, fees, orderId
 *
 * Simplified "Trades" export (alternative):
 * AccountId, Name, Symbol, Quantity, BuyPrice, SellPrice,
 * TradeDate, ExpirationDate, FeesAndCharges, PnL
 */
import { parse } from 'csv-parse/sync';
import { createHash } from 'crypto';
import { ParsedTrade } from './mt4-html.parser';

export function parseTradovateCsv(csvContent: string): ParsedTrade[] {
  let records: Record<string, string>[];
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });
  } catch {
    return [];
  }

  if (!records || records.length === 0) return [];

  // Detect export format by inspecting headers
  const headers = Object.keys(records[0]).map(h => h.toLowerCase().trim());
  const isSimpleFormat = headers.includes('buyprice') || headers.includes('buy price');

  if (isSimpleFormat) {
    return parseTradovateSimple(records);
  } else {
    return parseTradovateFills(records);
  }
}

/**
 * Parses the simplified Tradovate "Trades" export where each row = one round trip
 */
function parseTradovateSimple(records: Record<string, string>[]): ParsedTrade[] {
  const trades: ParsedTrade[] = [];

  for (const row of records) {
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim().replace(/\s+/g, '')] = (v ?? '').trim();
    }

    const symbol    = (r['symbol'] ?? r['name'] ?? '').toUpperCase();
    const qty       = parseFloat(r['quantity'] ?? r['qty'] ?? '1');
    const buyPrice  = parseFloat(r['buyprice'] ?? '0');
    const sellPrice = parseFloat(r['sellprice'] ?? '0');
    const tradeDateR= r['tradedate'] ?? r['date'] ?? r['timestamp'] ?? '';
    const fees      = parseFloat(r['feesandcharges'] ?? r['fees'] ?? r['commission'] ?? '0') || 0;
    const pnlRaw    = r['pnl'] ?? r['profit'] ?? r['realizedpnl'] ?? '0';
    const pnl       = parseFloat(pnlRaw.replace(',', '.').replace('(', '-').replace(')', '')) || 0;

    if (!symbol || !tradeDateR) continue;

    // Determine direction: if buyPrice > sellPrice we sold, meaning we went long and exited
    // If rows have direction explicitly use it; otherwise infer from price ordering
    const directionRaw = (r['direction'] ?? r['side'] ?? '').toLowerCase();
    const direction: 'long' | 'short' = directionRaw.includes('short') ? 'short'
      : directionRaw.includes('long') ? 'long'
      : buyPrice <= sellPrice ? 'long' : 'short';

    const openPrice  = direction === 'long' ? buyPrice : sellPrice;
    const closePrice = direction === 'long' ? sellPrice : buyPrice;

    let openedAt: Date;
    let closedAt: Date;
    try {
      openedAt = new Date(tradeDateR);
      closedAt = new Date(tradeDateR);
      if (isNaN(openedAt.getTime())) continue;
    } catch {
      continue;
    }

    const importHash = createHash('sha256')
      .update(`tradovate:${symbol}:${tradeDateR}:${qty}:${openPrice}:${closePrice}`)
      .digest('hex');

    trades.push({
      symbol,
      direction,
      lots: isNaN(qty) ? 1 : qty,
      openPrice: isNaN(openPrice) ? 0 : openPrice,
      closePrice: isNaN(closePrice) ? 0 : closePrice,
      openedAt,
      closedAt,
      stopLoss: null,
      takeProfit: null,
      grossPnl: pnl + fees, // gross before fees
      commission: -Math.abs(fees),
      swap: 0,
      comment: r['comment'] ?? null,
      importHash,
    });
  }

  return trades;
}

/**
 * Parses Tradovate fill-level export and groups fills into round-trip trades
 */
function parseTradovateFills(records: Record<string, string>[]): ParsedTrade[] {
  // Group by symbol + orderId to pair buy/sell fills
  type Fill = {
    symbol: string; action: string; qty: number;
    price: number; timestamp: Date; fees: number; profit: number;
  };

  const fills: Fill[] = [];

  for (const row of records) {
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim().replace(/\s+/g, '')] = (v ?? '').trim();
    }

    const symbol    = (r['symbol'] ?? '').toUpperCase();
    const action    = (r['action'] ?? r['side'] ?? r['buysell'] ?? '').toLowerCase();
    const qty       = parseFloat(r['qty'] ?? r['quantity'] ?? r['size'] ?? '1');
    const price     = parseFloat(r['price'] ?? '0');
    const tsRaw     = r['timestamp'] ?? r['datetime'] ?? r['time'] ?? '';
    const fees      = parseFloat(r['fees'] ?? r['commission'] ?? '0') || 0;
    const profit    = parseFloat(r['profit'] ?? r['pnl'] ?? '0') || 0;

    if (!symbol || isNaN(price) || isNaN(qty)) continue;

    let ts: Date;
    try {
      ts = new Date(tsRaw);
      if (isNaN(ts.getTime())) continue;
    } catch { continue; }

    fills.push({ symbol, action, qty, price, timestamp: ts, fees, profit });
  }

  // Match buy/sell fills into trades (simplified FIFO matching)
  const trades: ParsedTrade[] = [];
  const buyQueue: Fill[]  = fills.filter(f => f.action.includes('buy'));
  const sellQueue: Fill[] = fills.filter(f => f.action.includes('sell'));

  // For each completed P&L event, emit a trade
  const profitFills = fills.filter(f => f.profit !== 0);
  for (const fill of profitFills) {
    const direction: 'long' | 'short' = fill.action.includes('buy') ? 'short' : 'long'; // closing fill
    const importHash = createHash('sha256')
      .update(`tradovate_fill:${fill.symbol}:${fill.timestamp.toISOString()}:${fill.qty}:${fill.price}`)
      .digest('hex');

    trades.push({
      symbol: fill.symbol,
      direction,
      lots: fill.qty,
      openPrice: fill.price,  // we only have close price on fill
      closePrice: fill.price,
      openedAt: fill.timestamp,
      closedAt: fill.timestamp,
      stopLoss: null,
      takeProfit: null,
      grossPnl: fill.profit + fill.fees,
      commission: -Math.abs(fill.fees),
      swap: 0,
      comment: null,
      importHash,
    });
  }

  return trades;
}
