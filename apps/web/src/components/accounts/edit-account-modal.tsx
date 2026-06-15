'use client';

import { useState } from 'react';
import { X, Loader2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateAccount, useResetAccount } from '@/lib/hooks/use-accounts';

// ─── Edit account modal ─────────────────────────────────────────────────────────
// Lets a trader correct the fee they paid, log add-on costs, change lifecycle
// status, and record a reset (resets/add-ons accrue over an account's life and
// must be captured for Total Costs / Lifetime Net Profit to stay honest).

const STATUSES = [
  { value: 'active', label: 'In Evaluation' },
  { value: 'funded', label: 'Funded' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
];

export function EditAccountModal({ account, onClose }: { account: any; onClose: () => void }) {
  const update = useUpdateAccount();
  const reset = useResetAccount();

  const firmName = account.propFirm?.name ?? account.firm ?? 'Account';
  const size = Number(account.accountSize ?? 0);

  const [accountName, setAccountName] = useState<string>(account.accountName ?? '');
  const [challengeCost, setChallengeCost] = useState<number | ''>(Number(account.challengeCost ?? 0) || '');
  const [addonCosts, setAddonCosts] = useState<number | ''>(Number(account.addonCosts ?? 0) || '');
  const [status, setStatus] = useState<string>(account.status ?? 'active');
  const [resetFee, setResetFee] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError('');
    try {
      await update.mutateAsync({
        id: account.id,
        body: {
          accountName: accountName || undefined,
          challengeCost: challengeCost === '' ? undefined : Number(challengeCost),
          addonCosts: addonCosts === '' ? 0 : Number(addonCosts),
          status,
        },
      });
      setSaved(true);
      setTimeout(onClose, 700);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save changes.');
    }
  }

  async function handleReset() {
    if (resetFee === '' || Number(resetFee) < 0) { setError('Enter the reset fee you paid.'); return; }
    setError('');
    try {
      await reset.mutateAsync({ id: account.id, body: { resetFee: Number(resetFee) } });
      setSaved(true);
      setTimeout(onClose, 700);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to record reset.');
    }
  }

  const busy = update.isPending || reset.isPending;
  const resetCount = Number(account.resetCount ?? 0);
  const totalResetFees = Number(account.totalResetFees ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Edit Account</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{firmName} ${(size / 1000).toFixed(0)}k</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Account Name</label>
            <input
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder={`${firmName} ${(size / 1000).toFixed(0)}k`}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Challenge fee ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={challengeCost}
                onChange={e => setChallengeCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Add-on costs ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={addonCosts}
                onChange={e => setAddonCosts(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    'px-3 py-2 rounded-md border text-xs font-medium transition-colors',
                    status === s.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Record a reset
              </label>
              {resetCount > 0 && (
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {resetCount} reset{resetCount !== 1 ? 's' : ''} · ${totalResetFees.toLocaleString()} so far
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="number" min="0" step="0.01"
                value={resetFee}
                onChange={e => setResetFee(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Reset fee paid ($)"
                className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
              <button
                onClick={handleReset}
                disabled={busy || resetFee === ''}
                className="px-4 py-2 rounded-md border border-[var(--warning)]/40 text-[var(--warning)] text-sm font-medium hover:bg-[var(--warning)]/10 transition-colors disabled:opacity-40"
              >
                Reset
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5">
              Recording a reset adds the fee to total costs and restarts the challenge (phase 1, P&L cleared).
            </p>
          </div>

          {error && (
            <p className="text-xs text-[var(--loss)] bg-[var(--loss)]/10 border border-[var(--loss)]/20 rounded-md px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all',
              saved ? 'bg-[var(--profit)] text-black' : 'bg-[var(--primary)] text-black hover:opacity-90',
              busy && 'opacity-60',
            )}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? '✓ Saved' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}
