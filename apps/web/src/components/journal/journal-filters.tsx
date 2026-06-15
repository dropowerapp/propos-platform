'use client';

export function JournalFilters() {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { options: ['All Entry Types', 'Trade', 'Daily Review', 'Weekly Review'] },
        { options: ['All Emotions', 'Calm', 'Excited', 'Frustrated', 'Anxious'] },
        { options: ['All Outcomes', 'Win', 'Loss', 'Mixed'] },
        { options: ['This Month', 'Last Month', 'Last 3 Months', 'All Time'] },
      ].map((f, i) => (
        <select key={i} className="text-sm bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]">
          {f.options.map(o => <option key={o}>{o}</option>)}
        </select>
      ))}
    </div>
  );
}
