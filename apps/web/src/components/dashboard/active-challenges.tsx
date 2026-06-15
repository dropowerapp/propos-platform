import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const challenges = [
  { firm: 'FTMO', accountSize: '100k', phase: 2, profitPct: 73, dailyDDPct: 18, status: 'on_track' },
  { firm: 'FundingPips', accountSize: '200k', phase: 1, profitPct: 41, dailyDDPct: 79, status: 'at_risk' },
  { firm: 'E8 Markets', accountSize: '50k', phase: 1, profitPct: 60, dailyDDPct: 22, status: 'on_track' },
];

function ProgressBar({ value, danger }: { value: number; danger?: boolean }) {
  return (
    <div className="progress-bar w-full">
      <div
        className={cn('progress-fill', value >= 85 ? 'danger' : value >= 70 ? 'warning' : '')}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function ActiveChallengesPanel() {
  return (
    <div className="stat-card flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">Active Challenges</h2>
      <div className="space-y-4">
        {challenges.map((c) => (
          <div key={`${c.firm}-${c.accountSize}`} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{c.firm} {c.accountSize}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Phase {c.phase}</p>
              </div>
              {c.status === 'at_risk' ? (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--warning)]">
                  <AlertTriangle className="w-3 h-3" /> At Risk
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--profit)]">
                  <CheckCircle2 className="w-3 h-3" /> On Track
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                <span>Profit target</span>
                <span className="text-[var(--foreground)] font-medium">{c.profitPct}%</span>
              </div>
              <ProgressBar value={c.profitPct} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                <span>Daily DD used</span>
                <span className={cn('font-medium', c.dailyDDPct >= 70 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]')}>
                  {c.dailyDDPct}%
                </span>
              </div>
              <ProgressBar value={c.dailyDDPct} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
