'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOTIONS = ['calm','excited','anxious','frustrated','overconfident','bored','focused','confident'];

function ScoreInput({ label, value, onChange, danger }: { label: string; value: number; onChange: (v: number) => void; danger?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--muted-foreground)]">{label}</span>
        <span className={cn('font-semibold', danger && value >= 7 ? 'text-[var(--loss)]' : value >= 7 ? 'text-[var(--profit)]' : 'text-[var(--foreground)]')}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(+e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--primary)]" />
    </div>
  );
}

export function NewEntryModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'trade'|'daily'|'weekly'>('trade');
  const [emotion, setEmotion] = useState('calm');
  const [confidence, setConfidence] = useState(7);
  const [discipline, setDiscipline] = useState(7);
  const [stress, setStress] = useState(3);
  const [focus, setFocus] = useState(8);
  const [followedPlan, setFollowedPlan] = useState<boolean|null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
          <h2 className="text-base font-semibold text-[var(--foreground)]">New Journal Entry</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Type tabs */}
          <div className="flex gap-1 bg-[var(--secondary)] p-1 rounded-lg w-fit">
            {(['trade','daily','weekly'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize', tab === t ? 'bg-[var(--card)] text-[var(--foreground)] shadow' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}>
                {t === 'daily' ? 'Daily Review' : t === 'weekly' ? 'Weekly Review' : 'Trade Entry'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Date</label>
              <input type="date" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            {tab === 'trade' && (
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Link Trade</label>
                <select className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]">
                  <option>Select a trade...</option>
                  <option>EURUSD Long +$480 (Jan 15)</option>
                  <option>XAUUSD Long +$920 (Jan 13)</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes sections */}
          {[
            { label: '📝 Notes', placeholder: 'What happened? Describe the trade or session...', rows: 3 },
            { label: '📋 Trading Plan', placeholder: 'What was your plan before executing?', rows: 2 },
            { label: '⚠️ Mistakes', placeholder: 'What went wrong or could have been done better?', rows: 2 },
            { label: '💡 Lessons Learned', placeholder: 'What will you take away from this session?', rows: 2 },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide block mb-1.5">{f.label}</label>
              <textarea rows={f.rows} placeholder={f.placeholder}
                className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none" />
            </div>
          ))}

          {/* Screenshots */}
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide block mb-2">📸 Screenshots</label>
            <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--primary)] transition-colors cursor-pointer">
              <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--muted-foreground)]" />
              <p className="text-xs text-[var(--muted-foreground)]">Drop chart screenshots or click to upload</p>
            </div>
          </div>

          {/* Psychology */}
          <div className="border-t border-[var(--border)] pt-5 space-y-4">
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">🧠 Psychology</p>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Emotional State</label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(e => (
                  <button key={e} onClick={() => setEmotion(e)}
                    className={cn('px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors',
                      emotion === e ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] hover:text-[var(--foreground)]')}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ScoreInput label="Confidence" value={confidence} onChange={setConfidence} />
              <ScoreInput label="Discipline" value={discipline} onChange={setDiscipline} />
              <ScoreInput label="Stress" value={stress} onChange={setStress} danger />
              <ScoreInput label="Focus" value={focus} onChange={setFocus} />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Followed Trading Plan?</label>
              <div className="flex gap-2">
                {[{v: true, label: '✅ Yes'},{v: false, label: '❌ No'}].map(o => (
                  <button key={String(o.v)} onClick={() => setFollowedPlan(o.v)}
                    className={cn('px-4 py-1.5 rounded-md text-sm font-medium border transition-colors',
                      followedPlan === o.v ? (o.v ? 'border-[var(--profit)] bg-[var(--profit)]/10 text-[var(--profit)]' : 'border-[var(--loss)] bg-[var(--loss)]/10 text-[var(--loss)]') : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
            <button className="px-5 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
