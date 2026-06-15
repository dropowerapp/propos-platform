import { cn } from '@/lib/utils';
import { Image, Tag, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

interface Trade { symbol: string; direction: string; pnl: number; rMultiple: number; }
interface JournalEntryProps {
  date: string; trades: Trade[]; notes: string | null; tradingPlan: string | null;
  mistakes: string | null; lessons: string | null;
  emotionalState: string; confidenceLevel: number; stressLevel: number; disciplineScore: number;
  followedPlan: boolean; tags: string[]; strategy: string; setup: string | null; screenshots: number;
}

const EMOTIONS: Record<string, { label: string; color: string; emoji: string }> = {
  calm:        { label: 'Calm',         color: 'text-[var(--profit)]',   emoji: '😊' },
  excited:     { label: 'Excited',      color: 'text-blue-400',          emoji: '🤩' },
  frustrated:  { label: 'Frustrated',   color: 'text-[var(--loss)]',     emoji: '😤' },
  anxious:     { label: 'Anxious',      color: 'text-[var(--warning)]',  emoji: '😰' },
  overconfident:{ label: 'Overconfident',color: 'text-orange-400',       emoji: '😎' },
  bored:       { label: 'Bored',        color: 'text-[var(--muted-foreground)]', emoji: '😑' },
};

function ScoreBar({ value, label, danger }: { value: number; label: string; danger?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--muted-foreground)]">{label}</span>
        <span className="font-medium text-[var(--foreground)]">{value}/10</span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${danger && value >= 7 ? 'danger' : ''}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

export function JournalEntry({ date, trades, notes, tradingPlan, mistakes, lessons, emotionalState, confidenceLevel, stressLevel, disciplineScore, followedPlan, tags, strategy, setup, screenshots }: JournalEntryProps) {
  const emotion = EMOTIONS[emotionalState] ?? { label: emotionalState, color: '', emoji: '😐' };
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);

  return (
    <div className="stat-card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)]">{date}</h3>
          <div className="flex items-center gap-3 mt-1">
            {trades.map((t, i) => (
              <span key={i} className="text-xs text-[var(--muted-foreground)]">
                {t.symbol} <span className={t.direction === 'Long' ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}>{t.direction}</span>
                {' '}
                <span className={cn('font-semibold', t.pnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                  {t.pnl >= 0 ? '+' : ''}${t.pnl}
                </span>
                {' '}
                <span className={cn(t.rMultiple >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                  ({t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R)
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-semibold', netPnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
            {netPnl >= 0 ? '+' : ''}${netPnl.toLocaleString()}
          </span>
          {followedPlan
            ? <span className="flex items-center gap-1 text-xs text-[var(--profit)]"><CheckCircle2 className="w-3.5 h-3.5" /> Plan followed</span>
            : <span className="flex items-center gap-1 text-xs text-[var(--loss)]"><XCircle className="w-3.5 h-3.5" /> Plan ignored</span>
          }
        </div>
      </div>

      {/* Screenshots */}
      {screenshots > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: screenshots }).map((_, i) => (
            <div key={i} className="w-24 h-16 bg-[var(--secondary)] rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] cursor-pointer hover:border-[var(--primary)] transition-colors">
              <Image className="w-5 h-5" />
            </div>
          ))}
          <button className="w-24 h-16 border-2 border-dashed border-[var(--border)] rounded-md flex items-center justify-center text-[var(--muted-foreground)] text-xs hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
            + Add
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Notes */}
        <div className="xl:col-span-2 space-y-3">
          {notes && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">📝 Notes</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{notes}</p>
            </div>
          )}
          {mistakes && (
            <div>
              <p className="text-xs font-semibold text-[var(--loss)] uppercase tracking-wide mb-1">⚠️ Mistakes</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{mistakes}</p>
            </div>
          )}
          {lessons && (
            <div>
              <p className="text-xs font-semibold text-[var(--profit)] uppercase tracking-wide mb-1">💡 Lessons</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{lessons}</p>
            </div>
          )}
        </div>

        {/* Psychology */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">🧠 Psychology</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{emotion.emoji}</span>
              <span className={cn('text-sm font-semibold', emotion.color)}>{emotion.label}</span>
            </div>
            <div className="space-y-2">
              <ScoreBar label="Confidence" value={confidenceLevel} />
              <ScoreBar label="Discipline" value={disciplineScore} />
              <ScoreBar label="Stress" value={stressLevel} danger />
            </div>
          </div>
        </div>
      </div>

      {/* Footer: tags + strategy */}
      <div className="flex items-center gap-2 pt-1 flex-wrap border-t border-[var(--border)]">
        <Tag className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
        {tags.map(t => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer">
            #{t}
          </span>
        ))}
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {strategy}{setup && ` · ${setup}`}
        </span>
      </div>
    </div>
  );
}
