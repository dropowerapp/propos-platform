import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubValue {
  label: string;
  value: string;
  color?: string;
}

interface StatCardProps {
  title: string;
  value?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  subValues?: SubValue[];
}

export function StatCard({ title, value, change, changeType, icon: Icon, iconColor, subValues }: StatCardProps) {
  return (
    <div className="stat-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">{title}</p>
        <div className={cn('p-1.5 rounded-md bg-[var(--secondary)]', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {value && (
        <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{value}</p>
      )}

      {subValues && (
        <div className="flex gap-4">
          {subValues.map((sv) => (
            <div key={sv.label}>
              <p className="text-xs text-[var(--muted-foreground)]">{sv.label}</p>
              <p className={cn('text-lg font-bold tabular-nums', sv.color ?? 'text-[var(--foreground)]')}>{sv.value}</p>
            </div>
          ))}
        </div>
      )}

      {change && (
        <p className={cn(
          'text-xs font-medium',
          changeType === 'positive' && 'text-[var(--profit)]',
          changeType === 'negative' && 'text-[var(--loss)]',
          changeType === 'neutral' && 'text-[var(--muted-foreground)]',
        )}>
          {change}
        </p>
      )}
    </div>
  );
}
