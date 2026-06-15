'use client';

import { useState } from 'react';
import { X, Loader2, DollarSign, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { useCreatePayout } from '@/lib/hooks/use-payouts';

interface RecordPayoutModalProps {
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'crypto', label: 'Crypto (USDT/BTC)', icon: '₿' },
  { id: 'wise', label: 'Wise', icon: '💳' },
  { id: 'paypal', label: 'PayPal', icon: '🅿' },
  { id: 'other', label: 'Other', icon: '💸' },
];

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending', desc: 'Requested, awaiting payment' },
  { id: 'paid', label: 'Paid', desc: 'Already received' },
];

export function RecordPayoutModal({ onClose }: RecordPayoutModalProps) {
  const { data: accountsData } = useAccounts();
  const createPayout = useCreatePayout();

  const accounts: any[] = accountsData?.accounts ?? accountsData ?? [];

  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [grossProfit, setGrossProfit] = useState('');
  const [profitSplitPct, setProfitSplitPct] = useState('80');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [requestedAt, setRequestedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Auto-calculate amount from gross profit × split pct
  function handleGrossProfitChange(val: string) {
    setGrossProfit(val);
    const gp = parseFloat(val);
    const split = parseFloat(profitSplitPct);
    if (!isNaN(gp) && !isNaN(split)) {
      setAmount(((gp * split) / 100).toFixed(2));
    }
  }

  function handleSplitChange(val: string) {
    setProfitSplitPct(val);
    const gp = parseFloat(grossProfit);
    const split = parseFloat(val);
    if (!isNaN(gp) && !isNaN(split)) {
      setAmount(((gp * split) / 100).toFixed(2));
    }
  }

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid payout amount.');
      return;
    }
    setError('');
    try {
      await createPayout.mutateAsync({
        propFirmAccountId: accountId || undefined,
        amount: parseFloat(amount),
        grossProfit: grossProfit ? parseFloat(grossProfit) : undefined,
        profitSplitPct: profitSplitPct ? parseFloat(profitSplitPct) : undefined,
        paymentMethod,
        status,
        requestedAt: new Date(requestedAt).toISOString(),
        notes: notes || undefined,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record payout. Make sure the API is running.');
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md mx-4 shadow-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 mx-auto text-[var(--profit)]" />
          <div>
            <p className="text-lg font-bold text-[var(--foreground)]">Payout Recorded!</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              ${parseFloat(amount).toLocaleString()} · {STATUS_OPTIONS.find(s => s.id === status)?.label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-base font-semibold text-[var(--foreground)]">Record Payout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Account selector */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
              Account <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            >
              <option value="">No specific account</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.propFirm?.name ?? 'Account'} ${(Number(a.accountSize ?? 0) / 1000).toFixed(0)}k
                  {a.accountName ? ` — ${a.accountName}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Gross profit + split → auto-calc amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
                Gross Profit ($) <span className="font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={grossProfit}
                onChange={e => handleGrossProfitChange(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
                Profit Split (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={profitSplitPct}
                onChange={e => handleSplitChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>

          {/* Payout amount (required) */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
              Payout Amount ($) <span className="text-[var(--loss)]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] font-semibold"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                    paymentMethod === m.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                  )}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id as 'pending' | 'paid')}
                  className={cn(
                    'px-3 py-2.5 rounded-lg border text-left transition-colors',
                    status === s.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] hover:border-[var(--muted-foreground)]',
                  )}
                >
                  <p className={cn('text-sm font-semibold', status === s.id ? 'text-[var(--primary)]' : 'text-[var(--foreground)]')}>
                    {s.label}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Request Date</label>
            <input
              type="date"
              value={requestedAt}
              onChange={e => setRequestedAt(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
              Notes <span className="font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. First payout from FTMO funded account"
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none"
            />
          </div>

          {/* Summary preview */}
          {parseFloat(amount) > 0 && (
            <div className="p-3 rounded-lg bg-[var(--profit)]/5 border border-[var(--profit)]/20 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Payout amount</span>
                <span className="font-bold text-[var(--profit)]">${parseFloat(amount).toLocaleString()}</span>
              </div>
              {grossProfit && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Gross profit</span>
                  <span className="text-[var(--foreground)]">${parseFloat(grossProfit).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Split</span>
                <span className="text-[var(--foreground)]">{profitSplitPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Method</span>
                <span className="text-[var(--foreground)]">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-[var(--loss)] bg-[var(--loss)]/10 border border-[var(--loss)]/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] sticky bottom-0 bg-[var(--card)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || createPayout.isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {createPayout.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Record Payout
          </button>
        </div>
      </div>
    </div>
  );
}
