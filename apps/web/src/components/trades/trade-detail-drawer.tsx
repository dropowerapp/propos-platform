'use client';

import { useState } from 'react';
import {
  X, TrendingUp, TrendingDown, BookOpen, Brain, ImageIcon,
  AlertTriangle, Lightbulb, Save, Plus, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Trade detail drawer ───────────────────────────────────────────────────────
// The journal lives WITH the trade — details, journal, psychology, media in one
// place, opened from any trade row.

interface TradeDetailDrawerProps {
  trade: any;
  onClose: () => void;
}

const EMOTIONS = ['calm', 'confident', 'anxious', 'frustrated', 'fearful', 'greedy'] as const;

const EMOTION_STYLE: Record<string, string> = {
  calm:       'text-[var(--profit)] bg-[var(--profit)]/10 border-[var(--profit)]/30',
  confident:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  anxious:    'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30',
  frustrated: 'text-[var(--loss)] bg-[var(--loss)]/10 border-[var(--loss)]/30',
  fearful:    'text-[var(--loss)] bg-[var(--loss)]/10 border-[var(--loss)]/30',
  greedy:     'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30',
};

function ScoreSelector({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className={cn(
          'text-xs font-bold tabular-nums',
          value >= 7 ? 'text-[var(--profit)]' : value >= 4 ? 'text-[var(--warning)]' : 'text-[var(--loss)]',
        )}>
          {value}/10
        </p>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              'flex-1 h-2 rounded-full transition-colors',
              n <= value
                ? value >= 7 ? 'bg-[var(--profit)]' : value >= 4 ? 'bg-[var(--warning)]' : 'bg-[var(--loss)]'
                : 'bg-[var(--secondary)]',
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function TradeDetailDrawer({ trade, onClose }: TradeDetailDrawerProps) {
  // Journal state (pre-filled from trade if a journal entry exists)
  const j = trade.journalEntry ?? {};
  const [notes, setNotes]       = useState<string>(j.notes ?? trade.notes ?? '');
  const [mistakes, setMistakes] = useState<string>(j.mistakes ?? '');
  const [lessons, setLessons]   = useState<string>(j.lessons ?? '');
  const [emotion, setEmotion]   = useState<string>(j.emotionalState ?? '');
  const [confidence, setConfidence] = useState<number>(j.confidenceLevel ?? 5);
  const [discipline, setDiscipline] = useState<number>(j.disciplineScore ?? 5);
  const [saved, setSaved] = useState(false);

  // Trade numbers (tolerant to API and mock shapes)
  const direction  = (trade.direction ?? 'long').toLowerCase();
  const isLong     = direction === 'long';
  const openPrice  = Number(trade.openPrice ?? 0);
  const closePrice = Number(trade.closePrice ?? 0);
  const sl         = trade.sl ?? trade.stopLoss ?? null;
  const tp         = trade.tp ?? trade.takeProfit ?? null;
  const lots       = Number(trade.lots ?? 0);
  const pnl        = Number(trade.pnl ?? trade.netPnl ?? 0);
  const rMultiple  = Number(trade.rMultiple ?? trade.rMultipleNet ?? 0);
  const riskAmount = sl && openPrice
    ? Math.abs(pnl / (rMultiple || 1))
    : null;
  const win = pnl >= 0;

  function handleSave() {
    // Persist via journal API when available; for now confirm locally
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              win ? 'bg-[var(--profit)]/15' : 'bg-[var(--loss)]/15',
            )}>
              {isLong
                ? <TrendingUp className={cn('w-4 h-4', win ? 'text-[var(--profit)]' : 'text-[var(--loss)]')} />
                : <TrendingDown className={cn('w-4 h-4', win ? 'text-[var(--profit)]' : 'text-[var(--loss)]')} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--foreground)] font-mono">{trade.symbol}</h2>
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full capitalize',
                  isLong ? 'text-[var(--profit)] bg-[var(--profit)]/10' : 'text-[var(--loss)] bg-[var(--loss)]/10',
                )}>
                  {direction}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                {trade.date ?? (trade.openedAt ? new Date(trade.openedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')}
                {trade.account ? ` · ${trade.account}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Trade Details ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] opacity-60 mb-3">
              Trade Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card py-3 text-center">
                <p className="text-[10px] text-[var(--muted-foreground)]">Net P&L</p>
                <p className={cn('text-xl font-bold tabular-nums', win ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                  {win ? '+' : '-'}${Math.abs(pnl).toLocaleString()}
                </p>
              </div>
              <div className="stat-card py-3 text-center">
                <p className="text-[10px] text-[var(--muted-foreground)]">R-Multiple</p>
                <p className={cn('text-xl font-bold tabular-nums', rMultiple >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                  {rMultiple >= 0 ? '+' : ''}{rMultiple.toFixed(2)}R
                </p>
              </div>
            </div>
            <div className="mt-3 stat-card divide-y divide-[var(--border)]">
              {[
                { label: 'Entry', value: openPrice ? openPrice.toLocaleString(undefined, { maximumFractionDigits: 5 }) : '—' },
                { label: 'Exit', value: closePrice ? closePrice.toLocaleString(undefined, { maximumFractionDigits: 5 }) : '—' },
                { label: 'Stop Loss', value: sl ? Number(sl).toLocaleString(undefined, { maximumFractionDigits: 5 }) : '—' },
                { label: 'Take Profit', value: tp ? Number(tp).toLocaleString(undefined, { maximumFractionDigits: 5 }) : '—' },
                { label: 'Size', value: lots ? `${lots} lots` : '—' },
                { label: 'Risk', value: riskAmount ? `~$${Math.round(riskAmount).toLocaleString()}` : '—' },
                { label: 'Duration', value: trade.duration ?? '—' },
                { label: 'Session', value: trade.session ?? '—' },
                { label: 'Strategy', value: trade.strategy ?? '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 first:pt-0 last:pb-0 text-sm">
                  <span className="text-[var(--muted-foreground)] text-xs">{row.label}</span>
                  <span className="font-medium text-[var(--foreground)] text-xs tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Journal ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] opacity-60 mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Journal
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What happened? How did you manage the trade?"
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--loss)]/80 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> Mistakes
                </label>
                <textarea
                  value={mistakes}
                  onChange={e => setMistakes(e.target.value)}
                  rows={2}
                  placeholder="What went wrong? (leave empty if nothing)"
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--loss)]/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--profit)]/80 mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" /> Lessons Learned
                </label>
                <textarea
                  value={lessons}
                  onChange={e => setLessons(e.target.value)}
                  rows={2}
                  placeholder="What will you do differently next time?"
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--profit)]/50"
                />
              </div>
            </div>
          </section>

          {/* ── Psychology ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] opacity-60 mb-3 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" /> Psychology
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Emotional State</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmotion(emotion === e ? '' : e)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors',
                        emotion === e
                          ? EMOTION_STYLE[e]
                          : 'text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <ScoreSelector label="Confidence Level" value={confidence} onChange={setConfidence} />
              <ScoreSelector label="Discipline Score" value={discipline} onChange={setDiscipline} />
            </div>
          </section>

          {/* ── Media ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] opacity-60 mb-3 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Screenshots & Markups
            </h3>
            <button className="w-full border-2 border-dashed border-[var(--border)] rounded-xl py-8 text-center hover:border-[var(--muted-foreground)]/60 hover:bg-[var(--secondary)] transition-colors group">
              <Plus className="w-6 h-6 mx-auto mb-2 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
              <p className="text-xs text-[var(--muted-foreground)]">Add chart screenshot or markup</p>
            </button>
          </section>

          {/* ── Save ── */}
          <div className="sticky bottom-0 bg-[var(--card)] pt-2 pb-1 -mx-1 px-1">
            <button
              onClick={handleSave}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                saved
                  ? 'bg-[var(--profit)] text-black'
                  : 'bg-[var(--primary)] text-black hover:opacity-90',
              )}
            >
              {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Journal Entry</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
