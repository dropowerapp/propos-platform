/**
 * Rithmic R|Trader Pro CSV Export Parser
 *
 * Export from: R|Trader Pro → P&L → Realized P&L → Export CSV
 *
 * NOTE: Rithmic does NOT have a public REST API.
 * Their protocol (R|Protocol) is proprietary C++ only.
 * The only feasible integration path is:
 *   (a) CSV export from R|Trader Pro (this parser), or
 *   (b) Via a broker that wraps Rithmic in their own API (e.g., TradeStation, Tradovate uses Rithmic under the hood)
 *
 * Rithmic Realized P&L CSV columns:
 * Account, FCM/IB Id, IB/IB Id, Buy/Sell, Qty, Symbol, Exch,
 * Open Price, Close Price, Open Date/Time, Close Date/Time,
 * Commission, Realized PnL
 *
 * The trade statement format varies slightly by broker gateway.
 */
import { parse } from 'csv-parse/sync';
import { createHash } from 'crypto';
import { ParsedTrade } from './mt4-html.parser';

export function parseRithmicCsv(csvContent: string): ParsedTrade[] {
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

  const trades: ParsedTrade[] = [];

  for (const row of records) {
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim().replace(/\//g, ' ').replace(/\s+/g, ' ')] = (v ?? '').trim();
    }

    // Rithmic column aliases
    const buySell    = (r['buy sell'] ?? r['side'] ?? r['direction'] ?? 'buy').toLowerCase();
    const qtyRaw     = r['qty'] ?? r['quantity'] ?? r['contracts'] ?? '1';
    const symbol     = (r['symbol'] ?? r['ticker'] ?? r['instrument'] ?? '').toUpperCase();
    const exch       = r['exch'] ?? r['exchange'] ?? '';
    const openPrR    = r['open price'] ?? r['entry price'] ?? r['buy price'] ?? '0';
    const closePrR   = r['close price'] ?? r['exit price'] ?? r['sell price'] ?? '0';
    const openTimeR  = r['open date time'] ?? r['entry time'] ?? r['open time'] ?? r['date'] ?? '';
    const closeTimeR = r['close date time'] ?? r['exit time'] ?? r['close time'] ?? '';
    const commR      = r['commission'] ?? r['comm'] ?? r['fees'] ?? '0';
    const pnlR       = r['realized pnl'] ?? r['realized p&l'] ?? r['pnl'] ?? r['profit'] ?? '0';

    if (!symbol || !openTimeR) continue;

    const direction: 'long' | 'short' = buySell.includes('buy') ? 'long' : 'short';
    const qty        = parseFloat(qtyRaw.replace(',', '.'));
    const openPrice  = parseFloat(openPrR.replace(',', '.').replace('$', ''));
    const closePrice = parseFloat(closePrR.replace(',', '.').replace('$', ''));
    const commission = parseFloat(commR.replace(',', '.').replace('$', '').replace('(', '-').replace(')', '')) || 0;
    const realizedPnl= parseFloat(pnlR.replace(',', '.').replace('$', '').replace('(', '-').replace(')', ''));

    if (isNaN(openPrice) || isNaN(realizedPnl)) continue;

    let openedAt: Date;
    let closedAt: Date;
    try {
      // Rithmic uses: "01/15/2024 09:32:14" or "2024-01-15T09:32:14"
      openedAt = new Date(openTimeR.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'));
      closedAt = closeTimeR
        ? new Date(closeTimeR.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'))
        : openedAt;
      if (isNaN(openedAt.getTime())) continue;
    } catch {
      continue;
    }

    // Rithmic PnL is usually net; gross = net + commission
    const grossPnl   = realizedPnl + Math.abs(commission);
    const importHash = createHash('sha256')
      .update(`rithmic:${symbol}:${openTimeR}:${qty}:${openPrice}`)
      .digest('hex');

    // Append exchange to symbol for futures identification (e.g., NQ.CME)
    const fullSymbol = exch ? `${symbol}.${exch}` : symbol;

    trades.push({
      symbol: fullSymbol,
      direction,
      lots: isNaN(qty) ? 1 : qty,
      openPrice: isNaN(openPrice) ? 0 : openPrice,
      closePrice: isNaN(closePrice) ? openPrice : closePrice,
      openedAt,
      closedAt,
      stopLoss: null,
      takeProfit: null,
      grossPnl,
      commission: -Math.abs(commission),
      swap: 0,
      comment: r['comment'] ?? r['notes'] ?? null,
      importHash,
    });
  }

  return trades;
}
