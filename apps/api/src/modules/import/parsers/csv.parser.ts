import { parse } from 'csv-parse/sync';
import { createHash } from 'crypto';
import { ParsedTrade } from './mt4-html.parser';

/**
 * Detects and parses CSV files from MT4/MT5 exports.
 *
 * Common MT4/MT5 CSV column headers:
 * Ticket,Open Time,Type,Size,Symbol,Price,S/L,T/P,Close Time,Price,Commission,Taxes,Swap,Profit
 *
 * Also handles generic trade CSVs with flexible column detection.
 */
export function parseCsv(csvContent: string, source: 'mt4_csv' | 'mt5_csv' | 'generic' = 'mt4_csv'): ParsedTrade[] {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (records.length === 0) return [];

  const trades: ParsedTrade[] = [];

  for (const row of records) {
    // Normalize column names to lowercase
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim()] = (v ?? '').trim();
    }

    // Try to extract fields using various possible column names
    const ticket     = r['ticket'] ?? r['#'] ?? r['id'] ?? '';
    const openTimeRaw= r['open time'] ?? r['opentime'] ?? r['open_time'] ?? r['date'] ?? r['open date'] ?? '';
    const typeRaw    = (r['type'] ?? r['direction'] ?? r['side'] ?? 'buy').toLowerCase();
    const sizeRaw    = r['size'] ?? r['volume'] ?? r['lots'] ?? r['qty'] ?? '0';
    const symbolRaw  = r['symbol'] ?? r['item'] ?? r['instrument'] ?? '';
    const openPriceR = r['price'] ?? r['open price'] ?? r['entry'] ?? r['entry price'] ?? '0';
    const slRaw      = r['s/l'] ?? r['sl'] ?? r['stop loss'] ?? r['stoploss'] ?? '0';
    const tpRaw      = r['t/p'] ?? r['tp'] ?? r['take profit'] ?? r['takeprofit'] ?? '0';
    const closeTimeR = r['close time'] ?? r['closetime'] ?? r['close_time'] ?? r['exit date'] ?? '';
    const closePriceR= r['close price'] ?? r['exit'] ?? r['exit price'] ?? r['close'] ?? '0';
    const commissionR= r['commission'] ?? r['comm'] ?? '0';
    const swapR      = r['swap'] ?? '0';
    const profitR    = r['profit'] ?? r['p&l'] ?? r['pnl'] ?? r['net pnl'] ?? r['net profit'] ?? '0';

    if (!symbolRaw || !openTimeRaw) continue;

    const size       = parseFloat(sizeRaw.replace(',', '.'));
    const openPrice  = parseFloat(openPriceR.replace(',', '.'));
    const closePrice = parseFloat(closePriceR.replace(',', '.'));
    const sl         = parseFloat(slRaw.replace(',', '.'));
    const tp         = parseFloat(tpRaw.replace(',', '.'));
    const commission = parseFloat(commissionR.replace(',', '.')) || 0;
    const swap       = parseFloat(swapR.replace(',', '.')) || 0;
    const profit     = parseFloat(profitR.replace(',', '.'));

    if (isNaN(openPrice) || isNaN(closePrice) || isNaN(profit)) continue;

    const direction: 'long' | 'short' = typeRaw.includes('buy') || typeRaw === 'long' ? 'long' : 'short';

    let openedAt: Date;
    let closedAt: Date;
    try {
      openedAt = new Date(openTimeRaw);
      closedAt = closeTimeR ? new Date(closeTimeR) : new Date(openTimeRaw);
      if (isNaN(openedAt.getTime())) continue;
    } catch {
      continue;
    }

    const symbol = symbolRaw.toUpperCase();
    const importHash = createHash('sha256')
      .update(`csv:${symbol}:${openTimeRaw}:${size}:${openPrice}`)
      .digest('hex');

    trades.push({
      symbol,
      direction,
      lots: isNaN(size) ? 1 : size,
      openPrice,
      closePrice,
      openedAt,
      closedAt,
      stopLoss: isNaN(sl) || sl === 0 ? null : sl,
      takeProfit: isNaN(tp) || tp === 0 ? null : tp,
      grossPnl: profit,
      commission,
      swap,
      comment: r['comment'] ?? null,
      importHash,
    });
  }

  return trades;
}
