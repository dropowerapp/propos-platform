/**
 * cTrader CSV Statement Parser
 *
 * Export from: cTrader Desktop → History → Export (CSV)
 *
 * Expected columns (cTrader 4.x):
 * Position Id, Symbol, Direction, Volume (lots), Entry Price, Close Price,
 * Entry Time, Close Time, Net Profit, Gross Profit, Commission, Swap, Label, Comment
 *
 * Some brokers use slightly different headers — we handle aliases below.
 */
import { parse } from 'csv-parse/sync';
import { createHash } from 'crypto';
import { ParsedTrade } from './mt4-html.parser';

export function parseCtraderCsv(csvContent: string): ParsedTrade[] {
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
    // Normalize all keys to lowercase with spaces collapsed
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim().replace(/\s+/g, ' ')] = (v ?? '').trim();
    }

    // --- Field extraction with aliases ---
    const positionId  = r['position id'] ?? r['ticket'] ?? r['#'] ?? '';
    const symbol      = (r['symbol'] ?? r['instrument'] ?? r['asset'] ?? '').toUpperCase();
    const directionRaw= (r['direction'] ?? r['type'] ?? r['side'] ?? 'buy').toLowerCase();
    const volumeRaw   = r['volume'] ?? r['volume (lots)'] ?? r['qty'] ?? r['size'] ?? '0';
    const entryPriceR = r['entry price'] ?? r['open price'] ?? r['price'] ?? '0';
    const closePriceR = r['close price'] ?? r['closing price'] ?? r['exit price'] ?? '0';
    const entryTimeR  = r['entry time'] ?? r['open time'] ?? r['open date'] ?? '';
    const closeTimeR  = r['close time'] ?? r['closing time'] ?? r['close date'] ?? '';
    const netProfitR  = r['net profit'] ?? r['profit'] ?? r['p&l'] ?? r['net p&l'] ?? '0';
    const grossProfitR= r['gross profit'] ?? r['gross p&l'] ?? netProfitR;
    const commissionR = r['commission'] ?? r['comm'] ?? '0';
    const swapR       = r['swap'] ?? r['financing'] ?? '0';
    const slR         = r['stop loss'] ?? r['s/l'] ?? r['sl'] ?? '0';
    const tpR         = r['take profit'] ?? r['t/p'] ?? r['tp'] ?? '0';
    const comment     = r['comment'] ?? r['label'] ?? null;

    if (!symbol || !entryTimeR) continue;

    const direction: 'long' | 'short' = directionRaw.includes('buy') || directionRaw === 'long' ? 'long' : 'short';
    const lots        = parseFloat(volumeRaw.replace(',', '.'));
    const entryPrice  = parseFloat(entryPriceR.replace(',', '.'));
    const closePrice  = parseFloat(closePriceR.replace(',', '.'));
    const netProfit   = parseFloat(netProfitR.replace(',', '.'));
    const grossProfit = parseFloat(grossProfitR.replace(',', '.'));
    const commission  = parseFloat(commissionR.replace(',', '.')) || 0;
    const swap        = parseFloat(swapR.replace(',', '.')) || 0;
    const sl          = parseFloat(slR.replace(',', '.')) || 0;
    const tp          = parseFloat(tpR.replace(',', '.')) || 0;

    if (isNaN(entryPrice) || isNaN(netProfit)) continue;

    let openedAt: Date;
    let closedAt: Date;
    try {
      // cTrader uses format: "2024-01-15 09:32:14" or "15/01/2024 09:32:14"
      openedAt = new Date(entryTimeR.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      closedAt = closeTimeR
        ? new Date(closeTimeR.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'))
        : openedAt;
      if (isNaN(openedAt.getTime())) continue;
    } catch {
      continue;
    }

    const importHash = createHash('sha256')
      .update(`ctrader:${symbol}:${entryTimeR}:${lots}:${entryPrice}:${positionId}`)
      .digest('hex');

    trades.push({
      symbol,
      direction,
      lots: isNaN(lots) ? 1 : lots,
      openPrice: entryPrice,
      closePrice: isNaN(closePrice) ? entryPrice : closePrice,
      openedAt,
      closedAt,
      stopLoss: isNaN(sl) || sl === 0 ? null : sl,
      takeProfit: isNaN(tp) || tp === 0 ? null : tp,
      grossPnl: isNaN(grossProfit) ? netProfit : grossProfit,
      commission,
      swap,
      comment: comment ?? null,
      importHash,
    });
  }

  return trades;
}
