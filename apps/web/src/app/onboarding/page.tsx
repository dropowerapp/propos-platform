'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, ArrowRight, ArrowLeft, Check, Upload,
  CheckCircle2, Loader2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

// ─── Onboarding wizard ─────────────────────────────────────────────────────────
// Goal: populated dashboard in under 3 minutes.
// 1. Pick firms → 2. Account details per firm → 3. Import trades (skippable)

const FIRM_OPTIONS = [
  { id: 'ftmo',        name: 'FTMO',                color: '#00c4cc', sizes: [10000, 25000, 50000, 100000, 200000], defaultCost: 540 },
  { id: 'fundingpips', name: 'FundingPips',         color: '#6c47ff', sizes: [5000, 10000, 25000, 50000, 100000, 200000], defaultCost: 250 },
  { id: 'the5ers',     name: 'The5ers',             color: '#00b4d8', sizes: [5000, 20000, 60000, 100000], defaultCost: 260 },
  { id: 'e8',          name: 'E8 Markets',          color: '#f59e0b', sizes: [25000, 50000, 100000, 250000], defaultCost: 338 },
  { id: 'apex',        name: 'Apex Trader Funding', color: '#f97316', sizes: [25000, 50000, 100000, 250000], defaultCost: 167 },
  { id: 'topstep',     name: 'Topstep',             color: '#10b981', sizes: [50000, 100000, 150000], defaultCost: 165 },
  { id: 'alpha',       name: 'Alpha Capital',       color: '#ef4444', sizes: [10000, 25000, 50000, 100000], defaultCost: 297 },
  { id: 'fundednext',  name: 'FundedNext',          color: '#8b5cf6', sizes: [6000, 15000, 25000, 50000, 100000, 200000], defaultCost: 299 },
];

interface AccountDraft {
  firmId: string;
  accountSize: number;
  phase: number;        // 1 | 2 | 3 (3 = funded)
  challengeCost: number;
}

const PHASES = [
  { value: 1, label: 'Phase 1' },
  { value: 2, label: 'Phase 2' },
  { value: 3, label: 'Funded' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedFirms, setSelectedFirms] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AccountDraft>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function toggleFirm(id: string) {
    setSelectedFirms(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      // Initialize draft when selecting
      if (!prev.includes(id)) {
        const firm = FIRM_OPTIONS.find(f => f.id === id)!;
        setDrafts(d => ({
          ...d,
          [id]: d[id] ?? {
            firmId: id,
            accountSize: firm.sizes[Math.min(3, firm.sizes.length - 1)],
            phase: 1,
            challengeCost: firm.defaultCost,
          },
        }));
      }
      return next;
    });
  }

  function updateDraft(id: string, patch: Partial<AccountDraft>) {
    setDrafts(d => ({ ...d, [id]: { ...d[id], ...patch } }));
  }

  async function finish(goToImport: boolean) {
    setSaving(true);

    // Try creating accounts via API; tolerate API being offline
    for (const firmKey of selectedFirms) {
      const draft = drafts[firmKey];
      const firm = FIRM_OPTIONS.find(f => f.id === firmKey)!;
      try {
        await api.accounts.create({
          firmName: firm.name,           // backend resolves/creates the PropFirm by name
          accountSize: draft.accountSize,
          challengeCost: draft.challengeCost || undefined,
          phase: draft.phase === 3 ? 1 : draft.phase,
          status: draft.phase === 3 ? 'funded' : 'active',
        });
      } catch {
        // API offline — continue; user can re-add from Accounts page
      }
    }

    try { localStorage.setItem('propos_onboarded', '1'); } catch {}
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      router.push(goToImport ? '/trades' : '/overview');
    }, 1200);
  }

  const canContinue = step === 1 ? selectedFirms.length > 0 : true;

  return (
    <div className="min-h-screen bg-[#080b12] flex flex-col items-center px-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1a5f6a] shadow-lg shadow-[#1a5f6a]/40">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Prop<span className="text-[#3da5b4]">OS</span>
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              step > s ? 'bg-[#1a5f6a] text-white'
                : step === s ? 'bg-[#1a5f6a]/20 border-2 border-[#1a5f6a] text-[#3da5b4]'
                : 'bg-white/5 border border-white/10 text-[#6b7f8c]',
            )}>
              {step > s ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 3 && <div className={cn('w-12 h-0.5 rounded', step > s ? 'bg-[#1a5f6a]' : 'bg-white/10')} />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl">

        {/* ── Step 1: Pick firms ── */}
        {step === 1 && !done && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Which prop firms do you trade with?</h1>
              <p className="text-sm text-[#6b7f8c] mt-2">Select all that apply — you can add more later.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FIRM_OPTIONS.map(firm => {
                const selected = selectedFirms.includes(firm.id);
                return (
                  <button
                    key={firm.id}
                    onClick={() => toggleFirm(firm.id)}
                    className={cn(
                      'flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all',
                      selected
                        ? 'border-[#1a5f6a] bg-[#1a5f6a]/10 ring-1 ring-[#1a5f6a]/40'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/5',
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ background: firm.color }}
                    >
                      {firm.name[0]}
                    </div>
                    <p className={cn('text-xs font-medium text-center leading-tight', selected ? 'text-white' : 'text-[#9ca3af]')}>
                      {firm.name}
                    </p>
                    {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#3da5b4]" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/firms')}
                className="text-sm text-[#6b7f8c] hover:text-white transition-colors"
              >
                I don't have a prop firm yet →
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canContinue}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1a5f6a] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Account details ── */}
        {step === 2 && !done && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Set up your accounts</h1>
              <p className="text-sm text-[#6b7f8c] mt-2">Three quick fields per account — defaults are pre-filled.</p>
            </div>

            <div className="space-y-3">
              {selectedFirms.map(firmKey => {
                const firm = FIRM_OPTIONS.find(f => f.id === firmKey)!;
                const draft = drafts[firmKey];
                if (!draft) return null;
                return (
                  <div key={firmKey} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: firm.color }}
                      >
                        {firm.name[0]}
                      </div>
                      <p className="text-sm font-semibold text-white">{firm.name}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-[#6b7f8c] block mb-1.5">Account Size</label>
                        <select
                          value={draft.accountSize}
                          onChange={e => updateDraft(firmKey, { accountSize: Number(e.target.value) })}
                          className="w-full bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1a5f6a]"
                        >
                          {firm.sizes.map(s => (
                            <option key={s} value={s}>${(s / 1000).toFixed(0)}k</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6b7f8c] block mb-1.5">Current Stage</label>
                        <select
                          value={draft.phase}
                          onChange={e => updateDraft(firmKey, { phase: Number(e.target.value) })}
                          className="w-full bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1a5f6a]"
                        >
                          {PHASES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6b7f8c] block mb-1.5">Challenge Cost ($)</label>
                        <input
                          type="number"
                          value={draft.challengeCost}
                          onChange={e => updateDraft(firmKey, { challengeCost: Number(e.target.value) })}
                          className="w-full bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1a5f6a]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-[#6b7f8c] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1a5f6a] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Import trades ── */}
        {step === 3 && !done && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Import your trading history</h1>
              <p className="text-sm text-[#6b7f8c] mt-2">
                Your analytics, AI coach and firm recommendations are built from your real trades.
              </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1a5f6a]/15 border border-[#1a5f6a]/30 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-[#3da5b4]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">MT4 · MT5 · cTrader · NinjaTrader · Tradovate · Rithmic</p>
                <p className="text-xs text-[#6b7f8c] mt-1">
                  Export a statement from your platform and we'll parse it automatically — with step-by-step instructions for each platform.
                </p>
              </div>
              <button
                onClick={() => finish(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1a5f6a] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import trades now
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-sm text-[#6b7f8c] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => finish(false)}
                disabled={saving}
                className="flex items-center gap-2 text-sm text-[#6b7f8c] hover:text-white transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Skip for now →
              </button>
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {done && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1a5f6a]/15 border border-[#1a5f6a]/40 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-[#3da5b4]" />
            </div>
            <h1 className="text-2xl font-bold text-white">You're all set</h1>
            <p className="text-sm text-[#6b7f8c]">Taking you to your dashboard…</p>
          </div>
        )}

      </div>
    </div>
  );
}
