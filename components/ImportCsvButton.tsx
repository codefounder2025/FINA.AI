'use client';

import { useState } from 'react';
import ImportCsvModal from '@/components/ImportCsvModal';
import { usePortfolio } from '@/components/PortfolioProvider';

/**
 * Trigger + dialog for the broker CSV import. Kept in one component so the
 * dashboard and the Connections page share exactly one implementation.
 */
export default function ImportCsvButton({ className = '' }: { className?: string }) {
  const { importRows } = usePortfolio();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${className}`}
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
        Import Broker CSV
      </button>

      <ImportCsvModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(rows, fileName) => importRows(rows, fileName)}
      />
    </>
  );
}
