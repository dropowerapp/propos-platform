const firms = [
  { name: 'FTMO', invested: 4200, earned: 38000, roi: 805 },
  { name: 'FundingPips', invested: 1200, earned: 8500, roi: 608 },
  { name: 'The5ers', invested: 3800, earned: 22000, roi: 479 },
  { name: 'E8 Markets', invested: 1800, earned: 9200, roi: 411 },
  { name: 'Alpha Capital', invested: 1400, earned: 6500, roi: 364 },
];

const maxRoi = Math.max(...firms.map(f => f.roi));

export function RoiByFirmPanel() {
  return (
    <div className="stat-card flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">ROI by Prop Firm</h2>
      <div className="space-y-3">
        {firms.map((f) => (
          <div key={f.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-[var(--foreground)]">{f.name}</span>
              <span className="text-[var(--profit)] font-bold">{f.roi}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(f.roi / maxRoi) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              ${f.invested.toLocaleString()} → ${f.earned.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
