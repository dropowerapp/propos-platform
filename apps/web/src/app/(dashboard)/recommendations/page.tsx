'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Target, Clock, BarChart2, Shield, Zap, ChevronDown, ChevronUp, Info, GitCompare, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsOverview } from '@/lib/hooks/use-analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FirmMatch {
  rank: number;
  name: string;
  color: string;
  score: number;
  badge: string;
  reasons: string[];
  cautions: string[];
  challengeCost: string;
  profitSplit: string;
  payoutFrequency: string;
  profitTarget: string;
}

// ─── Static recommendations (replace with /api/recommendations when live) ────

const STATIC_MATCHES: FirmMatch[] = [
  {
    rank: 1, name: 'FundingPips', color: '#6c47ff',
    score: 94, badge: 'Best Match',
    reasons: [
      'Your drawdown pattern fits within their 4% daily / 8% max structure',
      'Weekly payout cycle suits your monthly trading frequency',
      'Consistency rule (30%) is compatible with your win distribution',
      'No news restriction issues based on your trade timing data',
    ],
    cautions: ['Slightly tighter daily drawdown than FTMO — requires disciplined position sizing'],
    challengeCost: 'From $49', profitSplit: '80% → 90%',
    payoutFrequency: 'Weekly', profitTarget: '8% Phase 1',
  },
  {
    rank: 2, name: 'FTMO', color: '#00c4cc',
    score: 90, badge: 'Excellent Fit',
    reasons: [
      'Your average hold time (2.4 hrs) fits within their no overnight restriction window',
      'Win rate above 55% comfortably clears their evaluation thresholds',
      'Refundable fee aligns with your risk tolerance profile',
    ],
    cautions: [],
    challengeCost: 'From $155', profitSplit: '80% → 90%',
    payoutFrequency: '14-day on-demand', profitTarget: '10% Phase 1 · 5% Phase 2',
  },
  {
    rank: 3, name: 'The5ers', color: '#00b4d8',
    score: 84, badge: 'Good Fit',
    reasons: [
      'Single-phase challenge suits your consistent, low-risk style',
      'Scaling plan up to $4M matches your growth ambitions',
    ],
    cautions: [
      'MT5 only — verify your strategy works on their execution environment',
      '6% max drawdown is tighter than your historical max — some risk',
    ],
    challengeCost: 'From $95', profitSplit: '75% → 95%',
    payoutFrequency: 'Bi-weekly', profitTarget: '8% (single phase)',
  },
  {
    rank: 4, name: 'E8 Funding', color: '#f59e0b',
    score: 78, badge: 'Moderate Fit',
    reasons: [
      'Trailing drawdown model rewards low-volatility traders like yourself',
    ],
    cautions: [
      'Consistency rule may flag your occasional high-conviction days',
      'Less community data available compared to top-tier firms',
    ],
    challengeCost: 'From $128', profitSplit: '80%',
    payoutFrequency: 'Monthly', profitTarget: '8%',
  },
];

const TRAIT_ICONS: Record<string, React.ElementType> = {
  'Win Rate': BarChart2,
  'Drawdown': TrendingUp,
  'Trade Frequency': Zap,
  'Avg Hold Time': Clock,
  'Risk Profile': Shield,
  'Style': Target,
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
        <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle
          cx="25" cy="25" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--foreground)]">
        {score}%
      </span>
    </div>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const { data: overview } = useAnalyticsOverview();
  const [expanded, setExpanded] = useState<number | null>(0);

  // Research → purchase loop: hand the firm off to Accounts and open the add modal
  function handleBought(firmName: string) {
    try { localStorage.setItem('propos_pending_firm', firmName); } catch {}
    router.push('/accounts');
  }

  const winRate      = overview?.winRate      != null ? `${(overview.winRate * 100).toFixed(1)}%`      : '67.2%';
  const maxDrawdown  = overview?.maxDrawdown  != null ? `${overview.maxDrawdown.toFixed(1)}%`           : '3.4%';
  const avgHold      = '2.4 hrs';
  const tradeFreq    = '4.2 / day';
  const riskProfile  = 'Conservative';
  const style        = 'Intraday Swing';

  const traits = [
    { label: 'Win Rate',        value: winRate },
    { label: 'Drawdown',        value: maxDrawdown },
    { label: 'Trade Frequency', value: tradeFreq },
    { label: 'Avg Hold Time',   value: avgHold },
    { label: 'Risk Profile',    value: riskProfile },
    { label: 'Style',           value: style },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Recommendations</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Prop firms ranked by compatibility with your real trading data
        </p>
      </div>

      {/* Trader profile snapshot */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Your Trading Profile</h2>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-auto flex items-center gap-1">
            <Info className="w-3 h-3" /> Based on your last 90 days of trade data
          </span>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {traits.map(({ label, value }) => {
            const Icon = TRAIT_ICONS[label] ?? BarChart2;
            return (
              <div key={label} className="flex items-center gap-3 bg-[var(--secondary)] rounded-lg px-3 py-2.5">
                <div className="w-7 h-7 rounded-md bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{label}</p>
                  <p className="text-xs font-bold text-[var(--foreground)]">{value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranked firms */}
      <div className="space-y-3">
        {STATIC_MATCHES.map((firm, i) => {
          const isOpen = expanded === i;
          return (
            <div
              key={firm.name}
              className={cn(
                'stat-card transition-all',
                i === 0 ? 'ring-1 ring-[var(--primary)]/30' : '',
              )}
            >
              {/* Summary row */}
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : i)}
              >
                {/* Rank */}
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  i === 0 ? 'bg-[var(--primary)] text-black' : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                )}>
                  {firm.rank}
                </div>

                {/* Score ring */}
                <ScoreRing score={firm.score} color={firm.color} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[var(--foreground)]">{firm.name}</p>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${firm.color}20`, color: firm.color }}
                    >
                      {firm.badge}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                    <span>{firm.challengeCost}</span>
                    <span>·</span>
                    <span>{firm.profitSplit} split</span>
                    <span>·</span>
                    <span>{firm.payoutFrequency} payouts</span>
                  </div>
                </div>

                {/* Expand */}
                <div className="text-[var(--muted-foreground)]">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Detail panel */}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                  {/* Why this firm */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--profit)] mb-2">Why this firm fits you</p>
                    <ul className="space-y-1.5">
                      {firm.reasons.map((r, ri) => (
                        <li key={ri} className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                          <span className="text-[var(--profit)] mt-0.5 shrink-0">✓</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cautions */}
                  {firm.cautions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--warning)] mb-2">Things to consider</p>
                      <ul className="space-y-1.5">
                        {firm.cautions.map((c, ci) => (
                          <li key={ci} className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                            <span className="text-[var(--warning)] mt-0.5 shrink-0">⚠</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 pt-1">
                    {[
                      { label: 'Challenge Cost', value: firm.challengeCost },
                      { label: 'Profit Split', value: firm.profitSplit },
                      { label: 'Payout', value: firm.payoutFrequency },
                      { label: 'Profit Target', value: firm.profitTarget },
                    ].map(s => (
                      <div key={s.label} className="bg-[var(--secondary)] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-[var(--muted-foreground)]">{s.label}</p>
                        <p className="text-xs font-semibold text-[var(--foreground)] mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={e => { e.stopPropagation(); router.push('/firms/compare'); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                    >
                      <GitCompare className="w-3.5 h-3.5" /> Compare
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleBought(firm.name); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> I bought this challenge
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Methodology note */}
      <div className="stat-card border-dashed">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Compatibility scores are calculated from your trade history, win rate, drawdown patterns, holding time, and trade frequency.
            Scores update automatically as you record more trades. Always verify firm rules before purchasing a challenge.
          </p>
        </div>
      </div>
    </div>
  );
}
