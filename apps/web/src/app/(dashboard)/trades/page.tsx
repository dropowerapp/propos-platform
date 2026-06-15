'use client';

import { useState } from 'react';
import { TradesTable } from '@/components/trades/trades-table';
import { TradeFilters } from '@/components/trades/trade-filters';
import { ImportModal } from '@/components/trades/import-modal';
import { ManualTradeModal } from '@/components/trades/manual-trade-modal';
import { JournalEntry } from '@/components/journal/journal-entry';
import { JournalFilters } from '@/components/journal/journal-filters';
import { PsychologyTrend } from '@/components/journal/psychology-trend';
import { NewEntryModal } from '@/components/journal/new-entry-modal';
import { Plus, Upload, Download, BookOpen, Brain, Layers, CalendarDays } from 'lucide-react';
import { useTrades } from '@/lib/hooks/use-trades';
import { useAnalyticsOverview } from '@/lib/hooks/use-analytics';
import { cn } from '@/lib/utils';
import { TradesCalendar } from '@/components/trades/trades-calendar';

type Tab = 'all' | 'calendar' | 'journal' | 'psychology' | 'playbook';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'all',        label: 'All Trades',  icon: Layers },
  { id: 'calendar',   label: 'Calendar',    icon: CalendarDays },
  { id: 'journal',    label: 'Journal',     icon: BookOpen },
  { id: 'psychology', label: 'Psychology',  icon: Brain },
  { id: 'playbook',   label: 'Playbook',    icon: Layers },
];

export default function TradesPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [showImport, setShowImport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data: tradesData, isLoading } = useTrades(filters);
  const { data: overview } = useAnalyticsOverview();

  const _tr = tradesData?.data ?? tradesData?.trades ?? tradesData ?? [];
  const trades: any[] = Array.isArray(_tr) ? _tr : [];
  const total: number = tradesData?.meta?.total ?? tradesData?.total ?? trades.length;

  const winRate   = overview?.winRate     != null ? `${(overview.winRate * 100).toFixed(1)}%`  : '—';
  const netPnl    = overview?.netPnl      != null ? `${overview.netPnl >= 0 ? '+$' : '-$'}${Math.abs(overview.netPnl).toLocaleString()}` : '—';
  const pf        = overview?.profitFactor  != null ? overview.profitFactor.toFixed(2)            : '—';
  const avgR      = overview?.avgRMultiple   != null ? `${overview.avgRMultiple.toFixed(2)}R`      : '—';

  const chips = [
    { label: 'Total Trades',   value: isLoading ? '—' : String(total),  color: '' },
    { label: 'Win Rate',       value: isLoading ? '—' : winRate,          color: 'text-[var(--profit)]' },
    { label: 'Net P&L',        value: isLoading ? '—' : netPnl,           color: 'text-[var(--profit)]' },
    { label: 'Profit Factor',  value: isLoading ? '—' : pf,               color: 'text-[var(--profit)]' },
    { label: 'Avg R-Multiple', value: isLoading ? '—' : avgR,             color: 'text-[var(--profit)]' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Trades</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {isLoading ? 'Loading…' : `${total} trades · All accounts · All time`}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'all' && (
            <>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              >
                <Upload className="w-4 h-4" /> Import
              </button>
              <button
                onClick={() => setShowManual(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add Trade
              </button>
            </>
          )}
          {tab === 'journal' && (
            <button
              onClick={() => setShowNewEntry(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Entry
            </button>
          )}
        </div>
      </div>

      {/* KPI chips */}
      <div className="grid grid-cols-5 gap-3">
        {chips.map(s => (
          <div key={s.label} className="stat-card text-center py-3">
            <p className={`text-lg font-bold tabular-nums ${s.color || 'text-[var(--foreground)]'}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
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
          </button>
        ))}
      </div>

      {/* Tab: All Trades */}
      {tab === 'all' && (
        <div className="space-y-4">
          <TradeFilters />
          <TradesTable trades={trades} total={total} />
        </div>
      )}

      {/* Tab: Calendar */}
      {tab === 'calendar' && (
        <div className="stat-card">
          <TradesCalendar trades={trades} />
        </div>
      )}

      {/* Tab: Journal */}
      {tab === 'journal' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-4">
            <JournalFilters />
            <JournalEntry
              date="January 15, 2024"
              trades={[{ symbol: 'EURUSD', direction: 'Long', pnl: 480, rMultiple: 1.8 }]}
              notes="Waited patiently for the London open. Price broke the Asian range high with a strong bullish candle. Entered on the retest of the broken level. Managed the trade well — moved SL to breakeven at 1R and let it run to TP."
              tradingPlan="Wait for London open break of Asian range. Look for a retest entry with at least 1:1.5 R:R minimum."
              mistakes={null}
              lessons="Patience paid off today. Not forcing the entry was key."
              emotionalState="calm" confidenceLevel={8} stressLevel={3} disciplineScore={9}
              followedPlan={true} tags={['london-breakout', 'asian-range', 'patience']}
              strategy="London Breakout" setup="Range Break" screenshots={2}
            />
            <JournalEntry
              date="January 14, 2024"
              trades={[
                { symbol: 'GBPUSD', direction: 'Short', pnl: -180, rMultiple: -0.9 },
                { symbol: 'EURUSD', direction: 'Long', pnl: 240, rMultiple: 1.2 },
                { symbol: 'USDJPY', direction: 'Long', pnl: -180, rMultiple: -0.9 },
              ]}
              notes="Overtraded today. Took a revenge trade after the first loss on GBP/USD. The second EURUSD trade was decent but I was already shaken. Third trade was pure FOMO."
              tradingPlan={null}
              mistakes="Revenge trading after loss #1. FOMO on trade #3. Did not follow the trading plan."
              lessons="When I lose the first trade, I should take a 30-minute break minimum. Never trade out of frustration."
              emotionalState="frustrated" confidenceLevel={4} stressLevel={8} disciplineScore={3}
              followedPlan={false} tags={['revenge-trade', 'fomo', 'overtrading']}
              strategy="Supply & Demand" setup={null} screenshots={1}
            />
          </div>
          <div className="space-y-4">
            <div className="stat-card">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">This Month</h3>
              <div className="space-y-3">
                {[
                  { label: 'Entries', value: '42', color: 'text-[var(--foreground)]' },
                  { label: 'Followed Plan', value: '78%', color: 'text-[var(--profit)]' },
                  { label: 'Avg Discipline', value: '7.2/10', color: 'text-[var(--profit)]' },
                  { label: 'Avg Stress', value: '4.1/10', color: 'text-[var(--warning)]' },
                  { label: 'Most Tagged', value: '#patience', color: 'text-blue-400' },
                  { label: 'Top Mistake', value: 'Overtrading', color: 'text-[var(--loss)]' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">{s.label}</span>
                    <span className={`font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Psychology */}
      {tab === 'psychology' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <PsychologyTrend />
          </div>
          <div className="space-y-4">
            <div className="stat-card">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Psychological Overview</h3>
              <div className="space-y-4">
                {[
                  { label: 'Avg Emotional State', value: 'Calm', color: 'text-[var(--profit)]' },
                  { label: 'Avg Confidence', value: '7.4 / 10', color: 'text-[var(--profit)]' },
                  { label: 'Avg Discipline Score', value: '7.2 / 10', color: 'text-[var(--profit)]' },
                  { label: 'Avg Stress Level', value: '4.1 / 10', color: 'text-[var(--warning)]' },
                  { label: 'Plan Adherence', value: '78%', color: 'text-[var(--profit)]' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--muted-foreground)]">{s.label}</span>
                      <span className={`font-semibold ${s.color}`}>{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="stat-card">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Top Mistakes This Month</h3>
              <div className="space-y-2">
                {[
                  { label: 'Overtrading', count: 8 },
                  { label: 'Revenge trading', count: 5 },
                  { label: 'Moving SL', count: 4 },
                  { label: 'FOMO entries', count: 3 },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--foreground)]">{m.label}</span>
                    <span className="text-xs font-bold text-[var(--loss)]">{m.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Playbook */}
      {tab === 'playbook' && (
        <div className="space-y-4">
          <div className="stat-card border-dashed text-center py-12">
            <Layers className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">Playbook coming soon</p>
            <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto">
              Define your setups, rules, and entry criteria. Tag trades to your playbook to measure setup performance.
            </p>
            <button className="mt-4 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity">
              Create Setup
            </button>
          </div>
        </div>
      )}

      {showImport   && <ImportModal onClose={() => setShowImport(false)} />}
      {showManual   && <ManualTradeModal onClose={() => setShowManual(false)} />}
      {showNewEntry && <NewEntryModal onClose={() => setShowNewEntry(false)} />}
    </div>
  );
}
