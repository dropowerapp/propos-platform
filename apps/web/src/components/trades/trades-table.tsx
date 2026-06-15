'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ExternalLink, BookOpen } from 'lucide-react';
import { TradeDetailDrawer } from './trade-detail-drawer';

const MOCK_TRADES = [
  { id: '1', date: 'Jan 15 09:32', symbol: 'EURUSD', direction: 'long',  session: 'London',   lots: 0.50, openPrice: 1.08501, closePrice: 1.09201, sl: 1.0800, tp: 1.0950, pnl: 480,   rMultiple: 1.8,  duration: '5h 13m', outcome: 'win',  strategy: 'London Breakout', account: 'FTMO 100k'   },
  { id: '2', date: 'Jan 14 09:15', symbol: 'GBPUSD', direction: 'short', session: 'London',   lots: 0.30, openPrice: 1.27200, closePrice: 1.27560, sl: 1.2760, tp: 1.2660, pnl: -180,  rMultiple: -0.9, duration: '2h 04m', outcome: 'loss', strategy: 'Supply & Demand', account: 'FTMO 100k'  },
  { id: '3', date: 'Jan 14 14:22', symbol: 'EURUSD', direction: 'long',  session: 'New York', lots: 0.40, openPrice: 1.08320, closePrice: 1.08920, sl: 1.0800, tp: 1.0900, pnl: 240,   rMultiple: 1.2,  duration: '3h 48m', outcome: 'win',  strategy: 'Supply & Demand', account: 'FP 200k'    },
  { id: '4', date: 'Jan 13 10:05', symbol: 'XAUUSD', direction: 'long',  session: 'London',   lots: 0.10, openPrice: 2015.00, closePrice: 2038.00, sl: 2008.0, tp: 2038.0, pnl: 920,   rMultiple: 2.3,  duration: '6h 22m', outcome: 'win',  strategy: 'Supply & Demand', account: 'E8 50k'     },
  { id: '5', date: 'Jan 12 08:55', symbol: 'GBPJPY', direction: 'short', session: 'London',   lots: 0.20, openPrice: 185.420, closePrice: 185.120, sl: 185.80, tp: 184.60, pnl: 390,   rMultiple: 1.6,  duration: '4h 11m', outcome: 'win',  strategy: 'London Breakout', account: 'FTMO 100k'   },
  { id: '6', date: 'Jan 11 15:30', symbol: 'USDJPY', direction: 'long',  session: 'New York', lots: 0.30, openPrice: 146.500, closePrice: 146.200, sl: 146.10, tp: 147.20, pnl: -180,  rMultiple: -0.9, duration: '1h 30m', outcome: 'loss', strategy: null,              account: 'FP 200k'    },
  { id: '7', date: 'Jan 10 09:18', symbol: 'EURUSD', direction: 'long',  session: 'London',   lots: 0.50, openPrice: 1.09100, closePrice: 1.09650, sl: 1.0870, tp: 1.0990, pnl: 275,   rMultiple: 1.1,  duration: '3h 55m', outcome: 'win',  strategy: 'London Breakout', account: 'FTMO 100k'   },
  { id: '8', date: 'Jan 09 02:10', symbol: 'AUDUSD', direction: 'short', session: 'Asian',    lots: 0.25, openPrice: 0.66200, closePrice: 0.66400, sl: 0.6650, tp: 0.6580, pnl: -62,   rMultiple: -0.5, duration: '3h 20m', outcome: 'loss', strategy: 'ICT Concepts',    account: 'E8 50k'     },
  { id: '9', date: 'Jan 08 09:45', symbol: 'GBPUSD', direction: 'long',  session: 'London',   lots: 0.40, openPrice: 1.27600, closePrice: 1.28400, sl: 1.2720, tp: 1.2840, pnl: 640,   rMultiple: 2.0,  duration: '4h 45m', outcome: 'win',  strategy: 'London Breakout', account: 'FTMO 100k'   },
  { id: '10', date: 'Jan 07 14:00', symbol: 'XAUUSD', direction: 'short', session: 'New York', lots: 0.05, openPrice: 2028.00, closePrice: 2019.00, sl: 2035.0, tp: 2014.0, pnl: 225,   rMultiple: 1.3,  duration: '2h 00m', outcome: 'win',  strategy: 'Supply & Demand', account: 'FP 200k'  },
];

type SortKey = 'date' | 'symbol' | 'pnl' | 'rMultiple';

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return d;
  }
}

function fmtDuration(secs: number) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TradesTable({ trades: propTrades, total }: { trades?: any[]; total?: number }) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const rawTrades = (propTrades && propTrades.length > 0) ? propTrades : MOCK_TRADES;
  const isRealData = propTrades && propTrades.length > 0;

  const sorted = [...rawTrades].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'pnl') return (Number(a.pnl ?? a.netPnl ?? 0) - Number(b.pnl ?? b.netPnl ?? 0)) * mul;
    if (sortKey === 'rMultiple') return (Number(a.rMultiple ?? a.rMultipleNet ?? 0) - Number(b.rMultiple ?? b.rMultipleNet ?? 0)) * mul;
    if (sortKey === 'symbol') return (a.symbol ?? '').localeCompare(b.symbol ?? '') * mul;
    return (a.id ?? '').localeCompare(b.id ?? '') * mul;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  }

  function SortTh({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        onClick={() => handleSort(k)}
        className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] select-none"
      >
        <span className="flex items-center gap-1">{label}<SortIcon k={k} /></span>
      </th>
    );
  }

  return (
    <div className="stat-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <SortTh label="Date & Time" k="date" />
              <SortTh label="Symbol" k="symbol" />
              <th className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)]">Dir</th>
              <th className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)]">Session</th>
              <th className="text-right pb-3 text-xs font-medium text-[var(--muted-foreground)]">Lots</th>
              <th className="text-right pb-3 text-xs font-medium text-[var(--muted-foreground)]">Entry</th>
              <th className="text-right pb-3 text-xs font-medium text-[var(--muted-foreground)]">Exit</th>
              <SortTh label="Net P&L" k="pnl" />
              <SortTh label="R-Mult" k="rMultiple" />
              <th className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)]">Duration</th>
              <th className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)]">Strategy</th>
              <th className="text-left pb-3 text-xs font-medium text-[var(--muted-foreground)]">Account</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const pnl = Number(t.pnl ?? t.netPnl ?? 0);
              const rMult = Number(t.rMultiple ?? t.rMultipleNet ?? 0);
              const direction = t.direction ?? 'long';
              const dateStr = isRealData ? fmtDate(t.openedAt ?? t.date ?? '') : (t.date ?? '');
              const durationStr = isRealData
                ? fmtDuration(t.durationSeconds ?? 0)
                : (t.duration ?? '—');
              const strategyName = t.strategy?.name ?? t.strategy ?? null;
              const accountName = t.propFirmAccount?.propFirm?.name
                ? `${t.propFirmAccount.propFirm.name} ${(Number(t.propFirmAccount.accountSize ?? 0) / 1000).toFixed(0)}k`
                : (t.account ?? '—');

              return (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTrade(t)}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors group cursor-pointer"
                >
                  <td className="py-3 text-[var(--muted-foreground)] text-xs tabular-nums">{dateStr}</td>
                  <td className="py-3 font-semibold text-[var(--foreground)]">{t.symbol}</td>
                  <td className="py-3">
                    <span className={cn(
                      'text-xs font-semibold px-1.5 py-0.5 rounded',
                      direction === 'long' ? 'bg-[var(--profit)]/15 text-[var(--profit)]' : 'bg-[var(--loss)]/15 text-[var(--loss)]',
                    )}>
                      {direction === 'long' ? '▲ Long' : '▼ Short'}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-[var(--muted-foreground)]">{t.session ?? '—'}</td>
                  <td className="py-3 text-right tabular-nums text-[var(--muted-foreground)]">{Number(t.lots ?? 0).toFixed(2)}</td>
                  <td className="py-3 text-right tabular-nums text-xs text-[var(--muted-foreground)]">{Number(t.openPrice ?? 0)}</td>
                  <td className="py-3 text-right tabular-nums text-xs text-[var(--muted-foreground)]">{Number(t.closePrice ?? 0)}</td>
                  <td className={cn('py-3 text-right font-bold tabular-nums', pnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                    {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString()}
                  </td>
                  <td className={cn('py-3 text-right font-semibold tabular-nums', rMult >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]')}>
                    {rMult >= 0 ? '+' : ''}{rMult.toFixed(2)}R
                  </td>
                  <td className="py-3 text-xs text-[var(--muted-foreground)]">{durationStr}</td>
                  <td className="py-3 text-xs text-[var(--muted-foreground)]">
                    {strategyName ?? <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="py-3 text-xs text-[var(--muted-foreground)]">{accountName}</td>
                  <td className="py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Open journal"
                        onClick={e => { e.stopPropagation(); setSelectedTrade(t); }}
                        className="p-1 hover:text-[var(--primary)] text-[var(--muted-foreground)] transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedTrade && (
        <TradeDetailDrawer trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
      {/* Pagination */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted-foreground)]">
          Showing {sorted.length} of {total ?? sorted.length} trades
          {!isRealData && <span className="ml-1 text-[var(--warning)]">(demo)</span>}
        </p>
        <div className="flex gap-1">
          {['←', '1', '2', '3', '...', '→'].map((p) => (
            <button
              key={p}
              className={cn(
                'px-2.5 py-1 text-xs rounded',
                p === '1' ? 'bg-[var(--primary)] text-black font-bold' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
