import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(tenantId: string, userId: string, accountId?: string, dateFrom?: string, dateTo?: string) {
    const where = {
      tenantId,
      userId,
      status: 'closed',
      ...(accountId && { tradingAccountId: accountId }),
      ...(dateFrom || dateTo
        ? { openTime: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } }
        : {}),
    };

    const trades = await this.prisma.trade.findMany({
      where,
      select: {
        netPnl: true, grossPnl: true, outcome: true, rMultiple: true,
        openTime: true, closeTime: true, durationSeconds: true,
        session: true, dayOfWeek: true, symbol: true,
      },
    });

    if (trades.length === 0) {
      return { data: this.emptyMetrics() };
    }

    const closed = trades.filter(t => t.netPnl !== null);
    const winners = closed.filter(t => t.outcome === 'win');
    const losers = closed.filter(t => t.outcome === 'loss');

    const totalPnl = closed.reduce((s, t) => s + Number(t.netPnl ?? 0), 0);
    const grossWins = winners.reduce((s, t) => s + Number(t.netPnl ?? 0), 0);
    const grossLosses = Math.abs(losers.reduce((s, t) => s + Number(t.netPnl ?? 0), 0));

    const winRate = closed.length ? winners.length / closed.length : 0;
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;
    const expectancy = closed.length ? totalPnl / closed.length : 0;

    const avgWin = winners.length ? grossWins / winners.length : 0;
    const avgLoss = losers.length ? grossLosses / losers.length : 0;

    const rMultiples = closed.filter(t => t.rMultiple !== null).map(t => Number(t.rMultiple));
    const avgRMultiple = rMultiples.length ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;

    const avgDuration = closed.filter(t => t.durationSeconds).reduce((s, t) => s + (t.durationSeconds ?? 0), 0) / (closed.filter(t => t.durationSeconds).length || 1);

    // Sharpe: annualised daily PnL / stddev
    const dailyPnlMap: Record<string, number> = {};
    for (const t of closed) {
      const day = t.openTime.toISOString().slice(0, 10);
      dailyPnlMap[day] = (dailyPnlMap[day] ?? 0) + Number(t.netPnl ?? 0);
    }
    const dailyPnls = Object.values(dailyPnlMap);
    const meanDaily = dailyPnls.reduce((s, v) => s + v, 0) / (dailyPnls.length || 1);
    const stdDaily = Math.sqrt(dailyPnls.reduce((s, v) => s + Math.pow(v - meanDaily, 2), 0) / (dailyPnls.length || 1));
    const sharpeRatio = stdDaily > 0 ? (meanDaily / stdDaily) * Math.sqrt(252) : 0;

    // Max drawdown
    let peak = 0, equity = 0, maxDD = 0;
    for (const t of closed.sort((a, b) => a.openTime.getTime() - b.openTime.getTime())) {
      equity += Number(t.netPnl ?? 0);
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? (peak - equity) / peak : 0;
      if (dd > maxDD) maxDD = dd;
    }

    // Equity curve
    const equityCurve: { date: string; equity: number }[] = [];
    let runningEquity = 0;
    for (const [date, pnl] of Object.entries(dailyPnlMap).sort()) {
      runningEquity += pnl;
      equityCurve.push({ date, equity: parseFloat(runningEquity.toFixed(2)) });
    }

    return {
      data: {
        totalTrades: closed.length,
        winningTrades: winners.length,
        losingTrades: losers.length,
        winRate: parseFloat(winRate.toFixed(4)),
        totalNetPnl: parseFloat(totalPnl.toFixed(2)),
        grossWins: parseFloat(grossWins.toFixed(2)),
        grossLosses: parseFloat(grossLosses.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(4)),
        expectancy: parseFloat(expectancy.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        avgRMultiple: parseFloat(avgRMultiple.toFixed(2)),
        avgTradeDurationSeconds: Math.round(avgDuration),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        maxDrawdownPct: parseFloat((maxDD * 100).toFixed(2)),
        equityCurve,
        tradingDays: dailyPnls.length,
      },
    };
  }

  async getBreakdown(tenantId: string, userId: string, groupBy: string, accountId?: string, dateFrom?: string, dateTo?: string) {
    const where = {
      tenantId,
      userId,
      status: 'closed',
      ...(accountId && { tradingAccountId: accountId }),
      ...(dateFrom || dateTo
        ? { openTime: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } }
        : {}),
    };

    const trades = await this.prisma.trade.findMany({
      where,
      select: {
        netPnl: true, outcome: true, rMultiple: true, session: true,
        dayOfWeek: true, symbol: true, month: true, year: true,
        tradingAccount: {
          select: {
            propFirmAccount: {
              select: {
                accountSize: true,
                propFirm: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const groupFn = (t: typeof trades[0]): string => {
      if (groupBy === 'session') return t.session ?? 'unknown';
      if (groupBy === 'symbol') return t.symbol;
      if (groupBy === 'dayOfWeek') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][t.dayOfWeek ?? 0];
      if (groupBy === 'month') return `${t.year}-${String(t.month).padStart(2, '0')}`;
      if (groupBy === 'firm') {
        const pfa = t.tradingAccount?.propFirmAccount;
        const firm = pfa?.propFirm?.name;
        const size = Number(pfa?.accountSize ?? 0);
        return firm ? `${firm}${size ? ` ${(size / 1000).toFixed(0)}k` : ''}` : 'Unassigned';
      }
      return 'all';
    };

    const groups: Record<string, typeof trades> = {};
    for (const t of trades) {
      const key = groupFn(t);
      groups[key] ??= [];
      groups[key].push(t);
    }

    const breakdown = Object.entries(groups).map(([group, items]) => {
      const wins = items.filter(t => t.outcome === 'win').length;
      const netPnl = items.reduce((s, t) => s + Number(t.netPnl ?? 0), 0);
      const grossWins = items.filter(t => t.outcome === 'win').reduce((s, t) => s + Number(t.netPnl ?? 0), 0);
      const grossLosses = Math.abs(items.filter(t => t.outcome === 'loss').reduce((s, t) => s + Number(t.netPnl ?? 0), 0));
      return {
        group,
        trades: items.length,
        wins,
        losses: items.filter(t => t.outcome === 'loss').length,
        winRate: parseFloat((wins / items.length).toFixed(4)),
        netPnl: parseFloat(netPnl.toFixed(2)),
        profitFactor: grossLosses > 0 ? parseFloat((grossWins / grossLosses).toFixed(2)) : null,
        avgRMultiple: items.filter(t => t.rMultiple !== null).length
          ? parseFloat((items.reduce((s, t) => s + Number(t.rMultiple ?? 0), 0) / items.filter(t => t.rMultiple !== null).length).toFixed(2))
          : null,
      };
    });

    return { data: breakdown.sort((a, b) => b.netPnl - a.netPnl) };
  }

  private emptyMetrics() {
    return {
      totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0,
      totalNetPnl: 0, grossWins: 0, grossLosses: 0, profitFactor: 0,
      expectancy: 0, avgWin: 0, avgLoss: 0, avgRMultiple: 0,
      avgTradeDurationSeconds: 0, sharpeRatio: 0, maxDrawdownPct: 0,
      equityCurve: [], tradingDays: 0,
    };
  }
}
