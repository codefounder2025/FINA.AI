'use client';

import { useState } from 'react';
import StatementUploadModal from '@/components/StatementUploadModal';
import { usePortfolio } from '@/components/PortfolioProvider';
import type { LedgerSourceId } from '@/lib/connectors/sandboxLedgerAdapter';

/**
 * Trigger + dialog for the PDF statement import, plus the "clear import"
 * affordance once a statement is loaded. Kept in one component so the
 * Connections page has a single implementation per source.
 */
export default function StatementUploadButton({ source }: { source: LedgerSourceId }) {
  const { importStatement, ledgers, clearLedger } = usePortfolio();
  const [open, setOpen] = useState(false);

  const ledger = ledgers[source];
  const noun = source === 'bank' ? 'Bank' : 'Octopus';

  return (
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
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M12 3v12M7 8l5-5 5 5" />
        </svg>
        Upload {noun} Statement (PDF)
      </button>

      {ledger?.kind === 'statement' && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <span className="truncate font-medium text-slate-700 dark:text-slate-300">{ledger.label}</span>
          <span>
            imported{' '}
            {new Date(ledger.at).toLocaleString('en-HK', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Hong_Kong',
            })}
          </span>
          <button
            type="button"
            onClick={() => clearLedger(source)}
            className="rounded-md px-1.5 py-0.5 font-medium text-indigo-700 underline underline-offset-2 transition hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            Clear import
          </button>
        </p>
      )}

      <StatementUploadModal
        source={source}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(rows, fileName) => importStatement(source, rows, fileName)}
      />
    </>
  );
}
