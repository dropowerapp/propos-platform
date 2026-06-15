import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseMt4Html, parseMt5Html, ParsedTrade } from './parsers/mt4-html.parser';
import { parseCsv } from './parsers/csv.parser';
import { parseCtraderCsv } from './parsers/ctrader.parser';
import { parseTradovateCsv } from './parsers/tradovate.parser';
import { parseNinjaTraderCsv } from './parsers/ninjatrader.parser';
import { parseRithmicCsv } from './parsers/rithmic.parser';

const SESSION_MAP: Record<string, string> = {
  '0': 'Asian', '1': 'Asian', '2': 'Asian', '3': 'Asian', '4': 'Asian',
  '5': 'Asian', '6': 'Asian', '7': 'Asian',
  '8': 'London', '9': 'London', '10': 'London', '11': 'London',
  '12': 'London', '13': 'London New York', '14': 'New York', '15': 'New York',
  '16': 'New York', '17': 'New York', '18': 'New York', '19': 'New York',
  '20': 'New York', '21': 'New York', '22': 'Sydney', '23': 'Sydney',
};

function classifySession(date: Date): string {
  return SESSION_MAP[String(date.getUTCHours())] ?? 'Asian';
}

function classifyOutcome(pnl: number): string {
  if (pnl > 0) return 'win';
  if (pnl < 0) return 'loss';
  return 'breakeven';
}

function calcRMultiple(grossPnl: number, openPrice: number, stopLoss: number | null, lots: number): number | null {
  if (!stopLoss || stopLoss === 0) return null;
  const risk = Math.abs(openPrice - stopLoss) * lots * 100000;
  if (risk === 0) return null;
  return parseFloat((grossPnl / risk).toFixed(2));
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  // ─── Parse (preview without saving) ──────────────────────────────────────

  async parseFile(
    buffer: Buffer,
    filename: string,
    source: string,
  ): Promise<{ trades: ParsedTrade[]; duplicates: number; totalRows: number }> {
    const content = buffer.toString('utf-8');
    let trades: ParsedTrade[] = [];

    switch (source) {
      case 'mt4_html':
        trades = parseMt4Html(content);
        break;
      case 'mt5_html':
        trades = parseMt5Html(content);
        break;
      case 'mt4_csv':
      case 'mt5_csv':
        trades = parseCsv(content, source as any);
        break;
      case 'ctrader':
      case 'ctrader_csv':
        trades = parseCtraderCsv(content);
        break;
      case 'tradovate':
      case 'tradovate_csv':
        trades = parseTradovateCsv(content);
        break;
      case 'ninjatrader':
      case 'ninjatrader_csv':
        trades = parseNinjaTraderCsv(content);
        break;
      case 'rithmic':
      case 'rithmic_csv':
        trades = parseRithmicCsv(content);
        break;
      default:
        // Auto-detect: try HTML parsers first, then each CSV parser
        if (filename.endsWith('.html') || filename.endsWith('.htm')) {
          trades = parseMt4Html(content);
          if (trades.length === 0) trades = parseMt5Html(content);
        } else {
          // Try each CSV parser and use the one that yields the most trades
          const candidates = [
            parseCtraderCsv(content),
            parseTradovateCsv(content),
            parseNinjaTraderCsv(content),
            parseRithmicCsv(content),
            parseCsv(content, 'generic'),
          ];
          trades = candidates.reduce((best, c) => c.length > best.length ? c : best, []);
        }
    }

    // Check duplicates against existing importHashes
    const hashes = trades.map(t => t.importHash);
    const existing = await this.prisma.trade.findMany({
      where: { importHash: { in: hashes } },
      select: { importHash: true },
    });
    const existingSet = new Set(existing.map(e => e.importHash));
    const duplicates = trades.filter(t => existingSet.has(t.importHash)).length;

    return { trades, duplicates, totalRows: trades.length };
  }

  // ─── Import (save to DB) ──────────────────────────────────────────────────

  async importTrades(
    tenantId: string,
    userId: string,
    propFirmAccountId: string,
    buffer: Buffer,
    filename: string,
    source: string,
  ): Promise<{ imported: number; skipped: number; errors: number; jobId: string }> {
    const { trades } = await this.parseFile(buffer, filename, source);

    const { imported, skipped, errors } = await this.persistTrades(
      tenantId, userId, propFirmAccountId, trades,
    );

    // Create an import job record for audit trail
    const job = await this.prisma.importJob.create({
      data: {
        tenantId,
        userId,
        tradingAccountId: propFirmAccountId, // reusing field
        source,
        filename,
        fileSize: buffer.length,
        status: 'completed',
        progressPct: 100,
        totalRows: trades.length,
        importedRows: imported,
        skippedRows: skipped,
        errorRows: errors,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return { imported, skipped, errors, jobId: job.id };
  }

  // ─── Shared persistence (used by file import AND live broker sync) ──────────
  // Dedups by importHash, bridges to a TradingAccount, updates account totalPnl.

  async persistTrades(
    tenantId: string,
    userId: string,
    propFirmAccountId: string,
    trades: ParsedTrade[],
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    const account = await this.prisma.propFirmAccount.findFirst({
      where: { id: propFirmAccountId, tenantId, userId },
      include: { propFirm: { select: { name: true } } },
    });
    if (!account) throw new NotFoundException('Account not found');

    let tradingAccount = await this.prisma.tradingAccount.findFirst({
      where: { propFirmAccountId, tenantId },
    });
    if (!tradingAccount) {
      tradingAccount = await this.prisma.tradingAccount.create({
        data: {
          tenantId,
          userId,
          propFirmAccountId,
          name: account.accountName ?? `${account.propFirm?.name ?? 'Prop'} ${(Number(account.accountSize) / 1000).toFixed(0)}k`,
          initialBalance: account.accountSize,
          accountType: 'prop_firm',
        },
      });
    }

    const hashes = trades.map(t => t.importHash);
    const existingHashes = new Set(
      (await this.prisma.trade.findMany({
        where: { importHash: { in: hashes } },
        select: { importHash: true },
      })).map(e => e.importHash),
    );

    let imported = 0, skipped = 0, errors = 0;

    for (const trade of trades) {
      if (existingHashes.has(trade.importHash)) { skipped++; continue; }
      try {
        const netPnl = trade.grossPnl + trade.commission + trade.swap;
        const outcome = classifyOutcome(netPnl);
        const session = classifySession(trade.openedAt);
        const durationSeconds = Math.floor(
          (trade.closedAt.getTime() - trade.openedAt.getTime()) / 1000,
        );
        const rMultiple = calcRMultiple(trade.grossPnl, trade.openPrice, trade.stopLoss, trade.lots);

        await this.prisma.trade.create({
          data: {
            tenantId, userId,
            tradingAccountId: tradingAccount.id,
            symbol: trade.symbol,
            direction: trade.direction,
            lots: trade.lots,
            openPrice: trade.openPrice,
            closePrice: trade.closePrice,
            openTime: trade.openedAt,
            closeTime: trade.closedAt,
            stopLoss: trade.stopLoss,
            takeProfit: trade.takeProfit,
            grossPnl: trade.grossPnl,
            commission: trade.commission,
            swap: trade.swap,
            netPnl, outcome, session, durationSeconds, rMultiple,
            importHash: trade.importHash,
            rawData: trade.comment ? { comment: trade.comment } : undefined,
          },
        });

        await this.prisma.propFirmAccount.update({
          where: { id: propFirmAccountId },
          data: { totalPnl: { increment: netPnl } },
        });

        imported++;
      } catch (err: any) {
        console.error(`Failed to persist trade ${trade.importHash}:`, err.message);
        errors++;
      }
    }

    return { imported, skipped, errors };
  }

  // ─── Import history ───────────────────────────────────────────────────────

  async listJobs(tenantId: string, userId: string) {
    return this.prisma.importJob.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getJob(id: string, tenantId: string) {
    const job = await this.prisma.importJob.findFirst({ where: { id, tenantId } });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }
}
