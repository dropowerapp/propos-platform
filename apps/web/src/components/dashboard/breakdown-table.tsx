const MOCK_STRATEGIES = [
  { name: 'London Breakout', trades: 84, winRate: 71.4, pnl: 9200, pf: 3.1, avgR: 1.8 },
  { name: 'Supply & Demand', trades: 52, winRate: 58.1, pnl: 4100, pf: 1.9, avgR: 1.2 },
  { name: 'News Fade',       trades: 31, winRate: 51.6, pnl: 1200, pf: 1.4, avgR: 0.9 },
  { name: 'ICT Concepts',    trades: 20, winRate: 45.0, pnl: -800, pf: 0.9, avgR: 0.7 },
];

interface Row {
  name?: string;
  label?: string;
  trades?: number;
  totalTrades?: number;
  winRate: number;
  pnl?: number;
  netPnl?: number;
  pf?: number;
  profitFactor?: number;
  avgR?: number;
  avgRMultiple?: number;
}

export function BreakdownTable({ data, groupBy }: { data?: Row[]; groupBy?: string }) {
  const rows: Row[] = (data && data.length > 0) ? data : MOCK_STRATEGIES as Row[];
  const maxPnl = Math.max(...rows.map(s => Math.abs(Number(s.pnl ?? s.netPnl ?? 0))));
  const firstColLabel = groupBy === 'session' ? 'Session' : groupBy === 'symbol' ? 'Symbol' : groupBy === 'dayOfWeek' ? 'Day' : 'Strategy';

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {firstColLabel} Breakdown
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="text-left pb-2 font-medium">{firstColLabel}</th>
              <th className="text-right pb-2 font-medium">Trades</th>
              <th className="text-right pb-2 font-medium">Win Rate</th>
              <th className="text-right pb-2 font-medium">Net P&L</th>
              <th className="text-right pb-2 font-medium">Profit Factor</th>
              <th className="text-right pb-2 font-medium">Avg R</th>
              <th className="pb-2 pl-4 font-medium w-32">Bar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const label = s.name ?? s.label ?? String(i);
              const trades = s.trades ?? s.totalTrades ?? 0;
              const winRate = Number(s.winRate ?? 0) * (s.winRate != null && s.winRate <= 1 ? 100 : 1);
              const pnl = Number(s.pnl ?? s.netPnl ?? 0);
              const pf = Number(s.pf ?? s.profitFactor ?? 0);
              const avgR = Number(s.avgR ?? s.avgRMultiple ?? 0);

              return (
                <tr key={label} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors">
                  <td className="py-3 font-medium text-[var(--foreground)]">{label}</td>
                  <td className="py-3 text-right text-[var(--muted-foreground)] tabular-nums">{trades}</td>
                  <td className="py-3 text-right tabular-nums" style={{ color: winRate >= 60 ? 'var(--profit)' : winRate >= 50 ? 'var(--warning)' : 'var(--loss)' }}>
                    {winRate.toFixed(1)}%
                  </td>
                  <td className="py-3 text-right font-semibold tabular-nums" style={{ color: pnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                    {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
                  </td>
                  <td className="py-3 text-right tabular-nums" style={{ color: pf >= 1.5 ? 'var(--profit)' : pf >= 1 ? 'var(--warning)' : 'var(--loss)' }}>
                    {pf.toFixed(2)}
                  </td>
                  <td className="py-3 text-right tabular-nums" style={{ color: avgR >= 1 ? 'var(--profit)' : 'var(--loss)' }}>
                    {avgR.toFixed(2)}R
                  </td>
                  <td className="py-3 pl-4">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${pnl < 0 ? 'danger' : ''}`}
                        style={{ width: `${maxPnl > 0 ? (Math.abs(pnl) / maxPnl) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
