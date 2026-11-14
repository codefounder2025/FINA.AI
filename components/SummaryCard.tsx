interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'blue' | 'orange' | 'green' | 'slate';
  delta?: number | null;
  /** Provenance or status marker rendered beside the label. */
  badge?: React.ReactNode;
}

const ACCENTS: Record<NonNullable<SummaryCardProps['accent']>, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  orange: 'text-orange-600 dark:text-orange-400',
  green: 'text-green-600 dark:text-green-400',
  slate: 'text-slate-900 dark:text-slate-100',
};

export default function SummaryCard({
  label,
  value,
  hint,
  accent = 'slate',
  delta = null,
  badge,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          {badge}
        </span>
        {delta !== null && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              delta > 0
                ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
                : 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta.toFixed(0)}%
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-semibold tabular-nums sm:text-3xl ${ACCENTS[accent]}`}>
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
