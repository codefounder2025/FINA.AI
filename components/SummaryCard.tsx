interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'blue' | 'orange' | 'green' | 'slate';
  delta?: number | null;
}

const ACCENTS: Record<NonNullable<SummaryCardProps['accent']>, string> = {
  blue: 'text-blue-600',
  orange: 'text-orange-600',
  green: 'text-green-600',
  slate: 'text-slate-900',
};

export default function SummaryCard({
  label,
  value,
  hint,
  accent = 'slate',
  delta = null,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {delta !== null && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              delta > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
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
      {hint && <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}
