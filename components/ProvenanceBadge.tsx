import { formatDate } from '@/lib/format';

/**
 * Provenance badge.
 *
 * Every figure in the app is traceable to a named source of data. This badge
 * states which, and never claims a live connection:
 *   mock    — the built-in mock adapter
 *   csv     — a portfolio the user imported from a broker CSV
 *   sandbox — a simulated connection flow
 */

export type Provenance = 'mock' | 'csv' | 'sandbox';

const STYLES: Record<Provenance, string> = {
  mock: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  csv: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800',
  sandbox:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
};

const LABELS: Record<Provenance, string> = {
  mock: 'Mock',
  csv: 'CSV',
  sandbox: 'Sandbox',
};

interface ProvenanceBadgeProps {
  kind: Provenance;
  /** ISO date shown after the label for CSV imports. */
  date?: string;
  className?: string;
}

export default function ProvenanceBadge({ kind, date, className = '' }: ProvenanceBadgeProps) {
  const text = kind === 'csv' && date ? `CSV · ${formatDate(date.slice(0, 10))}` : LABELS[kind];

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${STYLES[kind]} ${className}`}
      title={
        kind === 'mock'
          ? 'Sourced from the built-in mock adapter'
          : kind === 'csv'
            ? 'Sourced from a broker CSV you imported in this session'
            : 'Sourced from a simulated sandbox connection'
      }
    >
      {text}
    </span>
  );
}
