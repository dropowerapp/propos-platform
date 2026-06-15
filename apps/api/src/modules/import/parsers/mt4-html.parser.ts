import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

export interface ParsedTrade {
  symbol: string;
  direction: 'long' | 'short';
  lots: number;
  openPrice: number;
  closePrice: number;
  openedAt: Date;
  closedAt: Date;
  stopLoss: number | null;
  takeProfit: number | null;
  grossPnl: number;
  commission: number;
  swap: number;
  comment: string | null;
  importHash: string;
}

/**
 * Parses a MetaTrader 4 HTML detailed statement.
 * MT4 exports a table with columns:
 * Ticket | Open Time | Type | Size | Item | Price | S/L | T/P | Close Time | Price | Commission | Taxes | Swap | Profit
 */
export function parseMt4Html(html: string): ParsedTrade[] {
  const $ = cheerio.load(html);
  const trades: ParsedTrade[] = [];

  // MT4 tables have class="mspt" or similar. We find all rows with 14+ cells.
  $('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 14) return;

    const ticket   = $(cells[0]).text().trim();
    const openTime = $(cells[1]).text().trim();
    const type     = $(cells[2]).text().trim().toLowerCase();
    const size     = parseFloat($(cells[3]).text().trim().replace(',', '.'));
    const symbol   = $(cells[4]).text().trim().toUpperCase();
    const openPrice= parseFloat($(cells[5]).text().trim().replace(',', '.'));
    const sl       = parseFloat($(cells[6]).text().trim().replace(',', '.'));
    const tp       = parseFloat($(cells[7]).text().trim().replace(',', '.'));
    const closeTime= $(cells[8]).text().trim();
    const closePrice=parseFloat($(cells[9]).text().trim().replace(',', '.'));
    const commission=parseFloat($(cells[10]).text().trim().replace(',', '.')) || 0;
    const swap     = parseFloat($(cells[12]).text().trim().replace(',', '.')) || 0;
    const profit   = parseFloat($(cells[13]).text().trim().replace(',', '.'));

    // Skip balance/credit lines
    if (!ticket || isNaN(size) || isNaN(openPrice) || isNaN(closePrice)) return;
    if (type === 'balance' || type === 'credit' || type === 'deposit') return;

    const direction: 'long' | 'short' = type.includes('buy') ? 'long' : 'short';

    let openedAt: Date;
    let closedAt: Date;
    try {
      openedAt = new Date(openTime);
      closedAt = new Date(closeTime);
      if (isNaN(openedAt.getTime()) || isNaN(closedAt.getTime())) return;
    } catch {
      return;
    }

    const importHash = createHash('sha256')
      .update(`mt4:${symbol}:${openTime}:${size}:${openPrice}`)
      .digest('hex');

    trades.push({
      symbol,
      direction,
      lots: size,
      openPrice,
      closePrice,
      openedAt,
      closedAt,
      stopLoss: isNaN(sl) || sl === 0 ? null : sl,
      takeProfit: isNaN(tp) || tp === 0 ? null : tp,
      grossPnl: profit,
      commission,
      swap,
      comment: null,
      importHash,
    });
  });

  return trades;
}

/**
 * Parses MetaTrader 5 HTML statement.
 * MT5 has a similar but slightly different structure.
 */
export function parseMt5Html(html: string): ParsedTrade[] {
  const $ = cheerio.load(html);
  const trades: ParsedTrade[] = [];

  $('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 13) return;

    const ticket    = $(cells[0]).text().trim();
    const openTime  = $(cells[1]).text().trim();
    const type      = $(cells[2]).text().trim().toLowerCase();
    const size      = parseFloat($(cells[3]).text().trim().replace(',', '.'));
    const symbol    = $(cells[4]).text().trim().toUpperCase();
    const openPrice = parseFloat($(cells[5]).text().trim().replace(',', '.'));
    const sl        = parseFloat($(cells[6]).text().trim().replace(',', '.'));
    const tp        = parseFloat($(cells[7]).text().trim().replace(',', '.'));
    const closeTime = $(cells[8]).text().trim();
    const closePrice= parseFloat($(cells[9]).text().trim().replace(',', '.'));
    const commission= parseFloat($(cells[10]).text().trim().replace(',', '.')) || 0;
    const swap      = parseFloat($(cells[11]).text().trim().replace(',', '.')) || 0;
    const profit    = parseFloat($(cells[12]).text().trim().replace(',', '.'));

    if (!ticket || isNaN(size) || isNaN(openPrice) || isNaN(closePrice)) return;
    if (['balance', 'credit', 'deposit', 'withdrawal'].includes(type)) return;

    const direction: 'long' | 'short' = type.includes('buy') ? 'long' : 'short';

    let openedAt: Date;
    let closedAt: Date;
    try {
      openedAt = new Date(openTime);
      closedAt = new Date(closeTime);
      if (isNaN(openedAt.getTime()) || isNaN(closedAt.getTime())) return;
    } catch {
      return;
    }

    const importHash = createHash('sha256')
      .update(`mt5:${symbol}:${openTime}:${size}:${openPrice}`)
      .digest('hex');

    trades.push({
      symbol,
      direction,
      lots: size,
      openPrice,
      closePrice,
      openedAt,
      closedAt,
      stopLoss: isNaN(sl) || sl === 0 ? null : sl,
      takeProfit: isNaN(tp) || tp === 0 ? null : tp,
      grossPnl: profit,
      commission,
      swap,
      comment: null,
      importHash,
    });
  });

  return trades;
}
