'use client';

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { day: 'Jan 1',  confidence: 7, discipline: 8, stress: 3 },
  { day: 'Jan 5',  confidence: 8, discipline: 9, stress: 2 },
  { day: 'Jan 8',  confidence: 6, discipline: 5, stress: 7 },
  { day: 'Jan 10', confidence: 9, discipline: 9, stress: 2 },
  { day: 'Jan 12', confidence: 8, discipline: 8, stress: 3 },
  { day: 'Jan 14', confidence: 4, discipline: 3, stress: 8 },
  { day: 'Jan 15', confidence: 8, discipline: 9, stress: 3 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 text-xs space-y-1">
      <p className="text-[var(--muted-foreground)] font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}/10</p>
      ))}
    </div>
  );
};

export function PsychologyTrend() {
  return (
    <div className="stat-card">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Psychology Trend</h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <XAxis dataKey="day" tick={{ fill: 'oklch(0.55 0.01 240)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="confidence" name="Confidence" stroke="oklch(0.65 0.18 160)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="discipline"  name="Discipline"  stroke="#60a5fa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="stress"      name="Stress"      stroke="oklch(0.6 0.2 25)"  strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 rounded bg-[oklch(0.65_0.18_160)] inline-block" />Confidence</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 rounded bg-blue-400 inline-block" />Discipline</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 rounded bg-[oklch(0.6_0.2_25)] inline-block" />Stress</span>
      </div>
    </div>
  );
}
