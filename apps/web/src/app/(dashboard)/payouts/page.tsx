'use client';

import { useState } from 'react';
import { Plus, Download, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { MonthlyPnlChart } from '@/components/charts/monthly-pnl';
import { cn } from '@/lib/utils';
import { usePayouts, useRoiSummary } from '@/lib/hooks/use-payouts';
import { RecordPayoutModal } from '@/components/payouts/record-payout-modal';

const STATUS_CONF = {
  paid:     { label: 'Paid',     icon: CheckCircle2, color: 'text-[var(--profit)]',  bg: 'bg-[var(--profit)]/10 border-[var(--profit)]/30' },
  pending:  { label: 'Pending',  icon: Clock,         color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/30' },
  rejected: { label: 'Rejected', icon: XCircle,       color: 'text-[var(--loss)]',   bg: 'bg-[var(--loss)]/10 border-[var(--loss)]/30' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PayoutsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: payoutsData, isLoading: loadingPayouts } = usePayouts();
  const { data: roiData, isLoading: loadingRoi } = useRoiSummary();

  const _po = payoutsData?.data ?? payoutsData?.payouts ?? payoutsData ?? [];
  const payouts: any[] = Array.isArray(_po) ? _po : [];
  const totalInvested = roiData?.totalInvested ?? 0;
  const totalPayouts  = roiData?.totalPayouts  ?? 0;
  const netProfit     = roiData?.netProfit     ?? 0;
  const globalRoi     = roiData?.globalRoiPct  ?? 0;
  const byFirm: any[] = roiData?.byFirm ?? [];
  const maxRoi = byFirm.length > 0 ? Math.max(...byFirm.map((f: any) => f.roiPct ?? 0)) : 1;

  const isLoading = loadingPayouts || loadingRoi;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Payouts & ROI</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {isLoading ? '—' : `${payouts.length} payout${payouts.length !== 1 ? 's' : ''} recorded`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Record Payout
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested',  value: totalInvested ? `$${totalInvested.toLocaleString()}` : '—',  sub: 'Challenge costs + fees',   color: 'text-[var(--foreground)]' },
          { label: 'Total Payouts',   value: totalPayouts  ? `$${totalPayouts.toLocaleString()}`  : '—',  sub: 'From paid payouts',         color: 'text-[var(--profit)]' },
          { label: 'Net Profit',      value: totalInvested ? `$${netProfit.toLocaleString()}`     : '—',  sub: 'Payouts minus costs',       color: netProfit >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]' },
          { label: 'Global ROI',      value: totalInvested ? `${globalRoi >= 0 ? '+' : ''}${globalRoi.toFixed(1)}%` : '—', sub: '(Payouts−Costs)/Costs', color: globalRoi >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">{k.label}</p>
            {isLoading
              ? <div className="h-8 w-24 bg-[var(--secondary)] rounded animate-pulse mt-1" />
              : <p className={cn('text-2xl font-bold tabular-nums', k.color)}>{k.value}</p>}
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ROI by firm */}
        <div className="stat-card space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">ROI by Prop Firm</h2>
          {isLoading && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-[var(--secondary)] rounded animate-pulse" />)}
            </div>
          )}
          {!isLoading && byFirm.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No payout data yet</p>
          )}
          {!isLoading && byFirm.map((f: any) => (
            <div key={f.firmName ?? f.firm} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-[var(--foreground)]">{f.firmName ?? f.firm}</span>
                <span className={cn('font-bold', f.roiPct >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                  {f.roiPct >= 0 ? '+' : ''}{Number(f.roiPct).toFixed(0)}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.max(0, (Math.abs(f.roiPct) / Math.max(maxRoi, 1)) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                ${Number(f.totalCost ?? 0).toLocaleString()} → ${Number(f.totalPayouts ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Monthly revenue chart */}
        <div className="xl:col-span-2 stat-card">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Monthly Payout Revenue</h2>
          <MonthlyPnlChart />
        </div>
      </div>

      {/* Payout table */}
      <div className="stat-card overflow-hidden">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Payout History</h2>
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-[var(--muted-foreground)]">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        )}
        {!isLoading && payouts.length === 0 && (
          <p className="text-center py-8 text-sm text-[var(--muted-foreground)]">No payouts recorded yet. Click "Record Payout" to add one.</p>
        )}
        {!isLoading && payouts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Date', 'Firm', 'Account', 'Amount', 'Gross Profit', 'Split', 'Method', 'Days', 'Status'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)] pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any) => {
                  const statusKey = (p.status ?? 'pending') as keyof typeof STATUS_CONF;
                  const cfg = STATUS_CONF[statusKey] ?? STATUS_CONF.pending;
                  const StatusIcon = cfg.icon;
                  const amount = Number(p.amount ?? 0);
                  const grossProfit = Number(p.grossProfit ?? 0);
                  const profitSplit = Number(p.profitSplitPct ?? p.split ?? 0);
                  const firmName = p.propFirmAccount?.propFirm?.name ?? p.firm ?? '—';
                  const accountLabel = p.propFirmAccount?.accountName ?? p.account ?? '—';
                  const processingDays = p.processingDays ?? null;

                  return (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors">
                      <td className="py-3 pr-4 text-[var(--muted-foreground)] text-xs">{p.requestedAt ? fmtDate(p.requestedAt) : '—'}</td>
                      <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">{firmName}</td>
                      <td className="py-3 pr-4 text-xs text-[var(--muted-foreground)]">{accountLabel}</td>
                      <td className="py-3 pr-4 font-bold text-[var(--profit)] tabular-nums">${amount.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-[var(--muted-foreground)] tabular-nums">{grossProfit > 0 ? `$${grossProfit.toLocaleString()}` : '—'}</td>
                      <td className="py-3 pr-4 text-[var(--muted-foreground)]">{profitSplit > 0 ? `${profitSplit}%` : '—'}</td>
                      <td className="py-3 pr-4 text-xs text-[var(--muted-foreground)]">{p.paymentMethod ?? '—'}</td>
                      <td className="py-3 pr-4 text-xs text-[var(--muted-foreground)]">{processingDays ? `${processingDays}d` : '—'}</td>
                      <td className="py-3">
                        <span className={cn('flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-1 rounded-full border', cfg.color, cfg.bg)}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAdd && <RecordPayoutModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
