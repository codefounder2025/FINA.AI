import { formatDate } from '@/lib/format';

/**
 * Provenance badge.
 *
 * Every figure in the app is traceable to a named source of data. This badge
 * states which, and never claims a live connection:
 *   mock      — the built-in mock adapter
 *   csv       — a portfolio the user imported from a broker CSV
 *   sandbox   — a simulated connection flow
 *   statement — a PDF statement the user imported
 *   manual    — transactions the user typed in by hand
 *   mixed     — a figure derived from more than one of the above
 */

export type Provenance = 'mock' | 'csv' | 'sandbox' | 'statement' | 'manual' | 'mixed';

const STYLES: Record<Provenance, string> = {
  mock: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  csv: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800',
  sandbox:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  statement:
    'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800',
  manual:
    'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800',
  mixed: 'bg-slate-50 text-slate-600 ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
};

const LABELS: Record<Provenance, string> = {
  mock: 'Mock',
  csv: 'CSV',
  sandbox: 'Sandbox',
  statement: 'Statement',
  manual: 'Manual entry',
  mixed: 'Mixed',
};

const TITLES: Record<Provenance, string> = {
  mock: 'Sourced from the built-in mock adapter',
  csv: 'Sourced from a broker CSV you imported in this session',
  sandbox: 'Sourced from a simulated sandbox connection',
  statement: 'Sourced from a PDF statement you imported in this session',
  manual: 'Includes transactions you added by hand in this session',
  mixed: 'Derived from more than one source — see each card for details',
};

/** Provenance labels that carry an import/connection timestamp. */
const DATED: Provenance[] = ['csv', 'statement'];

/**
 * Reduces a per-source provenance list to the single label a combined figure
 * can honestly claim. Anything other than "all the same" is "mixed".
 */
export function combineProvenance(parts: Provenance[]): Provenance {
  if (parts.length === 0) return 'mock';
  const unique = new Set(parts);
  return unique.size === 1 ? [...unique][0] : 'mixed';
}

interface ProvenanceBadgeProps {
  kind: Provenance;
  /** ISO timestamp shown after the label for dated imports. */
  date?: string;
  className?: string;
}

export default function ProvenanceBadge({ kind, date, className = '' }: ProvenanceBadgeProps) {
  const text =
    date && DATED.includes(kind)
      ? `${LABELS[kind]} · ${formatDate(date.slice(0, 10))}`
      : LABELS[kind];

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${STYLES[kind]} ${className}`}
      title={TITLES[kind]}
    >
      {text}
    </span>
  );
}
