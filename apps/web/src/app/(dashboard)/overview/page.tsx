'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EquityCurveChart } from '@/components/charts/equity-curve';
import { ActiveChallengesPanel } from '@/components/dashboard/active-challenges';
import { RoiByFirmPanel } from '@/components/dashboard/roi-by-firm';
import { MonthlyPnlChart } from '@/components/charts/monthly-pnl';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { TodayStrip } from '@/components/dashboard/today-strip';
import { AiInsightCards } from '@/components/dashboard/ai-insight-cards';
import { usePortfolioSummary } from '@/lib/hooks/use-accounts';
import { useRoiSummary } from '@/lib/hooks/use-payouts';
import {
  TrendingUp, DollarSign, Percent, Building2, Trophy, Wallet,
  Sparkles, ArrowRight, X,
} from 'lucide-react';

function StatCard({
  title, value, change, changeType, icon: Icon, iconColor, subValues, highlight,
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  iconColor: string;
  subValues?: Array<{ label: string; value: string; color: string }>;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card flex items-start gap-3 ${highlight ? 'ring-1 ring-[var(--primary)]/30' : ''}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${highlight ? 'bg-[var(--primary)]/15' : 'bg-[var(--secondary)]'}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--muted-foreground)]">{title}</p>
        <p className="text-xl font-bold text-[var(--foreground)] tabular-nums mt-0.5">{value}</p>
        {change && (
          <p className={`text-xs mt-1 ${
            changeType === 'positive' ? 'text-[var(--profit)]' :
            changeType === 'negative' ? 'text-[var(--loss)]' :
            'text-[var(--muted-foreground)]'
          }`}>{change}</p>
        )}
        {subValues && (
          <div className="flex gap-3 mt-1.5">
            {subValues.map(s => (
              <div key={s.label}>
                <p className={`text-xs font-bold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(n: number, prefix = '$') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}k`;
  return `${prefix}${n.toLocaleString()}`;
}

export default function OverviewPage() {
  const { data: portfolio } = usePortfolioSummary();
  const { data: roiData } = useRoiSummary();

  // Onboarding CTA: show when the user has no accounts and hasn't completed/dismissed onboarding
  const [showOnboardingCta, setShowOnboardingCta] = useState(false);
  useEffect(() => {
    try {
      const onboarded = localStorage.getItem('propos_onboarded') === '1';
      const dismissed = localStorage.getItem('propos_onboarding_dismissed') === '1';
      setShowOnboardingCta(!onboarded && !dismissed);
    } catch {}
  }, []);
  function dismissOnboarding() {
    try { localStorage.setItem('propos_onboarding_dismissed', '1'); } catch {}
    setShowOnboardingCta(false);
  }

  const totalInvested = roiData?.totalInvested ?? 0;
  const totalPayouts  = roiData?.totalPayouts  ?? 0;
  const globalRoi     = roiData?.globalRoiPct  ?? 0;
  const netProfit     = totalPayouts - totalInvested;

  const byStatus     = portfolio?.byStatus ?? {};
  const fundedCount  = (byStatus as any)?.funded  ?? 0;
  const activeCount  = (byStatus as any)?.active  ?? 0;
  const failedCount  = (byStatus as any)?.failed  ?? 0;
  const passedCount  = (byStatus as any)?.passed  ?? fundedCount;
  const totalAccounts = portfolio?.totalAccounts ?? 0;

  // Challenge success rate derived from account statuses
  const totalStarted = totalAccounts;
  const totalPassed  = passedCount + fundedCount;
  const successRate  = totalStarted > 0
    ? Math.round((totalPassed / totalStarted) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Your trading business at a glance</p>
      </div>

      {/* Today strip — what matters right now */}
      <TodayStrip />

      {/* Onboarding CTA for new users */}
      {showOnboardingCta && totalAccounts === 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/8 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">Set up PropOS in under 3 minutes</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Add your prop firm accounts and import your trades — your dashboard, analytics and AI coach all run on your real data.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={dismissOnboarding}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 1 — Core KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Capital Invested"
          value={totalInvested ? fmt(totalInvested) : '—'}
          change={totalInvested ? 'challenge fees & costs' : 'No accounts yet'}
          changeType="neutral"
          icon={DollarSign}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Total Payouts"
          value={totalPayouts ? fmt(totalPayouts) : '—'}
          change={totalPayouts ? 'lifetime earnings' : 'No payouts yet'}
          changeType={totalPayouts > 0 ? 'positive' : 'neutral'}
          icon={TrendingUp}
          iconColor="text-[var(--profit)]"
        />
        <StatCard
          title="Global ROI"
          value={totalInvested ? `${globalRoi >= 0 ? '+' : ''}${globalRoi.toFixed(0)}%` : '—'}
          change={globalRoi > 0 ? '↑ on invested capital' : totalInvested ? '↓ net loss so far' : 'Add accounts to track'}
          changeType={globalRoi > 0 ? 'positive' : globalRoi < 0 ? 'negative' : 'neutral'}
          icon={Percent}
          iconColor="text-[var(--profit)]"
        />
        <StatCard
          title="Prop Accounts"
          value={String(totalAccounts || '0')}
          subValues={[
            { label: 'Active', value: String(activeCount), color: 'text-blue-400' },
            { label: 'Funded', value: String(fundedCount), color: 'text-[var(--profit)]' },
            { label: 'Failed', value: String(failedCount), color: 'text-[var(--loss)]' },
          ]}
          icon={Building2}
          iconColor="text-purple-400"
        />
      </div>

      {/* Row 2 — New KPIs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Challenge Success Rate */}
        <div className="stat-card ring-1 ring-[var(--primary)]/20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--muted-foreground)]">Challenge Success Rate</p>
              <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums mt-0.5">
                {successRate !== null ? `${successRate}%` : '—'}
              </p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{totalStarted || '—'}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Started</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--profit)] tabular-nums">{totalPassed || '—'}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Passed</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--loss)] tabular-nums">{failedCount || '—'}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Failed</p>
                </div>
              </div>
              {successRate !== null && (
                <div className="mt-3 progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lifetime Net Profit */}
        <div className="stat-card ring-1 ring-[var(--warning)]/20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--warning)]/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--muted-foreground)]">Lifetime Net Profit</p>
              <p className={`text-2xl font-bold tabular-nums mt-0.5 ${netProfit >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                {totalInvested ? `${netProfit >= 0 ? '+' : ''}${fmt(netProfit)}` : '—'}
              </p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-sm font-bold text-[var(--profit)] tabular-nums">{totalPayouts ? fmt(totalPayouts) : '—'}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Total Payouts</p>
                </div>
                <div className="text-[var(--muted-foreground)] self-center text-xs">−</div>
                <div>
                  <p className="text-sm font-bold text-[var(--loss)] tabular-nums">{totalInvested ? fmt(totalInvested) : '—'}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Total Costs</p>
                </div>
              </div>
              {totalInvested > 0 && (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
                  Includes challenge fees, activation & reset costs
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coach insights pushed to the dashboard */}
      <AiInsightCards />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Portfolio Equity Curve</h2>
            <div className="flex gap-1">
              {['1M', '3M', '6M', '1Y', 'All'].map((r) => (
                <button
                  key={r}
                  className={`text-xs px-2 py-0.5 rounded ${r === '6M' ? 'bg-[var(--primary)] text-black' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <EquityCurveChart />
        </div>
        <ActiveChallengesPanel />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <RoiByFirmPanel />
        <div className="xl:col-span-2 stat-card">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Monthly P&L</h2>
          <MonthlyPnlChart />
        </div>
      </div>

      {/* Alerts */}
      <RecentAlerts />
    </div>
  );
}
