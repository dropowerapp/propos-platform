'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Trades calendar ────────────────────────────────────────────────────────────
// Traders think in days. A month grid with per-day P&L is the single most
// requested view in any trading journal — and the fastest way to spot a bad
// streak (revenge-trade Fridays, etc.).

interface DayStat {
  pnl: number;
  trades: number;
  wins: number;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Build a demo month so the calendar is alive before real trades exist
function buildDemo(year: number, month: number): Record<string, DayStat> {
  const out: Record<string, DayStat> = {};
  const seed = [480, -180, 920, 240, -62, 390, 275, -180, 640, 225, -310, 150, 705, -90, 410];
  let si = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;        // skip weekends
    if (d % 3 === 0) continue;                     // some no-trade days
    const pnl = seed[si % seed.length];
    si++;
    out[dayKey(date)] = {
      pnl,
      trades: 1 + (si % 3),
      wins: pnl >= 0 ? 1 + (si % 3) : si % 2,
    };
  }
  return out;
}

export function TradesCalendar({ trades }: { trades?: any[] }) {
  const [cursor, setCursor] = useState(() => new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Aggregate real trades by close day
  const realByDay = useMemo(() => {
    const map: Record<string, DayStat> = {};
    for (const t of trades ?? []) {
      const raw = t.closeTime ?? t.closedAt ?? t.openTime ?? t.date;
      if (!raw) continue;
      const d = new Date(raw);
      if (isNaN(d.getTime())) continue;
      const k = dayKey(d);
      const pnl = Number(t.netPnl ?? t.pnl ?? 0);
      const isWin = (t.outcome ? t.outcome === 'win' : pnl > 0);
      map[k] ??= { pnl: 0, trades: 0, wins: 0 };
      map[k].pnl += pnl;
      map[k].trades += 1;
      if (isWin) map[k].wins += 1;
    }
    return map;
  }, [trades]);

  const hasReal = Object.keys(realByDay).length > 0;
  const byDay = hasReal ? realByDay : buildDemo(year, month);

  // Month grid — Monday-first
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // Month summary
  const monthStats = Object.entries(byDay).filter(([k]) => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
  const monthPnl = monthStats.reduce((s, [, v]) => s + v.pnl, 0);
  const monthTrades = monthStats.reduce((s, [, v]) => s + v.trades, 0);
  const greenDays = monthStats.filter(([, v]) => v.pnl > 0).length;
  const redDays = monthStats.filter(([, v]) => v.pnl < 0).length;

  const today = dayKey(new Date());
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function fmtPnl(n: number) {
    const abs = Math.abs(n);
    const s = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(0);
    return `${n >= 0 ? '+' : '-'}$${s}`;
  }

  return (
    <div className="space-y-4">
      {/* Month summary + nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold text-[var(--foreground)] w-36 text-center">{monthLabel}</h3>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="ml-1 text-xs px-2.5 py-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            {monthPnl >= 0
              ? <TrendingUp className="w-3.5 h-3.5 text-[var(--profit)]" />
              : <TrendingDown className="w-3.5 h-3.5 text-[var(--loss)]" />}
            <span className={cn('font-bold tabular-nums', monthPnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
              {fmtPnl(monthPnl)}
            </span>
          </span>
          <span className="text-[var(--muted-foreground)]">{monthTrades} trades</span>
          <span className="text-[var(--profit)]">{greenDays}W</span>
          <span className="text-[var(--loss)]">{redDays}L</span>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] opacity-60">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="aspect-square" />;
          const k = dayKey(date);
          const stat = byDay[k];
          const isToday = k === today;
          const win = stat && stat.pnl > 0;
          const loss = stat && stat.pnl < 0;

          return (
            <div
              key={i}
              className={cn(
                'aspect-square rounded-lg border p-2 flex flex-col transition-colors',
                win && 'bg-[var(--profit)]/10 border-[var(--profit)]/30',
                loss && 'bg-[var(--loss)]/10 border-[var(--loss)]/30',
                !stat && 'border-[var(--border)] bg-[var(--card)]',
                isToday && 'ring-1 ring-[var(--primary)]',
              )}
            >
              <span className={cn(
                'text-[11px] font-medium',
                isToday ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]',
              )}>
                {date.getDate()}
              </span>
              {stat && (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <span className={cn('text-xs font-bold tabular-nums leading-tight', win ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                    {fmtPnl(stat.pnl)}
                  </span>
                  <span className="text-[9px] text-[var(--muted-foreground)] mt-0.5">
                    {stat.trades}t · {stat.wins}/{stat.trades}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasReal && (
        <p className="text-xs text-[var(--muted-foreground)] text-center">
          Demo month — import your trades to see your real trading calendar.
        </p>
      )}
    </div>
  );
}
