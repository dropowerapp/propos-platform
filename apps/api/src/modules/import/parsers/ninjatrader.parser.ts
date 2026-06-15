/**
 * NinjaTrader 8 CSV Trade Performance Export Parser
 *
 * Export from: NinjaTrader → Account Performance → Export (CSV)
 *
 * NT8 default column format:
 * Entry name, Market pos., Qty, Entry price, Exit price, Entry time,
 * Exit time, Commission, Profit, Cum. profit, Max. favorable excursion,
 * Max. adverse excursion, Run-up, Drawdown, Bars, Efficiency
 *
 * NT7 format uses slightly different names (handled below).
 */
import { parse } from 'csv-parse/sync';
import { createHash } from 'crypto';
import { ParsedTrade } from './mt4-html.parser';

export function parseNinjaTraderCsv(csvContent: string): ParsedTrade[] {
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
    // Normalize headers
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim().replace(/\./g, '').replace(/\s+/g, ' ')] = (v ?? '').trim();
    }

    // Field extraction — NT8 and NT7 column aliases
    const entryName  = r['entry name'] ?? r['signal name'] ?? r['trade name'] ?? '';
    const marketPos  = (r['market pos'] ?? r['market pos'] ?? r['direction'] ?? r['side'] ?? 'long').toLowerCase();
    const qtyRaw     = r['qty'] ?? r['quantity'] ?? r['contracts'] ?? '1';
    const entryPrR   = r['entry price'] ?? r['open price'] ?? r['entry'] ?? '0';
    const exitPrR    = r['exit price'] ?? r['close price'] ?? r['exit'] ?? '0';
    const entryTimeR = r['entry time'] ?? r['entry date/time'] ?? r['open time'] ?? '';
    const exitTimeR  = r['exit time'] ?? r['exit date/time'] ?? r['close time'] ?? '';
    const commR      = r['commission'] ?? r['comm'] ?? '0';
    const profitR    = r['profit'] ?? r['pnl'] ?? r['net profit'] ?? '0';

    // Symbol is often embedded in entry name or a separate column
    const symbol     = (r['instrument'] ?? r['symbol'] ?? r['market'] ?? parseNtSymbol(entryName)).toUpperCase();

    if (!entryTimeR) continue;

    const direction: 'long' | 'short' = marketPos.includes('long') ? 'long' : 'short';
    const qty        = parseFloat(qtyRaw.replace(',', '.'));
    const entryPrice = parseFloat(entryPrR.replace(',', '.').replace('$', ''));
    const exitPrice  = parseFloat(exitPrR.replace(',', '.').replace('$', ''));
    const commission = parseFloat(commR.replace(',', '.').replace('$', '')) || 0;
    // NT8 profit column = net profit (after commission)
    const netProfit  = parseFloat(profitR.replace(',', '.').replace('$', '').replace('(', '-').replace(')', ''));

    if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(netProfit)) continue;

    let openedAt: Date;
    let closedAt: Date;
    try {
      // NT8 format: "1/15/2024 9:32:14 AM" or "2024-01-15 09:32:14"
      openedAt = new Date(entryTimeR);
      closedAt = exitTimeR ? new Date(exitTimeR) : openedAt;
      if (isNaN(openedAt.getTime())) continue;
    } catch {
      continue;
    }

    const grossPnl   = netProfit + Math.abs(commission);
    const importHash = createHash('sha256')
      .update(`ninjatrader:${symbol}:${entryTimeR}:${qty}:${entryPrice}`)
      .digest('hex');

    trades.push({
      symbol: symbol || 'UNKNOWN',
      direction,
      lots: isNaN(qty) ? 1 : qty,
      openPrice: entryPrice,
      closePrice: exitPrice,
      openedAt,
      closedAt,
      stopLoss: null,
      takeProfit: null,
      grossPnl,
      commission: -Math.abs(commission),
      swap: 0,
      comment: entryName || null,
      importHash,
    });
  }

  return trades;
}

/**
 * Tries to extract a tradable symbol from a NinjaTrader entry name like
 * "NQ 06-24 Long" or "ES 09-24 Short"
 */
function parseNtSymbol(entryName: string): string {
  const match = entryName.match(/^([A-Z]{1,5})\s+\d{2}-\d{2}/);
  return match ? match[1] : '';
}
