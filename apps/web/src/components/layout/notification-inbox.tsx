'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, AlertTriangle, CheckCircle2, Info, ShieldAlert,
  DollarSign, CheckCheck, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlerts, useMarkAllAlertsRead } from '@/lib/hooks/use-alerts';

// ─── Unified notification inbox ────────────────────────────────────────────────
// One stream: risk alerts + rule changes + payout events. Lives in the topbar.

type InboxKind = 'risk' | 'rule_change' | 'payout' | 'challenge' | 'info';

interface InboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  body?: string;
  time: string;
  href: string;
  unread: boolean;
}

const KIND_CONFIG: Record<InboxKind, { icon: React.ElementType; color: string }> = {
  risk:        { icon: AlertTriangle, color: 'text-[var(--loss)]' },
  rule_change: { icon: ShieldAlert,   color: 'text-[var(--warning)]' },
  payout:      { icon: DollarSign,    color: 'text-[var(--profit)]' },
  challenge:   { icon: CheckCircle2,  color: 'text-[var(--primary)]' },
  info:        { icon: Info,          color: 'text-blue-400' },
};

// Demo stream shown when the API has no events — mirrors the three sources
const DEMO_ITEMS: InboxItem[] = [
  { id: 'd1', kind: 'risk',        title: 'FundingPips 200k approaching daily DD limit', body: '79% of daily drawdown used — 0.84% room left', time: '12m ago', href: '/accounts', unread: true },
  { id: 'd2', kind: 'rule_change', title: 'FundingPips tightened consistency rule',      body: '40% → 30% max profit per day',                  time: '2h ago',  href: '/firms/rule-monitor', unread: true },
  { id: 'd3', kind: 'payout',      title: 'FTMO payout window opens in 3 days',          body: 'Est. payout $13,338 at 90% split',              time: '6h ago',  href: '/payouts', unread: false },
  { id: 'd4', kind: 'challenge',   title: 'FTMO 100k Phase 2 — 73% to target',           body: 'Est. pass date Jan 17 at current pace',         time: '1d ago',  href: '/accounts', unread: false },
];

function alertTypeToKind(alertType?: string, severity?: string): InboxKind {
  if (alertType?.startsWith('drawdown') || severity === 'critical') return 'risk';
  if (alertType === 'firm_rule_change') return 'rule_change';
  if (alertType === 'payout_received') return 'payout';
  if (alertType?.includes('target') || alertType?.includes('days')) return 'challenge';
  return 'info';
}

function fmtAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: alertsData } = useAlerts();
  const markAllRead = useMarkAllAlertsRead();

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const events: any[] = alertsData?.events ?? alertsData ?? [];
  const apiItems: InboxItem[] = events.slice(0, 8).map((a: any) => ({
    id: a.id,
    kind: alertTypeToKind(a.alertType, a.severity),
    title: a.title,
    body: a.body ?? undefined,
    time: fmtAgo(a.sentAt ?? a.createdAt),
    href: a.alertType === 'firm_rule_change' ? '/firms/rule-monitor'
      : a.alertType === 'payout_received' ? '/payouts'
      : '/alerts',
    unread: !(a.isRead ?? false),
  }));

  const items = apiItems.length > 0 ? apiItems : DEMO_ITEMS;
  const isDemo = apiItems.length === 0;
  const unread = items.filter(i => i.unread).length;

  return (
    <div className="relative" ref={ref}>
      {/* Bell */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'relative p-2 rounded-md transition-colors',
          open
            ? 'text-[var(--foreground)] bg-[var(--secondary)]'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
        )}
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--loss)] text-white text-[10px] flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Notifications</p>
              {unread > 0 && (
                <span className="text-[10px] font-bold text-[var(--loss)] bg-[var(--loss)]/10 px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <button
              onClick={() => !isDemo && markAllRead.mutate()}
              disabled={unread === 0}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-40"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>

          {/* Items — one stream: risk, rule changes, payouts, challenges */}
          <div className="max-h-96 overflow-y-auto">
            {items.map(item => {
              const cfg = KIND_CONFIG[item.kind];
              const Icon = cfg.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--secondary)]',
                    item.unread && 'bg-[var(--primary)]/4',
                  )}
                >
                  <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-xs leading-snug',
                        item.unread ? 'font-semibold text-[var(--foreground)]' : 'font-medium text-[var(--muted-foreground)]',
                      )}>
                        {item.title}
                      </p>
                      {item.unread && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0 mt-1" />}
                    </div>
                    {item.body && (
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-snug">{item.body}</p>
                    )}
                    <p className="text-[10px] text-[var(--muted-foreground)]/70 mt-1">{item.time}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <Link
            href="/alerts"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--secondary)] transition-colors border-t border-[var(--border)]"
          >
            View all in Alert Center <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
