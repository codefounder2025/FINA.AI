'use client';

import { useState } from 'react';
import ConnectAppModal from '@/components/ConnectAppModal';
import { usePortfolio } from '@/components/PortfolioProvider';
import type { LedgerSourceId } from '@/lib/connectors/sandboxLedgerAdapter';

/**
 * Connect / disconnect control for a simulated app connection on one spending
 * source, plus the "Connected (Sandbox)" status once it is open. Never claims
 * to be live.
 */
export default function ConnectAppPanel({ source }: { source: LedgerSourceId }) {
  const { ledgers, clearLedger } = usePortfolio();
  const [open, setOpen] = useState(false);

  const ledger = ledgers[source];
  const label = source === 'bank' ? 'Connect Bank App (Sandbox)' : 'Connect Octopus App (Sandbox)';

  return (
    <div>
      {ledger?.kind === 'sandbox' ? (
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected (Sandbox)
            </span>
            <span className="font-normal text-slate-600 dark:text-slate-400">{ledger.label}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Simulated since{' '}
            {new Date(ledger.at).toLocaleString('en-HK', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Hong_Kong',
            })}
            .
          </p>
          <button
            type="button"
            onClick={() => clearLedger(source)}
            className="mt-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg
              aria-hidden
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" />
            </svg>
            {label}
          </button>

          {ledger?.kind === 'statement' && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Currently using the statement you imported ({ledger.label}). Connecting an app
              replaces it.
            </p>
          )}
        </>
      )}

      <ConnectAppModal source={source} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
