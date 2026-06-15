import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, TrendingUp, ChevronRight, Pencil } from 'lucide-react';

interface Challenge {
  id: string; firm: string; accountSize: string; phase: number; status: string;
  profitTargetPct: number; currentProfitPct: number; profitPctOfTarget: number;
  dailyDrawdownAllowed: number; dailyDrawdownUsedPct: number; dailyDDPctOfLimit: number;
  maxDrawdownAllowed: number; maxDrawdownUsedPct: number; maxDDPctOfLimit: number;
  minTradingDays: number; tradingDaysCompleted: number;
  startedAt: string; estPassDate: string | null;
  balance: number; accountSizeUsd: number;
}

function ProgressRow({ label, used, pctOfLimit, allowed, unit = '%' }: {
  label: string; used: number; pctOfLimit: number; allowed: number; unit?: string;
}) {
  const color = pctOfLimit >= 85 ? 'danger' : pctOfLimit >= 70 ? 'warning' : '';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--muted-foreground)]">{label}</span>
        <span className={cn('font-medium', color === 'danger' ? 'text-[var(--loss)]' : color === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--foreground)]')}>
          {used.toFixed(1)}{unit} / {allowed}{unit}
        </span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${color}`} style={{ width: `${Math.min(100, pctOfLimit)}%` }} />
      </div>
    </div>
  );
}

export function ChallengeCard({ challenge: c, onEdit }: { challenge: Challenge; onEdit?: () => void }) {
  const isAtRisk = c.status === 'at_risk';
  return (
    <div className={cn('stat-card border', isAtRisk ? 'border-[var(--warning)]/40' : 'border-[var(--border)]')}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {c.firm} {c.accountSize} — Phase {c.phase}
            </h3>
            {isAtRisk ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> At Risk
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-[var(--profit)] bg-[var(--profit)]/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> On Track
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Started {c.startedAt} · Balance: ${c.balance.toLocaleString()}
            {c.estPassDate && ` · Est. pass: ${c.estPassDate}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          <button className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            View Trades <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressRow
          label={`Profit Target (${c.profitTargetPct}%)`}
          used={c.currentProfitPct}
          pctOfLimit={c.profitPctOfTarget}
          allowed={c.profitTargetPct}
        />
        <ProgressRow
          label={`Daily Drawdown (${c.dailyDrawdownAllowed}%)`}
          used={(c.dailyDDPctOfLimit / 100) * c.dailyDrawdownAllowed}
          pctOfLimit={c.dailyDDPctOfLimit}
          allowed={c.dailyDrawdownAllowed}
        />
        <ProgressRow
          label={`Max Drawdown (${c.maxDrawdownAllowed}%)`}
          used={(c.maxDDPctOfLimit / 100) * c.maxDrawdownAllowed}
          pctOfLimit={c.maxDDPctOfLimit}
          allowed={c.maxDrawdownAllowed}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>
          Trading Days: <span className="text-[var(--foreground)] font-semibold">{c.tradingDaysCompleted}/{c.minTradingDays}</span>
          {c.tradingDaysCompleted >= c.minTradingDays && ' ✅'}
        </span>
        <span>
          Remaining profit: <span className="text-[var(--profit)] font-semibold">
            {(c.profitTargetPct - c.currentProfitPct).toFixed(2)}%
          </span>
        </span>
        <span>
          DD buffer: <span className="font-semibold" style={{ color: c.dailyDDPctOfLimit >= 80 ? 'var(--warning)' : 'var(--profit)' }}>
            {(c.dailyDrawdownAllowed * (1 - c.dailyDDPctOfLimit / 100)).toFixed(2)}% remaining
          </span>
        </span>
      </div>
    </div>
  );
}
