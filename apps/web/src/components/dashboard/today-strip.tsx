'use client';

import Link from 'next/link';
import { Shield, CalendarClock, Bell, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { useAlerts } from '@/lib/hooks/use-alerts';

// ─── Today strip ───────────────────────────────────────────────────────────────
// The first thing a trader sees each morning: how much daily drawdown room
// each active account has, payout countdowns, and critical alerts.

const DEMO_ITEMS = [
  { id: 'd1', firm: 'FTMO 100k',        ddRemainingPct: 4.1, ddLimitPct: 5 },
  { id: 'd2', firm: 'FundingPips 200k', ddRemainingPct: 0.84, ddLimitPct: 4 },
  { id: 'd3', firm: 'E8 50k',           ddRemainingPct: 3.9, ddLimitPct: 5 },
];

function ddTone(remaining: number, limit: number) {
  const ratio = limit > 0 ? remaining / limit : 1;
  if (ratio <= 0.25) return { text: 'text-[var(--loss)]', ring: 'border-[var(--loss)]/40 bg-[var(--loss)]/8' };
  if (ratio <= 0.5)  return { text: 'text-[var(--warning)]', ring: 'border-[var(--warning)]/40 bg-[var(--warning)]/8' };
  return { text: 'text-[var(--profit)]', ring: 'border-[var(--border)] bg-[var(--card)]' };
}

export function TodayStrip() {
  const { data: accountsData } = useAccounts('active');
  const { data: alertsData } = useAlerts({ isRead: 'false' });

  const _acc = accountsData?.data ?? accountsData?.accounts ?? accountsData ?? [];
  const rawAccounts: any[] = Array.isArray(_acc) ? _acc : [];
  const unread: number = alertsData?.unreadCount
    ?? (alertsData?.events ?? alertsData ?? []).filter?.((e: any) => !e.isRead)?.length
    ?? 0;

  // Map active accounts → DD room items; fall back to demo data
  const items = rawAccounts.length > 0
    ? rawAccounts.map((a: any) => {
        const rules = a.rulesSnapshot ?? {};
        const limit = Number(rules.dailyDrawdownPct ?? 5);
        const usedPctOfLimit = Number(a.dailyDrawdownUsedPct ?? 0); // % of limit consumed
        const remaining = Math.max(0, limit * (1 - usedPctOfLimit / 100));
        const firmName = a.propFirm?.name ?? 'Account';
        const size = Number(a.accountSize ?? 0);
        return {
          id: a.id,
          firm: `${firmName} ${(size / 1000).toFixed(0)}k`,
          ddRemainingPct: remaining,
          ddLimitPct: limit,
        };
      })
    : DEMO_ITEMS;

  const worst = items.reduce((min, i) =>
    (i.ddRemainingPct / i.ddLimitPct) < (min.ddRemainingPct / min.ddLimitPct) ? i : min, items[0]);
  const anyDanger = worst && (worst.ddRemainingPct / worst.ddLimitPct) <= 0.25;

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
      {/* Label chip */}
      <div className="flex items-center gap-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span className="text-xs font-semibold text-[var(--foreground)] whitespace-nowrap">Today</span>
      </div>

      {/* DD room per active account */}
      {items.map(item => {
        const tone = ddTone(item.ddRemainingPct, item.ddLimitPct);
        return (
          <Link
            key={item.id}
            href="/accounts"
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg border shrink-0 transition-colors hover:border-[var(--muted-foreground)]/50',
              tone.ring,
            )}
          >
            <Shield className={cn('w-3.5 h-3.5 shrink-0', tone.text)} />
            <div className="leading-tight">
              <p className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">{item.firm} · daily DD room</p>
              <p className={cn('text-xs font-bold tabular-nums', tone.text)}>
                {item.ddRemainingPct.toFixed(2)}% <span className="text-[var(--muted-foreground)] font-normal">of {item.ddLimitPct}%</span>
              </p>
            </div>
          </Link>
        );
      })}

      {/* Payout countdown (demo until payout cycles are tracked) */}
      <Link
        href="/payouts"
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] shrink-0 hover:border-[var(--muted-foreground)]/50 transition-colors"
      >
        <CalendarClock className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
        <div className="leading-tight">
          <p className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">Next payout window</p>
          <p className="text-xs font-bold text-[var(--foreground)]">FTMO · 3 days</p>
        </div>
      </Link>

      {/* Alerts */}
      <Link
        href="/alerts"
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg border shrink-0 transition-colors hover:border-[var(--muted-foreground)]/50',
          unread > 0 || anyDanger
            ? 'border-[var(--warning)]/40 bg-[var(--warning)]/8'
            : 'border-[var(--border)] bg-[var(--card)]',
        )}
      >
        {anyDanger
          ? <AlertTriangle className="w-3.5 h-3.5 text-[var(--loss)] shrink-0" />
          : <Bell className={cn('w-3.5 h-3.5 shrink-0', unread > 0 ? 'text-[var(--warning)]' : 'text-[var(--muted-foreground)]')} />}
        <div className="leading-tight">
          <p className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">Alerts</p>
          <p className={cn('text-xs font-bold', unread > 0 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]')}>
            {unread > 0 ? `${unread} unread` : 'All clear'}
          </p>
        </div>
      </Link>
    </div>
  );
}
