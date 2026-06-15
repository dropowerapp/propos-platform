'use client';

import { useState, useMemo } from 'react';
import { Star, Plus, ThumbsUp, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirmHubTabs } from '@/components/firms/firm-hub-tabs';
import { WriteReviewModal } from '@/components/firms/write-review-modal';
import { usePropFirms, useFirmReviews } from '@/lib/hooks/use-prop-firms';

const FIRM_COLORS = ['#00c4cc', '#6c47ff', '#00b4d8', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'];

const CRITERIA = [
  { key: 'payoutSpeed',      label: 'Payout Speed' },
  { key: 'customerSupport',  label: 'Customer Support' },
  { key: 'executionQuality', label: 'Execution Quality' },
  { key: 'slippage',         label: 'Slippage' },
  { key: 'transparency',     label: 'Transparency' },
  { key: 'dashboardUx',      label: 'Dashboard Experience' },
] as const;

function StarRating({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(cls, i <= Math.round(value) ? 'text-[var(--warning)] fill-[var(--warning)]' : 'text-[var(--border)] fill-[var(--border)]')}
        />
      ))}
    </div>
  );
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

export default function ReviewsPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showWrite, setShowWrite] = useState(false);

  const { data: firmsData, isLoading: firmsLoading } = usePropFirms();
  const firms: any[] = useMemo(() => {
    const raw = firmsData?.data ?? firmsData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [firmsData]);

  const { data: reviewsData, isLoading: reviewsLoading } = useFirmReviews(selectedSlug ?? '');
  const reviews: any[] = useMemo(() => {
    const raw = reviewsData?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [reviewsData]);

  const selectedFirm = firms.find(f => f.slug === selectedSlug);
  const filtered = verifiedOnly ? reviews.filter(r => r.verifiedTrader) : reviews;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Firm Hub</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Community ratings and verified trader reviews
          </p>
        </div>
        <button
          onClick={() => setShowWrite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Write Review
        </button>
      </div>

      <FirmHubTabs />

      {/* Trust explainer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[var(--profit)]/25 bg-[var(--profit)]/8 px-4 py-3">
        <ShieldCheck className="w-4 h-4 text-[var(--profit)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--foreground)]/90 leading-relaxed">
          <span className="font-semibold text-[var(--profit)]">Verified Trader</span> reviews come only from users who track a real account with that firm in PropOS — a trust signal no scraped review can fake.
        </p>
      </div>

      {/* Firm leaderboard */}
      {firmsLoading ? (
        <div className="flex items-center justify-center py-10 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading firms…
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          {firms.slice(0, 10).map((f, i) => {
            const rating = Number(f.communityRating ?? 0);
            const color = FIRM_COLORS[i % FIRM_COLORS.length];
            const active = selectedSlug === f.slug;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedSlug(active ? null : f.slug)}
                className={cn(
                  'stat-card text-left transition-all',
                  active ? 'ring-2 ring-[var(--primary)]' : 'hover:bg-[var(--secondary)]',
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: color }}>
                    {f.name[0]}
                  </div>
                  <p className="text-xs font-semibold text-[var(--foreground)] truncate">{f.name}</p>
                </div>
                <p className="text-xl font-bold text-[var(--foreground)] tabular-nums">
                  {rating > 0 ? rating.toFixed(1) : '—'}
                </p>
                <StarRating value={rating} />
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{f.reviewCount ?? 0} reviews</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Selection / filter bar */}
      {selectedFirm ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">Reviews for</span>
            <span className="text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">{selectedFirm.name}</span>
            <button onClick={() => setSelectedSlug(null)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline">Clear</button>
          </div>
          <button
            onClick={() => setVerifiedOnly(v => !v)}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors',
              verifiedOnly
                ? 'bg-[var(--profit)]/10 border-[var(--profit)]/30 text-[var(--profit)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Verified only
          </button>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-4">Select a firm above to read its reviews.</p>
      )}

      {/* Reviews list */}
      {selectedFirm && (
        reviewsLoading ? (
          <div className="flex items-center justify-center py-10 text-[var(--muted-foreground)]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading reviews…
          </div>
        ) : filtered.length === 0 ? (
          <div className="stat-card text-center py-12">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)] opacity-40" />
            <p className="text-sm font-medium text-[var(--foreground)] mb-1">
              {verifiedOnly ? 'No verified reviews yet' : 'No reviews yet'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">Be the first to review {selectedFirm.name}.</p>
            <button onClick={() => setShowWrite(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Write Review
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => {
              const author = r.user?.fullName ?? 'Anonymous';
              return (
                <div key={r.id} className="stat-card space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--secondary)] flex items-center justify-center text-sm font-bold text-[var(--foreground)] shrink-0">
                        {author[0]?.toUpperCase() ?? 'A'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[var(--foreground)]">{author}</p>
                          {r.verifiedTrader && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--profit)] bg-[var(--profit)]/10 px-1.5 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" /> Verified Trader
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating value={r.overallRating} size="md" />
                          <span className="text-xs font-bold text-[var(--foreground)]">{Number(r.overallRating).toFixed(1)}</span>
                          <span className="text-xs text-[var(--muted-foreground)]">· {fmtDate(r.createdAt)}</span>
                          {r.accountSizeTraded ? (
                            <span className="text-xs text-[var(--muted-foreground)]">· ${(Number(r.accountSizeTraded) / 1000).toFixed(0)}k account</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Criteria */}
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {CRITERIA.map(c => (
                      (r as any)[c.key] != null && (
                        <div key={c.key} className="flex items-center justify-between gap-2">
                          <p className="text-xs text-[var(--muted-foreground)] truncate">{c.label}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <StarRating value={(r as any)[c.key]} />
                            <span className="text-xs font-medium text-[var(--foreground)] tabular-nums">{(r as any)[c.key]}.0</span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>

                  {(r.reviewTitle || r.reviewBody) && (
                    <div className="border-t border-[var(--border)] pt-3">
                      {r.reviewTitle && <p className="text-sm font-semibold text-[var(--foreground)] mb-1">{r.reviewTitle}</p>}
                      {r.reviewBody && <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{r.reviewBody}</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-1">
                    <button className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.upvotes ?? 0})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {showWrite && (
        <WriteReviewModal
          onClose={() => setShowWrite(false)}
          presetSlug={selectedSlug ?? undefined}
        />
      )}
    </div>
  );
}
