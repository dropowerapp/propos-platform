'use client';

import { Building2, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Per-firm performance — the analytic generic journals can't offer ─────────
// "My win rate on FTMO is 61% but 44% on FundingPips" lives here.

interface FirmRow {
  group: string;        // "FTMO 100k"
  trades: number;
  wins: number;
  losses: number;
  winRate: number;      // 0–1
  netPnl: number;
  profitFactor: number;
  avgR: number;
}

const DEMO_ROWS: FirmRow[] = [
  { group: 'FTMO 100k',        trades: 84, wins: 51, losses: 33, winRate: 0.607, netPnl: 6840,  profitFactor: 2.1, avgR: 0.62 },
  { group: 'FundingPips 200k', trades: 57, wins: 25, losses: 32, winRate: 0.439, netPnl: -1240, profitFactor: 0.84, avgR: -0.18 },
  { group: 'E8 Markets 50k',   trades: 38, wins: 22, losses: 16, winRate: 0.579, netPnl: 2410,  profitFactor: 1.7, avgR: 0.45 },
];

const FIRM_COLORS = ['#00c4cc', '#6c47ff', '#f59e0b', '#10b981', '#ef4444', '#f97316'];

function buildInsight(rows: FirmRow[]): string | null {
  if (rows.length < 2) return null;
  const sorted = [...rows].sort((a, b) => b.winRate - a.winRate);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const gap = (best.winRate - worst.winRate) * 100;
  if (gap < 8) return null;
  return `Your win rate on ${best.group} is ${(best.winRate * 100).toFixed(0)}% vs ${(worst.winRate * 100).toFixed(0)}% on ${worst.group}. ` +
    (worst.netPnl < 0
      ? `${worst.group} rules or conditions may not suit your style — review your losing trades there before the next reset.`
      : `Consider concentrating size where your edge is strongest.`);
}

export function FirmPerformancePanel({ rows: apiRows }: { rows?: any[] }) {
  // Normalize API rows; fall back to demo data
  const normalized: FirmRow[] = (apiRows ?? [])
    .filter((r: any) => r.group && r.group !== 'all')
    .map((r: any) => ({
      group: r.group,
      trades: r.trades ?? 0,
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      winRate: r.winRate ?? (r.trades ? r.wins / r.trades : 0),
      netPnl: Number(r.netPnl ?? 0),
      profitFactor: Number(r.profitFactor ?? 0),
      avgR: Number(r.avgR ?? r.avgRMultiple ?? 0),
    }));

  const rows = normalized.length > 0 ? normalized : DEMO_ROWS;
  const isDemo = normalized.length === 0;
  const insight = buildInsight(rows);
  const maxAbsPnl = Math.max(...rows.map(r => Math.abs(r.netPnl)), 1);

  return (
    <div className="space-y-4">
      {/* Insight banner */}
      {insight && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/8 px-4 py-3">
          <Lightbulb className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--foreground)]/90 leading-relaxed">{insight}</p>
        </div>
      )}

      {/* Firm cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {rows.map((r, i) => {
          const color = FIRM_COLORS[i % FIRM_COLORS.length];
          const positive = r.netPnl >= 0;
          return (
            <div key={r.group} className="stat-card space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Building2 className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] truncate">{r.group}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{r.trades} trades</p>
                </div>
                {positive
                  ? <TrendingUp className="w-4 h-4 text-[var(--profit)] shrink-0" />
                  : <TrendingDown className="w-4 h-4 text-[var(--loss)] shrink-0" />}
              </div>

              {/* Net P&L */}
              <div>
                <p className={cn('text-2xl font-bold tabular-nums', positive ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                  {positive ? '+' : '-'}${Math.abs(r.netPnl).toLocaleString()}
                </p>
                <div className="progress-bar mt-2">
                  <div
                    className={cn('progress-fill', !positive && 'danger')}
                    style={{ width: `${(Math.abs(r.netPnl) / maxAbsPnl) * 100}%` }}
                  />
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border)]">
                {[
                  {
                    label: 'Win Rate',
                    value: `${(r.winRate * 100).toFixed(0)}%`,
                    color: r.winRate >= 0.5 ? 'text-[var(--profit)]' : 'text-[var(--loss)]',
                  },
                  {
                    label: 'Profit Factor',
                    value: r.profitFactor.toFixed(2),
                    color: r.profitFactor >= 1 ? 'text-[var(--profit)]' : 'text-[var(--loss)]',
                  },
                  {
                    label: 'Avg R',
                    value: `${r.avgR >= 0 ? '+' : ''}${r.avgR.toFixed(2)}R`,
                    color: r.avgR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]',
                  },
                ].map(m => (
                  <div key={m.label} className="text-center pt-2">
                    <p className={cn('text-sm font-bold tabular-nums', m.color)}>{m.value}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* W/L split */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-[var(--secondary)]">
                  <div className="bg-[var(--profit)]" style={{ width: `${(r.wins / Math.max(r.trades, 1)) * 100}%` }} />
                  <div className="bg-[var(--loss)]" style={{ width: `${(r.losses / Math.max(r.trades, 1)) * 100}%` }} />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] tabular-nums shrink-0">
                  {r.wins}W / {r.losses}L
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isDemo && (
        <p className="text-xs text-[var(--muted-foreground)] text-center">
          Demo data — import your trades to see your real per-firm performance.
        </p>
      )}
    </div>
  );
}
