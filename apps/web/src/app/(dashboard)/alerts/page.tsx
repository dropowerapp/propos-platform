'use client';

import { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, Bell, BellOff, Settings, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead } from '@/lib/hooks/use-alerts';
import { useAlertsSocket } from '@/lib/hooks/use-alerts-socket';

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-[var(--loss)]',   bg: 'bg-[var(--loss)]/10',    border: 'border-l-[var(--loss)]' },
  warning:  { icon: AlertTriangle, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', border: 'border-l-[var(--warning)]' },
  success:  { icon: CheckCircle2,  color: 'text-[var(--profit)]',  bg: 'bg-[var(--profit)]/10',  border: 'border-l-[var(--profit)]' },
  info:     { icon: Info,          color: 'text-blue-400',         bg: '',                        border: 'border-l-blue-400' },
};

const TYPE_LABELS: Record<string, string> = {
  drawdown_warning:   'Risk Alert',
  drawdown_critical:  'Risk Alert',
  profit_target_near: 'Challenge',
  profit_target_hit:  'Challenge',
  min_days_complete:  'Challenge',
  firm_rule_change:   'Firm Update',
  losing_streak:      'Performance',
  payout_received:    'Payout',
};

function fmtTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'firm'>('all');

  const queryParams: Record<string, string> = {};
  if (filter === 'unread') queryParams.isRead = 'false';
  if (filter === 'critical') queryParams.severity = 'critical';

  const { data, isLoading } = useAlerts(queryParams);
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  // Real-time WebSocket — silently no-op if server is unavailable
  useAlertsSocket();

  const events: any[] = data?.events ?? data ?? [];
  const unreadCount: number = data?.unreadCount ?? events.filter((e: any) => !e.isRead).length;

  // Client-side filter for firm updates (not sent as query param since it's by type)
  const filtered = filter === 'firm'
    ? events.filter((e: any) => e.alertType === 'firm_rule_change')
    : events;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Alert Center</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {isLoading ? '—' : `${unreadCount} unread · ${events.length} total`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || unreadCount === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark all read
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
            <Settings className="w-4 h-4" /> Alert Settings
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {[
          { k: 'all',      l: `All (${events.length})` },
          { k: 'unread',   l: `Unread (${unreadCount})` },
          { k: 'critical', l: 'Risk & Performance' },
          { k: 'firm',     l: 'Firm Updates' },
        ].map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setFilter(k as any)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              filter === k
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading alerts…
        </div>
      )}

      {!isLoading && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="stat-card text-center py-12">
              <BellOff className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)]">No alerts in this category</p>
            </div>
          )}
          {filtered.map((a: any) => {
            const sevKey = (a.severity ?? 'info') as keyof typeof SEVERITY_CONFIG;
            const sev = SEVERITY_CONFIG[sevKey] ?? SEVERITY_CONFIG.info;
            const SevIcon = sev.icon;
            const isRead = a.isRead ?? false;

            return (
              <div
                key={a.id}
                onClick={() => !isRead && markRead.mutate(a.id)}
                className={cn(
                  'stat-card border-l-4 cursor-pointer transition-all hover:border-[var(--muted-foreground)]',
                  sev.border,
                  sev.bg,
                  !isRead && 'ring-1 ring-[var(--border)]',
                )}
              >
                <div className="flex items-start gap-3">
                  <SevIcon className={cn('w-4 h-4 mt-0.5 shrink-0', sev.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />}
                      <span className="text-xs font-medium text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[a.alertType] ?? 'Alert'}
                      </span>
                      {a.propFirmAccount && (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {a.propFirmAccount.propFirm?.name ?? ''} {a.propFirmAccount.accountName ?? ''}
                        </span>
                      )}
                      {a.sentAt && (
                        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{fmtTime(a.sentAt)}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)] mb-1">{a.title}</p>
                    {a.body && (
                      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{a.body}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert rules CTA */}
      <div className="stat-card border-dashed flex items-center gap-4">
        <Bell className="w-8 h-8 text-[var(--primary)] shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Configure Smart Alerts</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Set custom thresholds for drawdown warnings, challenge milestones, and prop firm rule changes.
          </p>
        </div>
        <button className="ml-auto px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
          Configure
        </button>
      </div>
    </div>
  );
}
