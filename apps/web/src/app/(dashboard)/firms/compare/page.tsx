'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitCompare, CheckCircle2, XCircle, Minus, ChevronDown, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirmHubTabs } from '@/components/firms/firm-hub-tabs';

// ─── Static firm data — replace with API when PropFirm table is populated ────

const FIRMS: Record<string, FirmData> = {
  ftmo: {
    name: 'FTMO',
    color: '#00c4cc',
    challengeCost: '$155 – $1,080',
    profitTarget: '10% Phase 1 · 5% Phase 2',
    dailyDrawdown: '5%',
    maxDrawdown: '10%',
    consistencyRule: 'No rule',
    payoutFrequency: 'On demand (14-day cycle)',
    scalingPlan: 'Yes — up to $2M',
    newsRestrictions: 'No major restriction',
    overnightHolding: 'Allowed',
    supportedPlatforms: 'MT4, MT5, cTrader',
    minTradingDays: '4 days (Phase 1)',
    profitSplit: '80% → 90%',
    refundable: true,
    trustScore: 94,
  },
  fundingpips: {
    name: 'FundingPips',
    color: '#6c47ff',
    challengeCost: '$49 – $498',
    profitTarget: '8% Phase 1 · 5% Phase 2',
    dailyDrawdown: '4%',
    maxDrawdown: '8%',
    consistencyRule: 'No single day > 40% of total profit',
    payoutFrequency: 'Weekly',
    scalingPlan: 'Yes — up to $4M',
    newsRestrictions: 'No trading 2 min before/after high-impact news',
    overnightHolding: 'Allowed',
    supportedPlatforms: 'MT4, MT5',
    minTradingDays: '3 days',
    profitSplit: '80% → 90%',
    refundable: true,
    trustScore: 91,
  },
  the5ers: {
    name: 'The5ers',
    color: '#00b4d8',
    challengeCost: '$95 – $645',
    profitTarget: '8% (single phase)',
    dailyDrawdown: '4%',
    maxDrawdown: '6%',
    consistencyRule: 'No day > 50% of target',
    payoutFrequency: 'Bi-weekly',
    scalingPlan: 'Yes — up to $4M',
    newsRestrictions: 'No restriction on high-tier',
    overnightHolding: 'Allowed',
    supportedPlatforms: 'MT5',
    minTradingDays: '3 days',
    profitSplit: '75% → 95%',
    refundable: false,
    trustScore: 87,
  },
  apex: {
    name: 'Apex Trader Funding',
    color: '#f97316',
    challengeCost: '$67 – $657',
    profitTarget: '6% (futures)',
    dailyDrawdown: 'Trailing 3%',
    maxDrawdown: 'Trailing 3%',
    consistencyRule: 'None',
    payoutFrequency: 'Weekly',
    scalingPlan: 'No',
    newsRestrictions: 'Allowed',
    overnightHolding: 'Allowed',
    supportedPlatforms: 'NinjaTrader, Rithmic',
    minTradingDays: '7 days',
    profitSplit: '100% first $25K, then 90%',
    refundable: false,
    trustScore: 83,
  },
  topstep: {
    name: 'Topstep',
    color: '#10b981',
    challengeCost: '$165 – $375/month',
    profitTarget: '$6K – $15K target',
    dailyDrawdown: '$1K – $2.5K',
    maxDrawdown: 'Dynamic trailing',
    consistencyRule: 'None',
    payoutFrequency: 'Weekly',
    scalingPlan: 'Yes',
    newsRestrictions: 'Restricted during certain hours',
    overnightHolding: 'Limited',
    supportedPlatforms: 'NinjaTrader, TradeStation, Rithmic',
    minTradingDays: '5 days',
    profitSplit: '90%',
    refundable: false,
    trustScore: 85,
  },
};

type FirmKey = keyof typeof FIRMS;
interface FirmData {
  name: string; color: string; challengeCost: string; profitTarget: string;
  dailyDrawdown: string; maxDrawdown: string; consistencyRule: string;
  payoutFrequency: string; scalingPlan: string; newsRestrictions: string;
  overnightHolding: string; supportedPlatforms: string; minTradingDays: string;
  profitSplit: string; refundable: boolean; trustScore: number;
}

const ROWS: { label: string; key: keyof FirmData }[] = [
  { label: 'Challenge Cost',       key: 'challengeCost' },
  { label: 'Profit Target',        key: 'profitTarget' },
  { label: 'Daily Drawdown',       key: 'dailyDrawdown' },
  { label: 'Max Drawdown',         key: 'maxDrawdown' },
  { label: 'Min Trading Days',     key: 'minTradingDays' },
  { label: 'Profit Split',         key: 'profitSplit' },
  { label: 'Consistency Rule',     key: 'consistencyRule' },
  { label: 'Payout Frequency',     key: 'payoutFrequency' },
  { label: 'Scaling Plan',         key: 'scalingPlan' },
  { label: 'News Restrictions',    key: 'newsRestrictions' },
  { label: 'Overnight Holding',    key: 'overnightHolding' },
  { label: 'Supported Platforms',  key: 'supportedPlatforms' },
];

const FIRM_KEYS = Object.keys(FIRMS) as FirmKey[];

function FirmSelect({ value, onChange, exclude }: {
  value: FirmKey; onChange: (v: FirmKey) => void; exclude?: FirmKey;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as FirmKey)}
        className="w-full appearance-none bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 pr-8 text-sm font-medium text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
      >
        {FIRM_KEYS.filter(k => k !== exclude).map(k => (
          <option key={k} value={k}>{FIRMS[k].name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [firmA, setFirmA] = useState<FirmKey>('ftmo');
  const [firmB, setFirmB] = useState<FirmKey>('fundingpips');

  // Research → purchase loop
  function handleBought(firmName: string) {
    try { localStorage.setItem('propos_pending_firm', firmName); } catch {}
    router.push('/accounts');
  }

  const a = FIRMS[firmA];
  const b = FIRMS[firmB];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Firm Hub</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Compare rules, costs, and conditions side by side
        </p>
      </div>

      <FirmHubTabs />

      {/* Firm selectors */}
      <div className="grid grid-cols-3 gap-4 items-center">
        <FirmSelect value={firmA} onChange={setFirmA} exclude={firmB} />
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--secondary)] border border-[var(--border)]">
            <GitCompare className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">vs</span>
          </div>
        </div>
        <FirmSelect value={firmB} onChange={setFirmB} exclude={firmA} />
      </div>

      {/* Trust score banner */}
      <div className="grid grid-cols-2 gap-4">
        {[a, b].map((firm) => (
          <div key={firm.name} className="stat-card flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: firm.color }}
            >
              {firm.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--foreground)]">{firm.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 progress-bar">
                  <div className="progress-fill" style={{ width: `${firm.trustScore}%` }} />
                </div>
                <span className="text-xs font-bold text-[var(--profit)] tabular-nums">{firm.trustScore}</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Trust Score</p>
            </div>
            <button
              onClick={() => handleBought(firm.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-black text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
              title="Track this challenge in PropOS"
            >
              <ShoppingBag className="w-3 h-3" /> I bought this
            </button>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="stat-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 text-xs font-medium text-[var(--muted-foreground)] w-1/3">Feature</th>
              <th className="text-left p-4 text-xs font-semibold" style={{ color: a.color }}>{a.name}</th>
              <th className="text-left p-4 text-xs font-semibold" style={{ color: b.color }}>{b.name}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ label, key }, i) => {
              const valA = a[key];
              const valB = b[key];
              const diff = valA !== valB;
              return (
                <tr
                  key={label}
                  className={cn(
                    'border-b border-[var(--border)] last:border-0',
                    diff ? 'bg-[var(--warning)]/3' : '',
                    i % 2 === 0 ? 'bg-[var(--secondary)]/20' : '',
                  )}
                >
                  <td className="p-4 text-xs font-medium text-[var(--muted-foreground)]">{label}</td>
                  <td className="p-4 text-xs text-[var(--foreground)]">
                    {typeof valA === 'boolean'
                      ? valA
                        ? <CheckCircle2 className="w-4 h-4 text-[var(--profit)]" />
                        : <XCircle className="w-4 h-4 text-[var(--loss)]" />
                      : String(valA)}
                  </td>
                  <td className="p-4 text-xs text-[var(--foreground)]">
                    {typeof valB === 'boolean'
                      ? valB
                        ? <CheckCircle2 className="w-4 h-4 text-[var(--profit)]" />
                        : <XCircle className="w-4 h-4 text-[var(--loss)]" />
                      : String(valB)}
                  </td>
                </tr>
              );
            })}
            {/* Fee refund */}
            <tr className="border-b border-[var(--border)] last:border-0">
              <td className="p-4 text-xs font-medium text-[var(--muted-foreground)]">Fee Refundable</td>
              <td className="p-4">
                {a.refundable
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--profit)]" />
                  : <XCircle className="w-4 h-4 text-[var(--loss)]" />}
              </td>
              <td className="p-4">
                {b.refundable
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--profit)]" />
                  : <XCircle className="w-4 h-4 text-[var(--loss)]" />}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[var(--muted-foreground)] text-center">
        Data is updated periodically. Always verify rules on the official firm website before purchasing.
      </p>
    </div>
  );
}
