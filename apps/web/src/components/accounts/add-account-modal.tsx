'use client';

import { useState } from 'react';
import { X, Building2, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropFirms } from '@/lib/hooks/use-prop-firms';
import { useCreateAccount } from '@/lib/hooks/use-accounts';

interface AddAccountModalProps {
  onClose: () => void;
}

// Fallback firms for when API is unavailable
const FALLBACK_FIRMS = [
  { id: 'ftmo', name: 'FTMO', challengeTypes: [{ id: 'ftmo-2step', name: '2-Step Evaluation', accountSizes: [{ accountSize: 10000, price: 155 }, { accountSize: 25000, price: 250 }, { accountSize: 50000, price: 345 }, { accountSize: 100000, price: 540 }, { accountSize: 200000, price: 1080 }] }] },
  { id: 'fundingpips', name: 'FundingPips', challengeTypes: [{ id: 'fp-1step', name: '1-Step Challenge', accountSizes: [{ accountSize: 5000, price: 49 }, { accountSize: 10000, price: 89 }, { accountSize: 25000, price: 189 }, { accountSize: 50000, price: 299 }, { accountSize: 100000, price: 549 }, { accountSize: 200000, price: 1099 }] }] },
  { id: 'the5ers', name: 'The5ers', challengeTypes: [{ id: '5ers-high', name: 'High Stakes', accountSizes: [{ accountSize: 10000, price: 97 }, { accountSize: 20000, price: 177 }, { accountSize: 40000, price: 297 }, { accountSize: 100000, price: 475 }] }] },
  { id: 'e8markets', name: 'E8 Markets', challengeTypes: [{ id: 'e8-eval', name: 'E8 Evaluation', accountSizes: [{ accountSize: 25000, price: 138 }, { accountSize: 50000, price: 228 }, { accountSize: 100000, price: 388 }, { accountSize: 250000, price: 588 }] }] },
];

export function AddAccountModal({ onClose }: AddAccountModalProps) {
  const { data: firmsData } = usePropFirms();
  const createAccount = useCreateAccount();

  const _firmsRaw = firmsData?.data ?? firmsData?.firms ?? firmsData ?? [];
  const _firms = Array.isArray(_firmsRaw) ? _firmsRaw : [];
  const firms = _firms.length > 0 ? _firms : FALLBACK_FIRMS;

  const [selectedFirmId, setSelectedFirmId] = useState('');
  const [selectedChallengeTypeId, setSelectedChallengeTypeId] = useState('');
  const [selectedSize, setSelectedSize] = useState<number>(0);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#1a5f6a');
  const [step, setStep] = useState<'firm' | 'details'>('firm');
  const [error, setError] = useState('');
  // The fee a trader actually paid — prefilled from list price, but editable
  // (prop firms run frequent discounts, so the real cost is rarely list price).
  const [customPrice, setCustomPrice] = useState<number | ''>('');

  const selectedFirm = firms.find((f: any) => f.id === selectedFirmId);
  const challengeTypes = selectedFirm?.challengeTypes ?? [];
  const selectedChallengeType = challengeTypes.find((ct: any) => ct.id === selectedChallengeTypeId);
  const accountSizes = selectedChallengeType?.accountSizes ?? [];
  const selectedSizeObj = accountSizes.find((s: any) => Number(s.accountSize) === selectedSize);
  const listPrice = Number(selectedSizeObj?.price ?? 0);
  const price = customPrice === '' ? listPrice : Number(customPrice);

  const COLORS = ['#1a5f6a', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

  function handleFirmSelect(firmId: string) {
    setSelectedFirmId(firmId);
    setSelectedChallengeTypeId('');
    setSelectedSize(0);
    const firm = firms.find((f: any) => f.id === firmId);
    const firstCt = firm?.challengeTypes?.[0];
    if (firstCt) {
      setSelectedChallengeTypeId(firstCt.id);
      const firstSize = Number(firstCt.accountSizes?.[0]?.accountSize ?? 0);
      setSelectedSize(firstSize);
    }
  }

  async function handleSubmit() {
    if (!selectedFirmId) { setError('Please select a prop firm.'); return; }
    if (!selectedSize) { setError('Please select an account size.'); return; }

    setError('');
    try {
      await createAccount.mutateAsync({
        propFirmId: selectedFirmId,
        challengeTypeId: selectedChallengeTypeId || undefined,
        accountSize: selectedSize,
        challengeCost: price || undefined,
        accountName: accountName || undefined,
        accountNumber: accountNumber || undefined,
        color,
        phase: 1,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create account. Make sure the API is running.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Add Prop Firm Account</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Firm selection */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Prop Firm</label>
            <div className="grid grid-cols-2 gap-2">
              {firms.slice(0, 8).map((f: any) => (
                <button
                  key={f.id}
                  onClick={() => handleFirmSelect(f.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-colors text-sm',
                    selectedFirmId === f.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--muted-foreground)]',
                  )}
                >
                  <div className="w-7 h-7 rounded bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center text-xs font-bold shrink-0">
                    {f.name.slice(0, 2)}
                  </div>
                  <span className="font-medium truncate">{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Challenge Type */}
          {selectedFirmId && challengeTypes.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Challenge Type</label>
              <div className="flex flex-wrap gap-2">
                {challengeTypes.map((ct: any) => (
                  <button
                    key={ct.id}
                    onClick={() => {
                      setSelectedChallengeTypeId(ct.id);
                      setSelectedSize(Number(ct.accountSizes?.[0]?.accountSize ?? 0));
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                      selectedChallengeTypeId === ct.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                    )}
                  >
                    {ct.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Size */}
          {selectedChallengeTypeId && accountSizes.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Account Size</label>
              <div className="flex flex-wrap gap-2">
                {accountSizes.map((s: any) => {
                  const size = Number(s.accountSize);
                  const p = s.price;
                  return (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setCustomPrice(''); }}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-center',
                        selectedSize === size
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--muted-foreground)]',
                      )}
                    >
                      <div className="font-bold">${(size / 1000).toFixed(0)}k</div>
                      {p > 0 && <div className="text-[var(--muted-foreground)] text-[10px]">${p}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details row */}
          {selectedSize > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Account Name (optional)</label>
                <input
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder={`${selectedFirm?.name ?? 'Account'} ${(selectedSize / 1000).toFixed(0)}k`}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">Account # (optional)</label>
                <input
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="MT4/5 login number"
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </div>
            </div>
          )}

          {/* Fee paid — editable (defaults to list price, override for discounts) */}
          {selectedSize > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
                Fee paid ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice === '' ? listPrice : customPrice}
                  onChange={e => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] tabular-nums"
                />
              </div>
              {listPrice > 0 && price !== listPrice && (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                  List price ${listPrice.toLocaleString()}
                  {price < listPrice && (
                    <span className="text-[var(--profit)]"> · {Math.round((1 - price / listPrice) * 100)}% discount applied</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Colour picker */}
          {selectedSize > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">Colour tag</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn('w-6 h-6 rounded-full border-2 transition-transform hover:scale-110', color === c ? 'border-white scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedFirm && selectedSize > 0 && (
            <div className="p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Firm</span>
                <span className="font-medium text-[var(--foreground)]">{selectedFirm.name}</span>
              </div>
              {selectedChallengeType && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Type</span>
                  <span className="font-medium text-[var(--foreground)]">{selectedChallengeType.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Account Size</span>
                <span className="font-medium text-[var(--foreground)]">${selectedSize.toLocaleString()}</span>
              </div>
              {price > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Fee paid</span>
                  <span className="font-bold text-[var(--foreground)]">${price.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-[var(--loss)] bg-[var(--loss)]/10 border border-[var(--loss)]/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFirmId || !selectedSize || createAccount.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {createAccount.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Account
          </button>
        </div>
      </div>
    </div>
  );
}
