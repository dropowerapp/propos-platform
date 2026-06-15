'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { month: 'Jan', pnl: 4200 },
  { month: 'Feb', pnl: 5600 },
  { month: 'Mar', pnl: -1900 },
  { month: 'Apr', pnl: 10500 },
  { month: 'May', pnl: 5700 },
  { month: 'Jun', pnl: 7300 },
  { month: 'Jul', pnl: 6700 },
  { month: 'Aug', pnl: 5800 },
  { month: 'Sep', pnl: 6600 },
  { month: 'Oct', pnl: 7200 },
  { month: 'Nov', pnl: 15400 },
  { month: 'Dec', pnl: 9100 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const v = payload[0].value;
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 text-xs">
        <p className="text-[var(--muted-foreground)]">{label}</p>
        <p className={v >= 0 ? 'text-[var(--profit)] font-bold' : 'text-[var(--loss)] font-bold'}>
          {v >= 0 ? '+' : ''}${v.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function MonthlyPnlChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="month"
          tick={{ fill: 'oklch(0.55 0.01 240)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'oklch(0.55 0.01 240)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={32}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.pnl >= 0 ? 'oklch(0.65 0.18 160)' : 'oklch(0.6 0.2 25)'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
