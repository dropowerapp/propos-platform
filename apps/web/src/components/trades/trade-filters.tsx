'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

export function TradeFilters() {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search symbol, strategy..."
          className="pl-8 pr-3 py-1.5 text-sm bg-[var(--card)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] w-56"
        />
      </div>
      {[
        { label: 'Account', options: ['All Accounts', 'FTMO 100k', 'FundingPips 200k', 'E8 50k'] },
        { label: 'Direction', options: ['All Directions', 'Long', 'Short'] },
        { label: 'Outcome', options: ['All Outcomes', 'Win', 'Loss', 'Breakeven'] },
        { label: 'Session', options: ['All Sessions', 'London', 'New York', 'Asian'] },
        { label: 'Strategy', options: ['All Strategies', 'London Breakout', 'Supply & Demand', 'ICT Concepts'] },
      ].map(f => (
        <select
          key={f.label}
          className="text-sm bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] focus:text-[var(--foreground)]"
        >
          {f.options.map(o => <option key={o}>{o}</option>)}
        </select>
      ))}
      <div className="flex items-center gap-2 ml-auto">
        <input type="date" className="text-sm bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
        <span className="text-[var(--muted-foreground)] text-sm">→</span>
        <input type="date" className="text-sm bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
      </div>
    </div>
  );
}
