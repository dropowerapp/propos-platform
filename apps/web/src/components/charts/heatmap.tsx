'use client';

import { cn } from '@/lib/utils';

const sessions = ['Asian', 'London', 'New York', 'Overlap'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Mock data: value = net PnL for that session/day combination
const data: Record<string, Record<string, number>> = {
  Asian:    { Mon: -120, Tue: -80,  Wed: 40,   Thu: -200, Fri: -150 },
  London:   { Mon: 850,  Tue: 1200, Wed: 920,  Thu: 680,  Fri: 400  },
  'New York':{ Mon: 620, Tue: 480,  Wed: -180, Thu: -90,  Fri: -320 },
  Overlap:  { Mon: 940,  Tue: 1100, Wed: 780,  Thu: 560,  Fri: 320  },
};

const maxAbs = Math.max(...Object.values(data).flatMap(d => Object.values(d).map(Math.abs)));

function getCellColor(value: number): string {
  const intensity = Math.abs(value) / maxAbs;
  if (value > 0) return `rgba(var(--profit-rgb, 101 163 80), ${0.15 + intensity * 0.7})`;
  return `rgba(var(--loss-rgb, 180 60 40), ${0.15 + intensity * 0.7})`;
}

export function HeatmapChart() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-[var(--muted-foreground)] font-medium pb-2 pr-3">Session</th>
            {days.map(d => (
              <th key={d} className="text-center text-[var(--muted-foreground)] font-medium pb-2 w-16">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody className="space-y-1">
          {sessions.map(session => (
            <tr key={session}>
              <td className="text-[var(--muted-foreground)] pr-3 py-1 font-medium">{session}</td>
              {days.map(day => {
                const val = data[session]?.[day] ?? 0;
                return (
                  <td key={day} className="py-1 px-1">
                    <div
                      className="rounded text-center py-2 font-semibold text-[var(--foreground)]"
                      style={{ background: val > 0 ? 'rgba(101,163,80,0.2)' : 'rgba(180,60,40,0.2)' }}
                      title={`${session} ${day}: ${val > 0 ? '+' : ''}$${val}`}
                    >
                      {val > 0 ? '+' : ''}${(val / 1000).toFixed(1)}k
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(101,163,80,0.6)' }} />
          Profitable
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(180,60,40,0.6)' }} />
          Losing
        </div>
      </div>
    </div>
  );
}
