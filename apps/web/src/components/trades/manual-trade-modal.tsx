'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export function ManualTradeModal({ onClose }: { onClose: () => void }) {
  const [direction, setDirection] = useState<'long' | 'short'>('long');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Add Trade Manually</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Account</label>
              <select className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]">
                <option>FTMO 100k</option>
                <option>FundingPips 200k</option>
                <option>E8 50k</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Symbol</label>
              <input type="text" placeholder="EURUSD" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] uppercase" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Direction</label>
              <div className="flex gap-2">
                {(['long','short'] as const).map(d => (
                  <button key={d} onClick={() => setDirection(d)}
                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${direction === d ? (d === 'long' ? 'bg-[var(--profit)]/20 text-[var(--profit)] border border-[var(--profit)]/40' : 'bg-[var(--loss)]/20 text-[var(--loss)] border border-[var(--loss)]/40') : 'bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)]'}`}
                  >
                    {d === 'long' ? '▲ Long' : '▼ Short'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Lots</label>
              <input type="number" placeholder="0.50" step="0.01" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Open Time</label>
              <input type="datetime-local" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Close Time</label>
              <input type="datetime-local" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Open Price</label>
              <input type="number" placeholder="1.08500" step="0.00001" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Close Price</label>
              <input type="number" placeholder="1.09200" step="0.00001" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Stop Loss</label>
              <input type="number" placeholder="1.08000" step="0.00001" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Take Profit</label>
              <input type="number" placeholder="1.09500" step="0.00001" className="w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
            <button className="px-5 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
              Save Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
