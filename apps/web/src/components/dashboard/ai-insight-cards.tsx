'use client';

import Link from 'next/link';
import { Bot, TrendingDown, Clock, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsBreakdown } from '@/lib/hooks/use-analytics';

// ─── AI insight cards ──────────────────────────────────────────────────────────
// The Coach's best findings, pushed to the dashboard. A chat box waiting for
// questions has no pull; "you lose 2.3× more on Fridays — ask me why" does.

interface Insight {
  id: string;
  icon: React.ElementType;
  tone: 'risk' | 'opportunity' | 'pattern';
  headline: string;
  detail: string;
  prompt: string; // pre-seeded question for the AI Coach
}

const TONE_STYLE: Record<Insight['tone'], { border: string; iconBg: string; iconColor: string }> = {
  risk:        { border: 'border-[var(--loss)]/25',    iconBg: 'bg-[var(--loss)]/10',    iconColor: 'text-[var(--loss)]' },
  opportunity: { border: 'border-[var(--profit)]/25',  iconBg: 'bg-[var(--profit)]/10',  iconColor: 'text-[var(--profit)]' },
  pattern:     { border: 'border-[var(--warning)]/25', iconBg: 'bg-[var(--warning)]/10', iconColor: 'text-[var(--warning)]' },
};

const DEMO_INSIGHTS: Insight[] = [
  {
    id: 'i1',
    icon: TrendingDown,
    tone: 'risk',
    headline: 'You lose 2.3× more on Fridays',
    detail: 'Average Friday loss is $241 vs $103 on other days — 68% of Friday trades were taken after 2 consecutive losses.',
    prompt: 'Why is my Friday performance so much worse than other days?',
  },
  {
    id: 'i2',
    icon: Clock,
    tone: 'pattern',
    headline: 'Your edge dies after 2 hours of holding',
    detail: 'Trades held under 2h average +0.9R; over 2h they drop to −0.2R. You may be letting winners turn into losers.',
    prompt: 'Show me my performance by holding time and how to fix long-hold losses.',
  },
  {
    id: 'i3',
    icon: Target,
    tone: 'opportunity',
    headline: 'London open is your strongest window',
    detail: '71% win rate between 08:00–10:00 UTC across 47 trades. Only 31% of your volume happens there.',
    prompt: 'How much better would my results be if I concentrated on the London open?',
  },
];

// Derive real insights from the day-of-week breakdown when data exists
function deriveInsights(rows: any[]): Insight[] {
  const valid = (rows ?? []).filter((r: any) => r.trades >= 5);
  if (valid.length < 2) return [];
  const insights: Insight[] = [];

  const sortedByPnl = [...valid].sort((a, b) => Number(a.netPnl ?? 0) - Number(b.netPnl ?? 0));
  const worst = sortedByPnl[0];
  const best = sortedByPnl[sortedByPnl.length - 1];

  if (Number(worst.netPnl) < 0) {
    insights.push({
      id: 'real-worst',
      icon: TrendingDown,
      tone: 'risk',
      headline: `${worst.group} is your weakest day`,
      detail: `${worst.trades} trades, ${((worst.winRate ?? 0) * 100).toFixed(0)}% win rate, $${Math.abs(Number(worst.netPnl)).toLocaleString()} net loss. Consider reducing size or skipping it.`,
      prompt: `Why is my ${worst.group} performance so poor and what should I change?`,
    });
  }
  if (Number(best.netPnl) > 0) {
    insights.push({
      id: 'real-best',
      icon: Target,
      tone: 'opportunity',
      headline: `${best.group} is your strongest day`,
      detail: `${best.trades} trades, ${((best.winRate ?? 0) * 100).toFixed(0)}% win rate, +$${Number(best.netPnl).toLocaleString()} net. Your edge is concentrated here.`,
      prompt: `How can I lean harder into my ${best.group} edge safely?`,
    });
  }
  return insights;
}

export function AiInsightCards() {
  const { data: breakdown } = useAnalyticsBreakdown('dayOfWeek');
  const rowsRaw = breakdown?.data ?? breakdown?.rows ?? breakdown ?? [];
  const rows: any[] = Array.isArray(rowsRaw) ? rowsRaw : [];

  const real = deriveInsights(rows);
  const insights = real.length >= 2 ? real.slice(0, 3) : DEMO_INSIGHTS;
  const isDemo = real.length < 2;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Coach Insights</h2>
          {isDemo && (
            <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded-full">
              demo
            </span>
          )}
        </div>
        <Link
          href="/ai-coach"
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
        >
          Open AI Coach <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {insights.map(ins => {
          const style = TONE_STYLE[ins.tone];
          const Icon = ins.icon;
          return (
            <Link
              key={ins.id}
              href={`/ai-coach?q=${encodeURIComponent(ins.prompt)}`}
              className={cn(
                'stat-card border group hover:bg-[var(--secondary)] transition-colors',
                style.border,
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', style.iconBg)}>
                  <Icon className={cn('w-4 h-4', style.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">{ins.headline}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">{ins.detail}</p>
                  <p className="text-xs text-[var(--primary)] font-medium mt-2 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    Ask Coach why <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
