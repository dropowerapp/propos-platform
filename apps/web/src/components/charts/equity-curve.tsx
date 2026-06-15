'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Jan', equity: 0 },
  { date: 'Feb', equity: 4200 },
  { date: 'Mar', equity: 9800 },
  { date: 'Apr', equity: 7900 },
  { date: 'May', equity: 18400 },
  { date: 'Jun', equity: 24100 },
  { date: 'Jul', equity: 31500 },
  { date: 'Aug', equity: 38200 },
  { date: 'Sep', equity: 44800 },
  { date: 'Oct', equity: 52000 },
  { date: 'Nov', equity: 67400 },
  { date: 'Dec', equity: 84200 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 text-xs">
        <p className="text-[var(--muted-foreground)]">{label}</p>
        <p className="text-[var(--profit)] font-bold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function EquityCurveChart({ data: propData }: { data?: Array<{ date: string; equity: number }> }) {
  const chartData = (propData && propData.length > 0) ? propData : data;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.65 0.18 160)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="oklch(0.65 0.18 160)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
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
        <Area
          type="monotone"
          dataKey="equity"
          stroke="oklch(0.65 0.18 160)"
          strokeWidth={2}
          fill="url(#equityGrad)"
          dot={false}
          activeDot={{ r: 4, fill: 'oklch(0.65 0.18 160)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
