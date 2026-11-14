import { SOURCE_COLORS, SOURCE_LABELS } from '@/lib/format';
import type { Source } from '@/lib/connectors/types';

const STYLES: Record<Source, string> = {
  bank: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800',
  octopus: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800',
  investment: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800',
};

export default function SourceBadge({ source }: { source: Source }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[source]}`}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: SOURCE_COLORS[source] }}
      />
      {SOURCE_LABELS[source]}
    </span>
  );
}
