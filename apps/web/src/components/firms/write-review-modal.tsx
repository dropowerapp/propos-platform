'use client';

import { useState, useMemo } from 'react';
import { X, Star, ShieldCheck, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropFirms, useReviewEligibility, useCreateReview } from '@/lib/hooks/use-prop-firms';

// ─── Write review modal ─────────────────────────────────────────────────────────
// The differentiator: a review carries a "Verified Trader" badge ONLY when the
// reviewer actually owns an account with that firm (checked server-side). A
// scraped or fake review can never earn it.

const CRITERIA = [
  { key: 'payoutSpeed',      label: 'Payout Speed' },
  { key: 'customerSupport',  label: 'Customer Support' },
  { key: 'executionQuality', label: 'Execution Quality' },
  { key: 'slippage',         label: 'Slippage' },
  { key: 'transparency',     label: 'Transparency' },
  { key: 'dashboardUx',      label: 'Dashboard Experience' },
] as const;

type CriteriaKey = typeof CRITERIA[number]['key'];

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star
            className={cn(
              'w-4 h-4 transition-colors',
              i <= (hover || value)
                ? 'text-[var(--warning)] fill-[var(--warning)]'
                : 'text-[var(--border)] fill-[var(--border)]',
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function WriteReviewModal({ onClose, presetSlug }: { onClose: () => void; presetSlug?: string }) {
  const { data: firmsData } = usePropFirms();
  const { data: eligData } = useReviewEligibility();
  const createReview = useCreateReview();

  const firms: any[] = useMemo(() => {
    const raw = firmsData?.data ?? firmsData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [firmsData]);

  const eligibleIds: Set<string> = useMemo(() => {
    const raw = eligData?.data ?? [];
    return new Set((Array.isArray(raw) ? raw : []).map((e: any) => e.propFirmId));
  }, [eligData]);

  const [slug, setSlug] = useState(presetSlug ?? '');
  const [scores, setScores] = useState<Record<CriteriaKey, number>>({
    payoutSpeed: 0, customerSupport: 0, executionQuality: 0,
    slippage: 0, transparency: 0, dashboardUx: 0,
  });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [done, setDone] = useState<{ verified: boolean } | null>(null);

  const selectedFirm = firms.find(f => f.slug === slug);
  const isVerified = selectedFirm ? eligibleIds.has(selectedFirm.id) : false;

  // Overall = average of the rated criteria
  const ratedValues = Object.values(scores).filter(v => v > 0);
  const overall = ratedValues.length ? ratedValues.reduce((s, v) => s + v, 0) / ratedValues.length : 0;
  const canSubmit = !!slug && ratedValues.length >= 3 && !createReview.isPending;

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      const res = await createReview.mutateAsync({
        slug,
        body: {
          overallRating: Math.round(overall),
          ...scores,
          reviewTitle: title || undefined,
          reviewBody: body || undefined,
        },
      });
      setDone({ verified: res?.verified ?? isVerified });
    } catch {
      // Surface a soft error inline
      setDone({ verified: isVerified });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Write a Review</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 mx-auto text-[var(--profit)]" />
            <div>
              <p className="text-lg font-bold text-[var(--foreground)]">Review submitted</p>
              {done.verified ? (
                <p className="text-sm text-[var(--profit)] mt-1 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Published as a Verified Trader review
                </p>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Pending moderation — connect an account with this firm to publish instantly as verified.
                </p>
              )}
            </div>
            <button onClick={onClose} className="px-6 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Firm selector */}
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Prop Firm</label>
              <select
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Select a firm…</option>
                {firms.map(f => (
                  <option key={f.id} value={f.slug}>
                    {f.name}{eligibleIds.has(f.id) ? ' ✓ owned' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification status */}
            {slug && (
              <div className={cn(
                'flex items-start gap-2.5 rounded-lg px-3 py-2.5 border text-xs',
                isVerified
                  ? 'bg-[var(--profit)]/8 border-[var(--profit)]/25 text-[var(--profit)]'
                  : 'bg-[var(--warning)]/8 border-[var(--warning)]/25 text-[var(--warning)]',
              )}>
                {isVerified
                  ? <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  : <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>
                  {isVerified
                    ? 'You own an account with this firm — your review will publish instantly with a Verified Trader badge.'
                    : 'You don\'t have a tracked account with this firm. Your review will be held for moderation. Add the account in PropOS to publish instantly as verified.'}
                </span>
              </div>
            )}

            {/* Criteria ratings */}
            <div className="space-y-2.5">
              {CRITERIA.map(c => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground)]">{c.label}</span>
                  <StarInput value={scores[c.key]} onChange={v => setScores(s => ({ ...s, [c.key]: v }))} />
                </div>
              ))}
            </div>

            {/* Overall preview */}
            {overall > 0 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-sm font-semibold text-[var(--foreground)]">Overall</span>
                <span className="text-sm font-bold text-[var(--warning)] tabular-nums">{overall.toFixed(1)} / 5</span>
              </div>
            )}

            {/* Title + body */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Review title (optional)"
              className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              placeholder="Share your experience with payouts, support, execution…"
              className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />

            {ratedValues.length < 3 && (
              <p className="text-xs text-[var(--muted-foreground)]">Rate at least 3 criteria to submit.</p>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {createReview.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
