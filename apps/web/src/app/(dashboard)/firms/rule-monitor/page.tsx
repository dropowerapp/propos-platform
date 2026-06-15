'use client';

import { useState } from 'react';
import { ShieldAlert, Bell, ArrowRight, Clock, AlertTriangle, Info, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Static seed data — replace with PropFirmRuleChange API when live ─────────

type ChangeType = 'drawdown' | 'payout' | 'consistency' | 'cost' | 'platform' | 'overnight';

interface RuleChange {
  id: string;
  firm: string;
  firmColor: string;
  type: ChangeType;
  title: string;
  previous: string;
  current: string;
  impact: 'high' | 'medium' | 'low';
  date: string;
  source: string;
}

const CHANGES: RuleChange[] = [
  {
    id: '1', firm: 'FTMO', firmColor: '#00c4cc',
    type: 'payout',
    title: 'Payout cycle reduced from 30 to 14 days',
    previous: '30-day payout cycle',
    current: '14-day on-demand payout',
    impact: 'low',
    date: 'Jan 15, 2025',
    source: 'FTMO Official Blog',
  },
  {
    id: '2', firm: 'FundingPips', firmColor: '#6c47ff',
    type: 'consistency',
    title: 'Consistency rule tightened to 30% cap',
    previous: 'No single day > 40% of total profit',
    current: 'No single day > 30% of total profit',
    impact: 'high',
    date: 'Jan 10, 2025',
    source: 'FundingPips Discord',
  },
  {
    id: '3', firm: 'Alpha Capital', firmColor: '#ef4444',
    type: 'drawdown',
    title: 'Max drawdown reduced from 12% to 10%',
    previous: '12% max drawdown',
    current: '10% max drawdown',
    impact: 'high',
    date: 'Dec 28, 2024',
    source: 'Alpha Capital Terms Update',
  },
  {
    id: '4', firm: 'The5ers', firmColor: '#00b4d8',
    type: 'cost',
    title: 'Challenge prices increased across all tiers',
    previous: '$95 – $595',
    current: '$95 – $645',
    impact: 'medium',
    date: 'Dec 20, 2024',
    source: 'The5ers Website',
  },
  {
    id: '5', firm: 'Apex', firmColor: '#f97316',
    type: 'platform',
    title: 'NinjaTrader 8 becomes mandatory platform',
    previous: 'NT7, NT8, Rithmic supported',
    current: 'NT8 and Rithmic only (NT7 deprecated)',
    impact: 'medium',
    date: 'Dec 15, 2024',
    source: 'Apex Trader Funding Email',
  },
  {
    id: '6', firm: 'Topstep', firmColor: '#10b981',
    type: 'overnight',
    title: 'Overnight holding now fully restricted',
    previous: 'Limited overnight allowed',
    current: 'No overnight positions permitted',
    impact: 'high',
    date: 'Dec 5, 2024',
    source: 'Topstep Rule Update Email',
  },
];

const IMPACT_CONFIG = {
  high:   { label: 'High Impact',   color: 'text-[var(--loss)]',    bg: 'bg-[var(--loss)]/10 border-[var(--loss)]/30',    icon: AlertTriangle },
  medium: { label: 'Medium Impact', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/30', icon: Info },
  low:    { label: 'Low Impact',    color: 'text-[var(--profit)]',  bg: 'bg-[var(--profit)]/10 border-[var(--profit)]/30',  icon: Info },
};

const TYPE_LABELS: Record<ChangeType, string> = {
  drawdown: 'Drawdown', payout: 'Payout', consistency: 'Consistency',
  cost: 'Cost', platform: 'Platform', overnight: 'Overnight',
};

export default function RuleMonitorPage() {
  const [filter, setFilter] = useState<'all' | ChangeType>('all');

  const filtered = filter === 'all' ? CHANGES : CHANGES.filter(c => c.type === filter);
  const highImpact = CHANGES.filter(c => c.impact === 'high').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Rule Monitor</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Track rule changes across all prop firms in real time
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
          <Bell className="w-4 h-4" /> Set Alerts
        </button>
      </div>

      {/* Summary banner */}
      {highImpact > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--loss)]/8 border border-[var(--loss)]/25">
          <AlertTriangle className="w-4 h-4 text-[var(--loss)] shrink-0" />
          <p className="text-sm text-[var(--loss)]/90 font-medium">
            {highImpact} high-impact rule change{highImpact > 1 ? 's' : ''} in the last 60 days — review before trading
          </p>
        </div>
      )}

      {/* Type filters */}
      <div className="flex flex-wrap gap-1.5">
        {['all', ...Object.keys(TYPE_LABELS)].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
              filter === t
                ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                : 'text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
            )}
          >
            {t === 'all' ? 'All Changes' : TYPE_LABELS[t as ChangeType]}
          </button>
        ))}
      </div>

      {/* Change feed */}
      <div className="space-y-3">
        {filtered.map(change => {
          const impact = IMPACT_CONFIG[change.impact];
          const ImpactIcon = impact.icon;
          return (
            <div key={change.id} className="stat-card space-y-3">
              <div className="flex items-start gap-3">
                {/* Firm badge */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
                  style={{ background: change.firmColor }}
                >
                  {change.firm[0]}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-[var(--foreground)]">{change.firm}</span>
                        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                          {TYPE_LABELS[change.type]}
                        </span>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1', impact.color, impact.bg)}>
                          <ImpactIcon className="w-3 h-3" /> {impact.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{change.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] shrink-0">
                      <Clock className="w-3 h-3" /> {change.date}
                    </div>
                  </div>

                  {/* Before / After */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-[var(--loss)]/5 border border-[var(--loss)]/15 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-medium text-[var(--loss)]/70 uppercase tracking-wider mb-1">Previous</p>
                      <p className="text-xs text-[var(--foreground)]">{change.previous}</p>
                    </div>
                    <div className="bg-[var(--profit)]/5 border border-[var(--profit)]/15 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-medium text-[var(--profit)]/70 uppercase tracking-wider mb-1">Current</p>
                      <p className="text-xs text-[var(--foreground)]">{change.current}</p>
                    </div>
                  </div>

                  {/* Source */}
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Source: {change.source}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="stat-card text-center py-12">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No rule changes in this category</p>
        </div>
      )}

      {/* Subscribe CTA */}
      <div className="stat-card border-dashed flex items-center gap-4">
        <Bell className="w-8 h-8 text-[var(--primary)] shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Get Instant Rule Change Alerts</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Be notified immediately when a firm changes its rules so you can adapt your strategy.
          </p>
        </div>
        <button className="ml-auto px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
          Enable Alerts
        </button>
      </div>
    </div>
  );
}
