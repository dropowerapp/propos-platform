'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, Shield, Star, TrendingUp, Clock,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Static data — will be replaced by usePropFirm(slug) once API is live
const FIRM_DATA: Record<string, any> = {
  ftmo: {
    name: 'FTMO', slug: 'ftmo', country: 'Czech Republic', founded: 2014,
    website: 'https://ftmo.com', trustScore: 91, communityRating: 4.8, reviewCount: 3891,
    description: 'One of the most established prop firms worldwide, operating since 2014. Known for reliability, fast payouts (often same-day), and transparent rules. FTMO has paid out over $220 million to funded traders globally.',
    instruments: ['Forex', 'Indices', 'Commodities', 'Crypto', 'Stocks'],
    platforms: ['MT4', 'MT5', 'cTrader'],
    payoutMethods: ['Bank Wire', 'Skrill', 'Wise'],
    ratings: { payoutSpeed: 4.9, customerSupport: 4.6, executionQuality: 4.8, slippage: 4.5, transparency: 4.9, dashboardUx: 4.7 },
    challengeTypes: [
      {
        name: '2-Step FTMO Challenge', slug: '2-step',
        sizes: [10000, 25000, 50000, 100000, 200000],
        prices: [155, 250, 345, 540, 1080],
        phases: [
          { phase: 'Phase 1', profitTarget: '10%', dailyDD: '5%', maxDD: '10%', minDays: 4, newsTrading: false, overnight: true, weekend: false, consistency: false, profitSplit: '80%', payout: 'On Demand' },
          { phase: 'Phase 2', profitTarget: '5%',  dailyDD: '5%', maxDD: '10%', minDays: 4, newsTrading: false, overnight: true, weekend: false, consistency: false, profitSplit: '80%', payout: 'On Demand' },
          { phase: 'Funded',  profitTarget: '—',   dailyDD: '5%', maxDD: '10%', minDays: 0, newsTrading: false, overnight: true, weekend: false, consistency: false, profitSplit: '80%', payout: 'On Demand' },
        ],
      },
      {
        name: 'Swing FTMO Challenge', slug: 'swing',
        sizes: [10000, 25000, 50000, 100000, 200000],
        prices: [250, 345, 480, 750, 1480],
        phases: [
          { phase: 'Phase 1', profitTarget: '10%', dailyDD: '10%', maxDD: '20%', minDays: 4, newsTrading: true, overnight: true, weekend: true, consistency: false, profitSplit: '80%', payout: 'On Demand' },
          { phase: 'Phase 2', profitTarget: '5%',  dailyDD: '10%', maxDD: '20%', minDays: 4, newsTrading: true, overnight: true, weekend: true, consistency: false, profitSplit: '80%', payout: 'On Demand' },
        ],
      },
    ],
    ruleHistory: [
      { date: 'Mar 1, 2024', change: 'Reduced Phase 1 minimum trading days from 10 to 4', type: 'positive' },
      { date: 'Jan 15, 2024', change: 'Added scaling plan — account size grows 25% every 4 profitable months', type: 'positive' },
      { date: 'Nov 3, 2023', change: 'News trading restricted to 2 minutes before/after high-impact events', type: 'negative' },
      { date: 'Aug 20, 2023', change: 'Introduced cTrader as a supported trading platform', type: 'positive' },
      { date: 'May 12, 2023', change: 'Minimum payout amount reduced from $500 to $0 (on-demand)', type: 'positive' },
    ],
    reviews: [
      { user: 'TradingJohn92', rating: 5, date: 'Feb 12, 2024', title: 'Best prop firm I have used', body: 'Fast payouts, fair rules, and excellent customer support. Got funded on my first attempt and received my first payout in under 24 hours.', verified: true, accountSize: 100000 },
      { user: 'EURUSDScalper', rating: 4, date: 'Jan 28, 2024', title: 'Great but news trading restriction is annoying', body: 'Rules are clear and the platform works well. Lost one challenge because I traded 1 minute before a news event I forgot about. Dashboard could be better.', verified: true, accountSize: 50000 },
      { user: 'SwingTrader_PT', rating: 5, date: 'Jan 5, 2024', title: 'Swing challenge is perfect for my style', body: 'The swing challenge allows overnight and weekend holding which suits my trading style perfectly. No daily loss limit stress either.', verified: false, accountSize: 200000 },
    ],
  },
  fundingpips: {
    name: 'FundingPips', slug: 'fundingpips', country: 'UAE', founded: 2022,
    website: 'https://fundingpips.com', trustScore: 94, communityRating: 4.6, reviewCount: 1247,
    description: 'One of the fastest-growing prop firms with the most competitive pricing in the market. Known for on-demand payouts (often within 1 hour), low challenge costs, and trader-friendly rules.',
    instruments: ['Forex', 'Indices', 'Commodities', 'Metals'],
    platforms: ['MT5', 'cTrader'],
    payoutMethods: ['Bank Wire', 'Crypto', 'Wise'],
    ratings: { payoutSpeed: 4.9, customerSupport: 4.5, executionQuality: 4.6, slippage: 4.4, transparency: 4.7, dashboardUx: 4.3 },
    challengeTypes: [
      {
        name: '1-Step Challenge', slug: '1-step',
        sizes: [5000, 10000, 25000, 50000, 100000, 200000],
        prices: [49, 75, 149, 249, 449, 799],
        phases: [
          { phase: 'Challenge', profitTarget: '8%', dailyDD: '4%', maxDD: '8%', minDays: 3, newsTrading: true, overnight: true, weekend: false, consistency: false, profitSplit: '80%', payout: 'On Demand' },
          { phase: 'Funded',   profitTarget: '—',  dailyDD: '4%', maxDD: '8%', minDays: 0, newsTrading: true, overnight: true, weekend: false, consistency: false, profitSplit: '80%', payout: 'On Demand' },
        ],
      },
    ],
    ruleHistory: [
      { date: 'Feb 20, 2024', change: 'Reduced 1-Step challenge price by 15% across all account sizes', type: 'positive' },
      { date: 'Jan 10, 2024', change: 'Launched cTrader as supported platform', type: 'positive' },
      { date: 'Dec 5, 2023',  change: 'Added Crypto to available instruments', type: 'positive' },
    ],
    reviews: [
      { user: 'FXProTrader', rating: 5, date: 'Feb 15, 2024', title: 'Fastest payouts I have ever seen', body: 'Requested a payout at 9am and it was in my crypto wallet by 10:30am. Rules are fair and the challenge is straightforward.', verified: true, accountSize: 200000 },
      { user: 'LondonSession', rating: 4, date: 'Jan 20, 2024', title: 'Great value, minor dashboard issues', body: 'For the price, this is unbeatable. 4% daily drawdown is tighter than others but manageable if you trade properly. Dashboard could use some improvements.', verified: true, accountSize: 50000 },
    ],
  },
};

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--muted-foreground)] w-36 shrink-0">{label}</span>
      <div className="flex-1 progress-bar"><div className="progress-fill" style={{ width: `${(value / 5) * 100}%` }} /></div>
      <span className="text-xs font-bold text-[var(--foreground)] w-8 text-right">{value}</span>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn('w-3.5 h-3.5', i <= Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border)]')} />
      ))}
    </span>
  );
}

export default function FirmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const firm = FIRM_DATA[slug];
  const [selectedType, setSelectedType] = useState(0);
  const [selectedSize, setSelectedSize] = useState(3); // default 100k

  if (!firm) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted-foreground)]">Prop firm not found.</p>
        <Link href="/firms" className="text-[var(--primary)] text-sm mt-2 inline-block">← Back to directory</Link>
      </div>
    );
  }

  const ct = firm.challengeTypes[selectedType];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <Link href="/firms" className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
      </Link>

      {/* Header */}
      <div className="stat-card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center text-2xl font-black text-[var(--foreground)]">
              {firm.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--foreground)]">{firm.name}</h1>
                {firm.trustScore >= 90 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--profit)] bg-[var(--profit)]/10 border border-[var(--profit)]/30 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--muted-foreground)]">
                <span>{firm.country} · Est. {firm.founded}</span>
                <a href={firm.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors">
                  <ExternalLink className="w-3 h-3" /> Website
                </a>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <Stars rating={firm.communityRating} />
                  <span className="text-sm font-semibold text-[var(--foreground)]">{firm.communityRating}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">({firm.reviewCount.toLocaleString()} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[var(--profit)]" />
                  <span className="text-sm font-semibold text-[var(--profit)]">Trust {firm.trustScore}/100</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
              + Add Account
            </button>
            <a href={firm.website} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
              Visit Firm →
            </a>
          </div>
        </div>
        <p className="mt-4 text-sm text-[var(--muted-foreground)] leading-relaxed">{firm.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {firm.instruments.map((i: string) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">{i}</span>
          ))}
          {firm.platforms.map((p: string) => (
            <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-400">{p}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Rules section */}
        <div className="xl:col-span-2 space-y-4">
          {/* Challenge type selector */}
          <div className="flex gap-2">
            {firm.challengeTypes.map((ct: any, i: number) => (
              <button key={ct.slug} onClick={() => setSelectedType(i)}
                className={cn('px-4 py-2 rounded-md text-sm font-medium border transition-colors',
                  selectedType === i ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}>
                {ct.name}
              </button>
            ))}
          </div>

          {/* Account size selector */}
          <div className="stat-card space-y-4">
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Account Size</p>
              <div className="flex flex-wrap gap-2">
                {ct.sizes.map((s: number, i: number) => (
                  <button key={s} onClick={() => setSelectedSize(i)}
                    className={cn('px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors',
                      selectedSize === i ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}>
                    ${(s / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--secondary)] rounded-lg">
              <span className="text-sm text-[var(--muted-foreground)]">Challenge price for ${(ct.sizes[selectedSize] / 1000).toFixed(0)}k account</span>
              <span className="text-xl font-bold text-[var(--foreground)]">${ct.prices[selectedSize]}</span>
            </div>

            {/* Phase rules table */}
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">Rules by Phase</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {['', 'Profit Target', 'Daily DD', 'Max DD', 'Min Days', 'Profit Split', 'Payout'].map(h => (
                        <th key={h} className="text-left pb-2 text-xs font-medium text-[var(--muted-foreground)] pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ct.phases.map((p: any) => (
                      <tr key={p.phase} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2.5 pr-3 font-semibold text-[var(--foreground)] whitespace-nowrap">{p.phase}</td>
                        <td className="py-2.5 pr-3 font-bold text-[var(--profit)]">{p.profitTarget}</td>
                        <td className="py-2.5 pr-3 text-[var(--warning)]">{p.dailyDD}</td>
                        <td className="py-2.5 pr-3 text-[var(--warning)]">{p.maxDD}</td>
                        <td className="py-2.5 pr-3 text-[var(--muted-foreground)]">{p.minDays || '—'}</td>
                        <td className="py-2.5 pr-3 font-semibold text-[var(--profit)]">{p.profitSplit}</td>
                        <td className="py-2.5 pr-3 text-xs text-[var(--muted-foreground)]">{p.payout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Restrictions */}
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">Trading Restrictions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'News Trading', allowed: ct.phases[0].newsTrading },
                  { label: 'Overnight Holding', allowed: ct.phases[0].overnight },
                  { label: 'Weekend Holding', allowed: ct.phases[0].weekend },
                  { label: 'EA / Bot Trading', allowed: true },
                  { label: 'Copy Trading', allowed: false },
                  { label: 'Consistency Rule', allowed: !ct.phases[0].consistency },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-2 text-xs">
                    {r.allowed
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--profit)] shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-[var(--loss)] shrink-0" />}
                    <span className={r.allowed ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rule change history */}
          <div className="stat-card space-y-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">📋 Rule Change History</h2>
            {firm.ruleHistory.map((h: any, i: number) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
                <div className={cn('mt-0.5 shrink-0', h.type === 'positive' ? 'text-[var(--profit)]' : h.type === 'negative' ? 'text-[var(--loss)]' : 'text-[var(--muted-foreground)]')}>
                  {h.type === 'positive' ? <TrendingUp className="w-3.5 h-3.5" /> : h.type === 'negative' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--muted-foreground)] mb-0.5">{h.date}</p>
                  <p className="text-sm text-[var(--foreground)]">{h.change}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Community ratings */}
          <div className="stat-card space-y-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">⭐ Community Ratings</h2>
            <div className="text-center py-2">
              <p className="text-4xl font-black text-[var(--foreground)]">{firm.communityRating}</p>
              <Stars rating={firm.communityRating} />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{firm.reviewCount.toLocaleString()} verified reviews</p>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
              {Object.entries(firm.ratings).map(([k, v]) => (
                <RatingBar key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v as number} />
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="stat-card space-y-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Quick Facts</h2>
            {[
              { label: 'Founded', value: firm.founded },
              { label: 'Country', value: firm.country },
              { label: 'Max Account', value: `$${(Math.max(...ct.sizes) / 1000).toFixed(0)}k` },
              { label: 'Min Price', value: `$${Math.min(...ct.prices)}` },
              { label: 'Payout Method', value: firm.payoutMethods.join(', ') },
            ].map(f => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">{f.label}</span>
                <span className="font-medium text-[var(--foreground)]">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="stat-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Trader Reviews</h2>
          <button className="text-xs text-[var(--primary)] hover:opacity-80 font-medium">+ Write a Review</button>
        </div>
        {firm.reviews.map((r: any, i: number) => (
          <div key={i} className="border-b border-[var(--border)] last:border-0 pb-4 last:pb-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--secondary)] flex items-center justify-center text-xs font-bold text-[var(--foreground)]">
                  {r.user.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--foreground)]">{r.user}</span>
                    {r.verified && <span className="text-[10px] text-[var(--profit)] bg-[var(--profit)]/10 px-1.5 py-0.5 rounded-full border border-[var(--profit)]/20">✓ Verified Trader</span>}
                    {r.accountSize && <span className="text-[10px] text-[var(--muted-foreground)]">${(r.accountSize / 1000).toFixed(0)}k account</span>}
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{r.date}</p>
                </div>
              </div>
              <Stars rating={r.rating} />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{r.title}</p>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
