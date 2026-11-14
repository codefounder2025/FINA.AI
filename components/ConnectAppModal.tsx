'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePortfolio } from '@/components/PortfolioProvider';
import {
  getSandboxAppsFor,
  type LedgerSourceId,
  type SandboxApp,
} from '@/lib/connectors/sandboxLedgerAdapter';

/**
 * Simulated app connection for the spending sources: choose an app -> consent
 * -> connected.
 *
 * There is no network call anywhere in this flow. The consent copy says so
 * explicitly, and the resulting source is labelled "Connected (Sandbox)".
 */

const COPY: Record<
  LedgerSourceId,
  { heading: string; legend: string; consent: string; read: string }
> = {
  bank: {
    heading: 'Connect a bank app (Sandbox)',
    legend: 'Choose a bank app',
    consent:
      'FINA.AI will read your account transactions. This is a sandbox — no real credentials are used.',
    read: 'Account transactions',
  },
  octopus: {
    heading: 'Connect the Octopus app (Sandbox)',
    legend: 'Choose an Octopus app',
    consent:
      'FINA.AI will read your Octopus travel and spending history. This is a sandbox — no real credentials are used.',
    read: 'Card transactions',
  },
};

interface ConnectAppModalProps {
  source: LedgerSourceId;
  open: boolean;
  onClose: () => void;
}

export default function ConnectAppModal({ source, open, onClose }: ConnectAppModalProps) {
  const { connectLedger, clearLedger, ledgers } = usePortfolio();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<SandboxApp | null>(null);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);

  const headingId = useId();
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const apps = getSandboxAppsFor(source);
  const copy = COPY[source];

  // Fresh state every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelected(null);
    setConnectedAt(null);
  }, [open, source]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Keep focus inside the dialog as it advances between steps.
  useEffect(() => {
    if (!open) return;
    if (step === 1) firstRadioRef.current?.focus();
    else if (step === 2) confirmRef.current?.focus();
  }, [open, step]);

  if (!open) return null;

  const selectedOption = apps.find((option) => option.id === selected);

  const approve = () => {
    if (!selected) return;
    connectLedger(source, selected);
    setConnectedAt(new Date().toISOString());
    setStep(3);
  };

  const disconnect = () => {
    clearLedger(source);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 py-10 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={headingId} className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {copy.heading}
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Step {step} of 3 · simulated — no network call is made at any point.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${source} connection dialog`}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Step 1 — choose */}
        {step === 1 && (
          <fieldset className="mt-5">
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {copy.legend}
            </legend>
            <div className="mt-2 space-y-2">
              {apps.map((option, index) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:border-slate-800 dark:hover:bg-slate-800 dark:has-[:checked]:border-indigo-500 dark:has-[:checked]:bg-indigo-950"
                >
                  <input
                    ref={index === 0 ? firstRadioRef : undefined}
                    type="radio"
                    name={`sandbox-app-${source}`}
                    value={option.id}
                    checked={selected === option.id}
                    onChange={() => setSelected(option.id)}
                    className="mt-0.5 h-4 w-4 accent-indigo-600"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                      {option.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {option.realPath}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Step 2 — consent */}
        {step === 2 && (
          <div className="mt-5">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {copy.consent}
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">App</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">
                  {selectedOption?.name}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Data read</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">{copy.read}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Credentials used</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">None</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Step 3 — connected */}
        {step === 3 && (
          <div className="mt-5" role="status">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              Connected (Sandbox). {selectedOption?.name} is simulated — the ledger shown is
              generated locally, not fetched.
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">
                  Connected (Sandbox)
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Connected at</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">
                  {connectedAt
                    ? new Date(connectedAt).toLocaleString('en-HK', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Asia/Hong_Kong',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={disconnect}
              className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Disconnect
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selected}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:text-slate-950 dark:hover:bg-indigo-400"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={approve}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-indigo-500 dark:text-slate-950 dark:hover:bg-indigo-400"
              >
                I understand — connect sandbox
              </button>
            </>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-indigo-500 dark:text-slate-950 dark:hover:bg-indigo-400"
            >
              Done
            </button>
          )}
        </div>

        {/* Connection state is owned by the provider, so a stale modal cannot
            claim to be connected when it is not. */}
        {ledgers[source] === null && step === 3 && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            The sandbox connection has been closed.
          </p>
        )}
      </div>
    </div>
  );
}
