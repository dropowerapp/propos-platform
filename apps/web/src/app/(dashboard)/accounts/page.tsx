'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Building2, CheckCircle2, XCircle, TrendingUp, Loader2,
  Target, Archive, DollarSign, CalendarClock, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts, usePortfolioSummary } from '@/lib/hooks/use-accounts';
import { AddAccountModal } from '@/components/accounts/add-account-modal';
import { EditAccountModal } from '@/components/accounts/edit-account-modal';
import { ChallengeCard } from '@/components/dashboard/challenge-card';

// ─── Lifecycle tabs ────────────────────────────────────────────────────────────
// One entity (PropFirmAccount), one page, three lifecycle stages.

type LifecycleTab = 'evaluation' | 'funded' | 'archived';

const TABS: { id: LifecycleTab; label: string; icon: React.ElementType }[] = [
  { id: 'evaluation', label: 'Evaluation', icon: Target },
  { id: 'funded',     label: 'Funded',     icon: TrendingUp },
  { id: 'archived',   label: 'Archived',   icon: Archive },
];

const FIRM_COLORS = ['#1a5f6a', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

// ─── Evaluation: map account → ChallengeCard shape ────────────────────────────

function accountToChallenge(a: any) {
  const rules = a.rulesSnapshot ?? {};
  const size = Number(a.accountSize ?? 0);
  const pnl = Number(a.totalPnl ?? 0);
  const profitTargetPct = Number(rules.profitTargetPct ?? 10);
  const currentProfitPct = size > 0 ? (pnl / size) * 100 : 0;
  const profitPctOfTarget = profitTargetPct > 0 ? Math.min(100, (currentProfitPct / profitTargetPct) * 100) : 0;

  const dailyDrawdownAllowed = Number(rules.dailyDrawdownPct ?? 5);
  const maxDrawdownAllowed = Number(rules.maxDrawdownPct ?? 10);
  const dailyDDPctOfLimit = Number(a.dailyDrawdownUsedPct ?? 0);
  const maxDDPctOfLimit = Number(a.maxDrawdownUsedPct ?? 0);

  const tradingDaysCompleted = Number(a.tradingDaysCompleted ?? 0);
  const minTradingDays = Number(rules.minTradingDays ?? 0);

  const firmName = a.propFirm?.name ?? a.firm ?? 'Unknown';
  const sizeLabel = size >= 1000 ? `${(size / 1000).toFixed(0)}k` : `${size}`;

  const isAtRisk = dailyDDPctOfLimit >= 70 || maxDDPctOfLimit >= 80;
  const cardStatus = isAtRisk ? 'at_risk' : 'on_track';

  const startedAt = a.purchasedAt
    ? new Date(a.purchasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const remainingPct = Math.max(0, profitTargetPct - currentProfitPct);
  const estDays = remainingPct > 0 ? Math.ceil(remainingPct / 0.5) : null;
  const estPassDate = estDays
    ? new Date(Date.now() + estDays * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return {
    id: a.id,
    firm: firmName,
    accountSize: sizeLabel,
    phase: a.phase ?? a.currentPhase ?? 1,
    status: cardStatus,
    profitTargetPct,
    currentProfitPct,
    profitPctOfTarget,
    dailyDrawdownAllowed,
    dailyDrawdownUsedPct: (dailyDDPctOfLimit / 100) * dailyDrawdownAllowed,
    dailyDDPctOfLimit,
    maxDrawdownAllowed,
    maxDrawdownUsedPct: (maxDDPctOfLimit / 100) * maxDrawdownAllowed,
    maxDDPctOfLimit,
    minTradingDays,
    tradingDaysCompleted,
    startedAt,
    estPassDate,
    balance: size + pnl,
    accountSizeUsd: size,
  };
}

// Demo data shown when API has no accounts
const DEMO_CHALLENGES = [
  {
    id: '1', firm: 'FTMO', accountSize: '100k', phase: 2, status: 'on_track',
    profitTargetPct: 5, currentProfitPct: 3.65, profitPctOfTarget: 73,
    dailyDrawdownAllowed: 5, dailyDrawdownUsedPct: 0.9, dailyDDPctOfLimit: 18,
    maxDrawdownAllowed: 10, maxDrawdownUsedPct: 2.8, maxDDPctOfLimit: 28,
    minTradingDays: 5, tradingDaysCompleted: 4,
    startedAt: 'Jan 10', estPassDate: 'Jan 17',
    balance: 103650, accountSizeUsd: 100000,
  },
  {
    id: '2', firm: 'FundingPips', accountSize: '200k', phase: 1, status: 'at_risk',
    profitTargetPct: 8, currentProfitPct: 3.28, profitPctOfTarget: 41,
    dailyDrawdownAllowed: 4, dailyDrawdownUsedPct: 3.16, dailyDDPctOfLimit: 79,
    maxDrawdownAllowed: 8, maxDrawdownUsedPct: 2.8, maxDDPctOfLimit: 35,
    minTradingDays: 3, tradingDaysCompleted: 8,
    startedAt: 'Jan 5', estPassDate: null,
    balance: 206560, accountSizeUsd: 200000,
  },
  {
    id: '3', firm: 'E8 Markets', accountSize: '50k', phase: 1, status: 'on_track',
    profitTargetPct: 8, currentProfitPct: 4.8, profitPctOfTarget: 60,
    dailyDrawdownAllowed: 5, dailyDrawdownUsedPct: 1.1, dailyDDPctOfLimit: 22,
    maxDrawdownAllowed: 8, maxDrawdownUsedPct: 1.44, maxDDPctOfLimit: 18,
    minTradingDays: 3, tradingDaysCompleted: 6,
    startedAt: 'Jan 8', estPassDate: 'Jan 20',
    balance: 52400, accountSizeUsd: 50000,
  },
];

const DEMO_FUNDED = [
  {
    id: 'f1', firm: 'FTMO', size: 200000, pnl: 14820, split: 90,
    payoutEligibleIn: 3, nextPayoutEst: 13338, totalPayouts: 28400, fundedSince: 'Aug 2024',
  },
  {
    id: 'f2', firm: 'The5ers', size: 100000, pnl: 6240, split: 80,
    payoutEligibleIn: 0, nextPayoutEst: 4992, totalPayouts: 11200, fundedSince: 'Nov 2024',
  },
];

// ─── Funded account card ──────────────────────────────────────────────────────

function FundedCard({ a, color, onEdit }: { a: any; color: string; onEdit?: () => void }) {
  const size = Number(a.size ?? a.accountSize ?? 0);
  const pnl = Number(a.pnl ?? a.totalPnl ?? 0);
  const split = Number(a.split ?? a.profitSplitPct ?? 80);
  const eligibleIn = a.payoutEligibleIn ?? null;
  const nextPayout = a.nextPayoutEst ?? (pnl > 0 ? Math.round(pnl * (split / 100)) : 0);
  const totalPayouts = Number(a.totalPayouts ?? 0);
  const firmName = a.propFirm?.name ?? a.firm ?? 'Unknown';

  return (
    <div className="stat-card hover:border-[var(--muted-foreground)] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}20`, border: `1px solid ${color}40` }}
          >
            <TrendingUp className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              {firmName} ${(size / 1000).toFixed(0)}k
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Funded{a.fundedSince ? ` since ${a.fundedSince}` : ''} · {split}% split
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button onClick={onEdit} className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" title="Edit account">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border text-purple-400 bg-purple-400/10 border-purple-400/30">
            <TrendingUp className="w-3 h-3" /> Funded
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-xs text-[var(--muted-foreground)]">Open P&L</p>
          <p className={cn('text-sm font-bold tabular-nums', pnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
            {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--muted-foreground)]">Next Payout (est.)</p>
          <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">
            {nextPayout > 0 ? `$${nextPayout.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--muted-foreground)]">Lifetime Payouts</p>
          <p className="text-sm font-bold text-[var(--profit)] tabular-nums">
            {totalPayouts > 0 ? `$${totalPayouts.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {/* Payout eligibility */}
      <div className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2.5 border',
        eligibleIn === 0
          ? 'bg-[var(--profit)]/8 border-[var(--profit)]/25'
          : 'bg-[var(--secondary)] border-[var(--border)]',
      )}>
        <CalendarClock className={cn('w-4 h-4 shrink-0', eligibleIn === 0 ? 'text-[var(--profit)]' : 'text-[var(--muted-foreground)]')} />
        <p className={cn('text-xs font-medium flex-1', eligibleIn === 0 ? 'text-[var(--profit)]' : 'text-[var(--muted-foreground)]')}>
          {eligibleIn === 0
            ? 'Payout available now — request it from your firm dashboard'
            : eligibleIn != null
              ? `Payout eligible in ${eligibleIn} day${eligibleIn !== 1 ? 's' : ''}`
              : 'Payout cycle not tracked yet'}
        </p>
        {eligibleIn === 0 && <DollarSign className="w-3.5 h-3.5 text-[var(--profit)] shrink-0" />}
      </div>
    </div>
  );
}

// ─── Archived account card (passed / failed) ──────────────────────────────────

function ArchivedCard({ a, color, onEdit }: { a: any; color: string; onEdit?: () => void }) {
  const passed = a.status === 'passed';
  const size = Number(a.accountSize ?? 0);
  const pnl = Number(a.totalPnl ?? 0);
  const cost = Number(a.totalCost ?? a.challengeCost ?? 0);
  const firmName = a.propFirm?.name ?? a.firm ?? 'Unknown';
  const endedAt = a.passedAt ?? a.failedAt;
  const Icon = passed ? CheckCircle2 : XCircle;

  return (
    <div className="stat-card opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <Building2 className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {firmName} ${(size / 1000).toFixed(0)}k
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {endedAt ? new Date(endedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
              {cost > 0 ? ` · $${cost.toLocaleString()} cost` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className={cn('text-sm font-bold tabular-nums', pnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
            {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString()}
          </p>
          <span className={cn(
            'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
            passed
              ? 'text-[var(--profit)] bg-[var(--profit)]/10 border-[var(--profit)]/30'
              : 'text-[var(--loss)] bg-[var(--loss)]/10 border-[var(--loss)]/30',
          )}>
            <Icon className="w-3 h-3" /> {passed ? 'Passed' : 'Failed'}
          </span>
          {onEdit && (
            <button onClick={onEdit} className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" title="Edit account">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const [tab, setTab] = useState<LifecycleTab>('evaluation');
  const [showAdd, setShowAdd] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  // Arriving from "I bought this challenge" in the Firm Hub — open the add modal
  useEffect(() => {
    try {
      if (localStorage.getItem('propos_pending_firm')) {
        localStorage.removeItem('propos_pending_firm');
        setShowAdd(true);
      }
    } catch {}
  }, []);

  // Status mapping per tab
  const statusFilter = tab === 'evaluation' ? 'active' : tab === 'funded' ? 'funded' : undefined;
  const { data: accountsData, isLoading } = useAccounts(statusFilter);
  const { data: portfolio } = usePortfolioSummary();

  const _acc = accountsData?.data ?? accountsData?.accounts ?? accountsData ?? [];
  const rawAccounts: any[] = Array.isArray(_acc) ? _acc : [];
  const byStatus = (portfolio?.byStatus ?? {}) as any;
  const total = portfolio?.totalAccounts ?? 0;

  // Archived = passed + failed (client-side filter since API filter is single-status)
  const archivedAccounts = tab === 'archived'
    ? rawAccounts.filter((a: any) => a.status === 'passed' || a.status === 'failed')
    : [];

  const counts: Record<LifecycleTab, number> = {
    evaluation: byStatus.active ?? 0,
    funded: byStatus.funded ?? 0,
    archived: (byStatus.passed ?? 0) + (byStatus.failed ?? 0),
  };

  // Evaluation tab data (with demo fallback)
  const evalAccounts = tab === 'evaluation' ? rawAccounts : [];
  const challenges = evalAccounts.length > 0
    ? evalAccounts.map(accountToChallenge)
    : (tab === 'evaluation' && !isLoading ? DEMO_CHALLENGES : []);
  const isDemoEval = tab === 'evaluation' && evalAccounts.length === 0 && !isLoading;

  // Funded tab data (with demo fallback)
  const fundedAccounts = tab === 'funded'
    ? (rawAccounts.length > 0 ? rawAccounts : (!isLoading ? DEMO_FUNDED : []))
    : [];
  const isDemoFunded = tab === 'funded' && rawAccounts.length === 0 && !isLoading;

  const isDemo = isDemoEval || isDemoFunded;

  const onTrackCount = challenges.filter((c: any) => c.status === 'on_track').length;
  const atRiskCount = challenges.filter((c: any) => c.status === 'at_risk').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            Accounts
            {isDemo && (
              <span className="text-xs font-normal text-[var(--muted-foreground)] bg-[var(--secondary)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                demo
              </span>
            )}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {total > 0
              ? `${total} account${total !== 1 ? 's' : ''} across all firms`
              : 'Your prop firm accounts, from evaluation to funded'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Lifecycle tabs */}
      <div className="flex gap-0 border-b border-[var(--border)]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              tab === id ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
            )}>
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading accounts…
        </div>
      )}

      {/* ── Tab: Evaluation ── */}
      {!isLoading && tab === 'evaluation' && (
        <>
          {challenges.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'In Evaluation', value: String(challenges.length), color: 'text-blue-400' },
                { label: 'On Track', value: String(onTrackCount), color: 'text-[var(--profit)]' },
                { label: 'At Risk', value: String(atRiskCount), color: 'text-[var(--warning)]' },
              ].map(s => (
                <div key={s.label} className="stat-card text-center py-3">
                  <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {challenges.length > 0 ? (
            <div className="space-y-4">
              {challenges.map((c: any) => {
                // Only real accounts (not demo) can be edited
                const raw = evalAccounts.find((a: any) => a.id === c.id);
                return (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    onEdit={raw ? () => setEditingAccount(raw) : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No accounts in evaluation"
              sub="Add a prop firm account to track your challenge progress in real time."
              onAdd={() => setShowAdd(true)}
            />
          )}
        </>
      )}

      {/* ── Tab: Funded ── */}
      {!isLoading && tab === 'funded' && (
        fundedAccounts.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {fundedAccounts.map((a: any, i: number) => (
              <FundedCard
                key={a.id}
                a={a}
                color={FIRM_COLORS[i % FIRM_COLORS.length]}
                onEdit={isDemoFunded ? undefined : () => setEditingAccount(a)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No funded accounts yet"
            sub="When you pass an evaluation, your funded accounts and payout tracking appear here."
            onAdd={() => setShowAdd(true)}
          />
        )
      )}

      {/* ── Tab: Archived ── */}
      {!isLoading && tab === 'archived' && (
        archivedAccounts.length > 0 ? (
          <div className="space-y-3">
            {archivedAccounts.map((a: any, i: number) => (
              <ArchivedCard
                key={a.id}
                a={a}
                color={FIRM_COLORS[i % FIRM_COLORS.length]}
                onEdit={() => setEditingAccount(a)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Archive}
            title="No archived accounts"
            sub="Passed and failed challenges are archived here for your records and success-rate tracking."
            onAdd={() => setShowAdd(true)}
          />
        )
      )}

      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} />}
      {editingAccount && <EditAccountModal account={editingAccount} onClose={() => setEditingAccount(null)} />}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, onAdd }: {
  icon: React.ElementType; title: string; sub: string; onAdd: () => void;
}) {
  return (
    <div className="stat-card text-center py-16">
      <Icon className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
      <p className="text-[var(--foreground)] font-medium mb-1">{title}</p>
      <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-sm mx-auto">{sub}</p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" /> Add Account
      </button>
    </div>
  );
}
