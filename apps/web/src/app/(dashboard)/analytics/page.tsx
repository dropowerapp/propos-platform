'use client';

import { useState } from 'react';
import { EquityCurveChart } from '@/components/charts/equity-curve';
import { BreakdownTable } from '@/components/dashboard/breakdown-table';
import { HeatmapChart } from '@/components/charts/heatmap';
import { useAnalyticsOverview, useAnalyticsBreakdown } from '@/lib/hooks/use-analytics';
import { FirmPerformancePanel } from '@/components/dashboard/firm-performance-panel';

const TABS = ['Overview', 'By Firm', 'By Strategy', 'By Session', 'By Symbol', 'Psychology'] as const;
type Tab = typeof TABS[number];

const GROUP_MAP: Record<Tab, string> = {
  'Overview': 'session',
  'By Firm': 'firm',
  'By Strategy': 'strategy',
  'By Session': 'session',
  'By Symbol': 'symbol',
  'Psychology': 'dayOfWeek',
};

function fmt(v: number | undefined | null, decimals = 2) {
  if (v == null) return '—';
  return v.toFixed(decimals);
}

function pct(v: number | undefined | null) {
  if (v == null) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [accountFilter, setAccountFilter] = useState('');
  const [rangeFilter, setRangeFilter] = useState('90');

  const params: Record<string, string> = {};
  if (accountFilter) params.accountId = accountFilter;
  if (rangeFilter) params.days = rangeFilter;

  const { data: overview, isLoading } = useAnalyticsOverview(params);
  const { data: breakdown } = useAnalyticsBreakdown(GROUP_MAP[activeTab], params);

  const breakdownRaw = breakdown?.data ?? breakdown?.rows ?? breakdown ?? [];
  const breakdownRows: any[] = Array.isArray(breakdownRaw) ? breakdownRaw : [];

  const winRate      = overview?.winRate      ?? null;
  const profitFactor = overview?.profitFactor ?? null;
  const expectancy   = overview?.expectancy   ?? null;
  const sharpe       = overview?.sharpe       ?? null;
  const maxDrawdown  = overview?.maxDrawdown  ?? null;
  const avgRMultiple = overview?.avgRMultiple ?? null;

  const metrics = [
    { label: 'Win Rate',      value: winRate      != null ? pct(winRate)              : '—', sub: '↑ vs prev period', pos: true },
    { label: 'Profit Factor', value: profitFactor != null ? fmt(profitFactor)          : '—', sub: '↑ vs prev period', pos: true },
    { label: 'Expectancy',    value: expectancy   != null ? `$${fmt(expectancy, 0)}`   : '—', sub: 'per trade',        pos: expectancy != null && expectancy > 0 },
    { label: 'Sharpe Ratio',  value: sharpe       != null ? fmt(sharpe)                : '—', sub: 'annualised',       pos: sharpe != null && sharpe > 1 },
    { label: 'Max Drawdown',  value: maxDrawdown  != null ? `${fmt(maxDrawdown, 1)}%`  : '—', sub: 'peak-to-trough',   pos: false },
    { label: 'Avg R-Multiple',value: avgRMultiple != null ? `${fmt(avgRMultiple)}R`    : '—', sub: 'per trade',        pos: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Performance Analytics</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            All accounts · Last {rangeFilter} days
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            className="text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--foreground)] focus:outline-none"
          >
            <option value="">All Accounts</option>
          </select>
          <select
            value={rangeFilter}
            onChange={e => setRangeFilter(e.target.value)}
            className="text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--foreground)] focus:outline-none"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">This year</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === activeTab
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="stat-card text-center">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">{m.label}</p>
            {isLoading
              ? <div className="h-7 w-16 bg-[var(--secondary)] rounded animate-pulse mx-auto" />
              : <p className="text-xl font-bold text-[var(--foreground)] tabular-nums">{m.value}</p>
            }
            <p className={`text-xs mt-1 ${
              m.pos === true  ? 'text-[var(--profit)]' :
              m.pos === false ? 'text-[var(--loss)]'   :
              'text-[var(--muted-foreground)]'
            }`}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Equity + Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="stat-card">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Equity Curve</h2>
          <EquityCurveChart data={overview?.equityCurve} />
        </div>
        <div className="stat-card">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Performance Heatmap</h2>
          <HeatmapChart />
        </div>
      </div>

      {/* Breakdown */}
      {activeTab === 'By Firm'
        ? <FirmPerformancePanel rows={breakdownRows} />
        : <BreakdownTable data={breakdownRows} groupBy={GROUP_MAP[activeTab]} />}
    </div>
  );
}
