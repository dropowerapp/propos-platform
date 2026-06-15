import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const alerts = [
  { severity: 'critical', message: 'FundingPips 200k — Daily drawdown at 79% of limit', time: '2 min ago' },
  { severity: 'warning',  message: 'FTMO 100k — 1 more trading day needed to complete phase', time: '1h ago' },
  { severity: 'info',     message: 'E8 Markets updated their payout policy — review changes', time: '3h ago' },
];

const icons = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  critical: 'text-[var(--loss)]',
  warning: 'text-[var(--warning)]',
  info: 'text-blue-400',
};

export function RecentAlerts() {
  return (
    <div className="stat-card">
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">⚡ Recent Alerts</h2>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const Icon = icons[a.severity as keyof typeof icons];
          return (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', colors[a.severity as keyof typeof colors])} />
              <p className="text-sm text-[var(--foreground)] flex-1">{a.message}</p>
              <span className="text-xs text-[var(--muted-foreground)] shrink-0">{a.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
