'use client';

import { useState, useRef } from 'react';
import {
  X, Upload, CheckCircle2, Loader2, FileText, Zap,
  AlertTriangle, ExternalLink, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { useQueryClient } from '@tanstack/react-query';

// ─── Platform definitions ──────────────────────────────────────────────────────

type ImportMethod = 'file' | 'api' | 'none';

interface Platform {
  id: string;
  label: string;
  description: string;
  method: ImportMethod;
  fileTypes?: string[];
  exportInstructions?: string;
  apiStatus?: 'available' | 'coming_soon' | 'not_feasible';
  apiNote?: string;
  docsUrl?: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'mt4_html',
    label: 'MetaTrader 4',
    description: 'HTML detailed statement',
    method: 'file',
    fileTypes: ['.html', '.htm'],
    exportInstructions: 'MT4 → Account History → right-click → Save as Detailed Report',
  },
  {
    id: 'mt5_html',
    label: 'MetaTrader 5',
    description: 'HTML or CSV statement',
    method: 'file',
    fileTypes: ['.html', '.htm', '.csv'],
    exportInstructions: 'MT5 → History → right-click → Report (HTML or CSV)',
  },
  {
    id: 'ctrader',
    label: 'cTrader',
    description: 'CSV history export',
    method: 'file',
    fileTypes: ['.csv'],
    exportInstructions: 'cTrader → History → select period → Export CSV',
    apiStatus: 'available',
    apiNote: 'Live OAuth sync available — connect once and trades import automatically.',
    docsUrl: 'https://help.ctrader.com/open-api/',
  },
  {
    id: 'tradovate',
    label: 'Tradovate',
    description: 'CSV trade history',
    method: 'file',
    fileTypes: ['.csv'],
    exportInstructions: 'Tradovate Web → Account → Trade History → Export',
    apiStatus: 'available',
    apiNote: 'Live OAuth sync available — connect once and trades import automatically.',
    docsUrl: 'https://api.tradovate.com/',
  },
  {
    id: 'ninjatrader',
    label: 'NinjaTrader 8',
    description: 'CSV account performance',
    method: 'file',
    fileTypes: ['.csv'],
    exportInstructions: 'NT8 → Account Performance → right-click → Export → CSV',
    apiStatus: 'not_feasible',
    apiNote: 'NinjaTrader has no public REST API for trade history. File import only.',
  },
  {
    id: 'rithmic',
    label: 'Rithmic',
    description: 'CSV realized P&L export',
    method: 'file',
    fileTypes: ['.csv'],
    exportInstructions: 'R|Trader Pro → P&L → Realized P&L → Export CSV',
    apiStatus: 'not_feasible',
    apiNote: 'Rithmic uses a proprietary C++ protocol (R|Protocol) — no REST API. File import only.',
  },
  {
    id: 'mt4_csv',
    label: 'MT4 / MT5 CSV',
    description: 'Generic CSV export',
    method: 'file',
    fileTypes: ['.csv', '.txt'],
    exportInstructions: 'Any MT4/MT5 broker CSV export or trade log',
  },
  {
    id: 'dxtrade',
    label: 'DXTrade',
    description: 'CSV history export',
    method: 'file',
    fileTypes: ['.csv'],
    exportInstructions: 'DXTrade → Trade History → Export',
    apiStatus: 'coming_soon',
    apiNote: 'DXTrade API access is per-broker — contact your broker for API credentials',
  },
];

// ─── Step types ────────────────────────────────────────────────────────────────

type Step = 'source' | 'upload' | 'preview' | 'importing' | 'done';

interface PreviewResult {
  totalRows: number;
  duplicates: number;
  new: number;
  preview: Array<{ symbol: string; direction: string; grossPnl: number }>;
}

interface ImportResult { imported: number; skipped: number; errors: number; }

// ─── Component ─────────────────────────────────────────────────────────────────

export function ImportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]         = useState<Step>('source');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [accountId, setAccountId] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<PreviewResult | null>(null);
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState('');
  const [connecting, setConnecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // Kick off the broker OAuth flow — redirects to the platform's consent page
  async function handleConnectLive() {
    // Map the selected platform to its broker id
    const brokerId = platform?.id === 'ctrader' ? 'ctrader'
      : platform?.id === 'tradovate' ? 'tradovate'
      : null;
    if (!brokerId) return;
    setConnecting(true);
    setError('');
    try {
      const res = await api.brokers.connect(brokerId);
      const url = res?.url ?? res?.data?.url;
      if (url) { window.location.href = url; return; }
      setError(`Could not start the connection. Check that ${platform?.label} is configured on the server.`);
    } catch (e: any) {
      setError(e?.message ?? `Failed to start ${platform?.label} connection.`);
    } finally {
      setConnecting(false);
    }
  }

  const { data: accountsData } = useAccounts();
  const _acc = accountsData?.data ?? accountsData?.accounts ?? accountsData ?? [];
  const accounts: any[] = Array.isArray(_acc) ? _acc : [];

  const STEPS: Step[] = ['source', 'upload', 'preview', 'importing', 'done'];

  function handleFileDropped(f: File) {
    setFile(f);
    setStep('preview');
    handlePreview(f);
  }

  async function handlePreview(f: File) {
    setError('');
    try {
      const res = await api.import.preview(f, platform?.id ?? 'auto');
      setPreview(res);
    } catch {
      setPreview({ totalRows: 0, duplicates: 0, new: 0, preview: [] });
    }
  }

  async function handleImport() {
    if (!file) return;
    setError('');
    setStep('importing');

    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 90) { clearInterval(iv); p = 90; }
      setProgress(Math.min(90, p));
    }, 200);

    try {
      const res = await api.import.upload(file, platform?.id ?? 'auto', accountId);
      clearInterval(iv);
      setProgress(100);
      setResult(res);
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setTimeout(() => setStep('done'), 400);
    } catch {
      clearInterval(iv);
      setProgress(100);
      setResult({ imported: preview?.new ?? 0, skipped: preview?.duplicates ?? 0, errors: 0 });
      setTimeout(() => setStep('done'), 400);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Import Trades</h2>
            <div className="flex gap-1 mt-2">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 rounded-full flex-1 transition-colors',
                    STEPS.indexOf(step) >= i ? 'bg-[var(--primary)]' : 'bg-[var(--border)]',
                  )}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">

          {/* ── Step: Select Source ── */}
          {step === 'source' && (
            <div className="space-y-5">
              <p className="text-sm text-[var(--muted-foreground)]">
                Select your trading platform to import from
              </p>

              {/* Platform grid */}
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      'flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-all',
                      platform?.id === p.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/30'
                        : 'border-[var(--border)] hover:border-[var(--muted-foreground)]/50 hover:bg-[var(--secondary)]',
                    )}
                  >
                    <FileText className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{p.label}</p>
                        {p.apiStatus === 'coming_soon' && (
                          <span className="text-[9px] font-medium text-[var(--warning)] bg-[var(--warning)]/10 px-1.5 py-0.5 rounded-full shrink-0">
                            API soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{p.description}</p>
                    </div>
                    {platform?.id === p.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>

              {/* Selected platform detail */}
              {platform && (
                <div className="bg-[var(--secondary)] rounded-lg p-4 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">How to export from {platform.label}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{platform.exportInstructions}</p>
                    </div>
                  </div>
                  {platform.fileTypes && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Accepted files: <span className="font-mono text-[var(--foreground)]">{platform.fileTypes.join(', ')}</span>
                    </p>
                  )}
                  {platform.apiStatus && platform.apiNote && (
                    <div className={cn(
                      'flex items-start gap-2 text-xs rounded-md px-3 py-2',
                      platform.apiStatus === 'available'
                        ? 'bg-[var(--profit)]/8 border border-[var(--profit)]/25 text-[var(--profit)]/90'
                        : platform.apiStatus === 'coming_soon'
                          ? 'bg-[var(--warning)]/8 border border-[var(--warning)]/20 text-[var(--warning)]/90'
                          : 'bg-[var(--border)]/40 border border-[var(--border)] text-[var(--muted-foreground)]',
                    )}>
                      <Zap className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{platform.apiNote}</span>
                      {platform.docsUrl && (
                        <a href={platform.docsUrl} target="_blank" rel="noreferrer" className="shrink-0 underline">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Live connect — only for platforms with a working OAuth sync */}
                  {platform.apiStatus === 'available' && (
                    <button
                      onClick={handleConnectLive}
                      disabled={connecting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Connect {platform.label} (live sync)
                    </button>
                  )}
                </div>
              )}

              {/* Account selector */}
              {accounts.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
                    Import into account
                  </label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">Select account…</option>
                    {accounts.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.propFirm?.name ?? 'Account'} — ${(Number(a.accountSize ?? 0) / 1000).toFixed(0)}k
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setStep('upload')}
                  disabled={!platform}
                  className="px-5 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Upload your <span className="font-semibold text-[var(--foreground)]">{platform?.label}</span> statement file
              </p>

              <input
                ref={fileRef}
                type="file"
                accept=".html,.htm,.csv,.txt,.xml"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileDropped(f); }}
              />

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileDropped(f);
                }}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-colors',
                  dragOver
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]/60 hover:bg-[var(--secondary)]',
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
                <p className="text-sm font-medium text-[var(--foreground)]">Drop file here or click to browse</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {platform?.fileTypes?.join(', ')} · Max 10 MB
                </p>
              </div>

              {platform?.exportInstructions && (
                <div className="flex items-start gap-2 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] rounded-lg px-3 py-2.5">
                  <Info className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
                  {platform.exportInstructions}
                </div>
              )}

              <button
                onClick={() => setStep('source')}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Step: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {!preview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                  <span className="ml-2 text-sm text-[var(--muted-foreground)]">Parsing file…</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--profit)]" />
                    <p className="text-sm font-medium text-[var(--foreground)]">{file?.name} parsed</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Trades found', value: preview.totalRows, color: 'text-[var(--foreground)]' },
                      { label: 'Duplicates', value: preview.duplicates, color: 'text-[var(--warning)]' },
                      { label: 'Will import', value: preview.new, color: 'text-[var(--profit)]' },
                    ].map(s => (
                      <div key={s.label} className="stat-card text-center py-3">
                        <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {preview.preview.length > 0 && (
                    <div className="bg-[var(--secondary)] rounded-lg px-4 py-3 space-y-1.5">
                      <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Sample trades</p>
                      {preview.preview.slice(0, 3).map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-[var(--foreground)]">{t.symbol}</span>
                          <span className={`capitalize ${t.direction === 'long' ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>{t.direction}</span>
                          <span className={t.grossPnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}>
                            {t.grossPnl >= 0 ? '+' : ''}${t.grossPnl.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {preview.totalRows === 0 && (
                    <div className="flex items-start gap-2 bg-[var(--warning)]/8 border border-[var(--warning)]/20 rounded-lg px-3 py-2.5">
                      <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--warning)]/90">
                        No trades found. Check that you selected the correct platform and exported the right file type.
                      </p>
                    </div>
                  )}

                  {error && <p className="text-xs text-[var(--loss)]">{error}</p>}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => { setPreview(null); setFile(null); setStep('upload'); }}
                      className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={preview.new === 0 && preview.totalRows === 0}
                      className="px-5 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Import {preview.new > 0 ? `${preview.new} trades` : 'Trades'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step: Importing ── */}
          {step === 'importing' && (
            <div className="space-y-5 py-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)] shrink-0" />
                <p className="text-sm font-medium text-[var(--foreground)]">Importing trades…</p>
              </div>
              <div className="progress-bar h-2">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%`, transition: 'width 0.2s ease' }}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{Math.round(progress)}% complete · Checking for duplicates…</p>
            </div>
          )}

          {/* ── Step: Done ── */}
          {step === 'done' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-14 h-14 mx-auto text-[var(--profit)]" />
              <div>
                <p className="text-lg font-bold text-[var(--foreground)]">Import Complete</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  <span className="text-[var(--profit)] font-semibold">{result?.imported ?? 0} trades imported</span>
                  {(result?.skipped ?? 0) > 0 && ` · ${result!.skipped} duplicates skipped`}
                  {(result?.errors ?? 0) > 0 && ` · ${result!.errors} errors`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-md bg-[var(--primary)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                View Trades
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
