'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, TrendingUp, ChevronRight, ArrowUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropFirms, useFirmRecommendations } from '@/lib/hooks/use-prop-firms';
import { FirmHubTabs } from '@/components/firms/firm-hub-tabs';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i <= Math.floor(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : i - rating < 1
              ? 'text-yellow-400 fill-yellow-400/50'
              : 'text-[var(--border)]',
          )}
        />
      ))}
    </span>
  );
}

function TrustBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? 'text-[var(--profit)] bg-[var(--profit)]/10 border-[var(--profit)]/30'
      : score >= 80
      ? 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      : 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30';
  return (
    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', color)}>{score}</span>
  );
}

type SortKey = 'trustScore' | 'averageRating' | 'myScore' | 'minChallengePrice';

export default function FirmsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('myScore');
  const [showMatch, setShowMatch] = useState(false);

  const { data: firmsData, isLoading } = usePropFirms();
  const { data: recommendations } = useFirmRecommendations();

  const firmsRaw = firmsData?.data ?? firmsData?.firms ?? firmsData ?? [];
  const firms: any[] = Array.isArray(firmsRaw) ? firmsRaw : [];
  const recsRaw = recommendations?.data ?? recommendations?.recommendations ?? recommendations ?? [];
  const recs: any[] = Array.isArray(recsRaw) ? recsRaw : [];

  // Enrich firms with match score from recommendations
  const recMap = new Map(recs.map((r: any) => [r.firmId ?? r.id, r.score ?? 0]));
  const enriched = firms.map((f: any) => ({
    ...f,
    myScore: recMap.get(f.id) ?? 0,
    minChallengePrice: f.challengeTypes?.[0]?.accountSizes?.[0]?.price ?? 0,
  }));

  const filtered = enriched
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortBy] ?? 0;
      const vb = b[sortBy] ?? 0;
      return vb - va;
    });

  const top3 = [...enriched].sort((a, b) => b.myScore - a.myScore).slice(0, 3);
  const traderProfile = recommendations?.traderProfile;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Firm Hub</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Explore, compare and review {firms.length || '—'} verified prop firms
          </p>
        </div>
        <button
          onClick={() => setShowMatch(!showMatch)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-colors',
            showMatch
              ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
              : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]',
          )}
        >
          <TrendingUp className="w-4 h-4" /> My Match Score
        </button>
      </div>

      <FirmHubTabs />

      {/* My match banner */}
      {showMatch && (
        <div className="stat-card border-[var(--primary)]/40 border bg-[var(--primary)]/5 space-y-2">
          <p className="text-sm font-semibold text-[var(--foreground)]">🤖 Personalized Firm Match</p>
          {traderProfile ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Based on: Win Rate {(traderProfile.winRate * 100).toFixed(0)}% ·
              Avg DD {traderProfile.avgDrawdownPct?.toFixed(1)}% ·
              Avg hold {Math.round(traderProfile.avgHoldMinutes / 60)}h ·
              Trades/week ~{Math.round(traderProfile.tradeFrequencyPerWeek)} ·
              {traderProfile.usesScalping ? ' Scalping' : ' No scalping'}
            </p>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">Add trades to get personalized firm recommendations.</p>
          )}
          {top3.length > 0 && (
            <div className="flex gap-6 pt-1">
              {top3.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="text-[var(--muted-foreground)] text-sm font-bold">#{i + 1}</span>
                  <span className="font-semibold text-[var(--foreground)]">{f.name}</span>
                  <span className="text-[var(--primary)] font-bold">{f.myScore}%</span>
                  <div className="w-24 progress-bar">
                    <div className="progress-fill" style={{ width: `${f.myScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search firms..."
            className="pl-8 pr-3 py-1.5 text-sm bg-[var(--card)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] w-48"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="w-4 h-4 text-[var(--muted-foreground)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Sort by:</span>
          {([
            { k: 'myScore', l: 'My Match' },
            { k: 'trustScore', l: 'Trust Score' },
            { k: 'averageRating', l: 'Rating' },
            { k: 'minChallengePrice', l: 'Price' },
          ] as { k: SortKey; l: string }[]).map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                sortBy === k
                  ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading firms…
        </div>
      )}

      {/* Firms table */}
      {!isLoading && (
        <div className="stat-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Firm', 'Trust', 'Rating', 'My Match', 'From', 'Max Size', 'Profit Split', 'Payout', 'Platforms', ''].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)] pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => {
                  const platforms = f.challengeTypes?.flatMap((ct: any) => ct.platforms ?? [])
                    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
                    .slice(0, 3) ?? [];
                  const maxSize = Math.max(
                    ...(f.challengeTypes?.flatMap((ct: any) =>
                      ct.accountSizes?.map((s: any) => Number(s.accountSize ?? 0)) ?? []
                    ) ?? [0])
                  );
                  const minPrice = f.minChallengePrice;
                  const profitSplit = f.challengeTypes?.[0]?.accountSizes?.[0]?.phaseRules?.[0]?.profitSplitPct
                    ?? f.profitSplitPct
                    ?? 80;
                  const tags = f.tags ?? [];

                  return (
                    <tr
                      key={f.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors group cursor-pointer"
                      onClick={() => router.push(`/firms/${f.slug}`)}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--foreground)]">
                            {f.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">{f.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {tags.slice(0, 2).map((t: string) => (
                                <span key={t} className="text-[10px] px-1.5 py-0 rounded bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <TrustBadge score={f.trustScore ?? 80} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <Stars rating={f.averageRating ?? 4} />
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {(f.averageRating ?? 4).toFixed(1)} ({(f.reviewCount ?? 0).toLocaleString()})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {f.myScore > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 progress-bar">
                              <div className="progress-fill" style={{ width: `${f.myScore}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[var(--profit)]">{f.myScore}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-[var(--foreground)] tabular-nums">
                        {minPrice ? `$${minPrice}` : '—'}
                      </td>
                      <td className="py-3 pr-4 text-[var(--muted-foreground)] tabular-nums">
                        {maxSize > 0 ? `$${(maxSize / 1000).toFixed(0)}k` : '—'}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-[var(--profit)]">
                        {profitSplit ? `${profitSplit}%` : '—'}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[var(--muted-foreground)]">
                        {f.payoutFrequency ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[var(--muted-foreground)]">
                        {platforms.join(', ') || '—'}
                      </td>
                      <td className="py-3">
                        <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[var(--primary)] font-medium transition-opacity">
                          View <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-[var(--muted-foreground)] text-sm">
                      No firms found{search ? ` for "${search}"` : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
