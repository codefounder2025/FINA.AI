'use client';

import type { SourceToggle as SourceToggleState } from '@/lib/aggregator';
import type { Source } from '@/lib/connectors/types';
import { SOURCE_COLORS, SOURCE_LABELS } from '@/lib/format';

const SOURCES: Source[] = ['bank', 'octopus', 'investment'];

interface SourceToggleProps {
  value: SourceToggleState;
  onChange: (next: SourceToggleState) => void;
}

export default function SourceToggle({ value, onChange }: SourceToggleProps) {
  const toggle = (source: Source) => {
    if (source === 'bank') onChange({ ...value, bank: !value.bank });
    else if (source === 'octopus') onChange({ ...value, octopus: !value.octopus });
    else onChange({ ...value, investment: !value.investment });
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Data sources">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Sources</span>
      {SOURCES.map((source) => {
        const enabled = value[source];
        return (
          <button
            key={source}
            type="button"
            aria-pressed={enabled}
            onClick={() => toggle(source)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              enabled
                ? 'border-transparent text-white shadow-sm'
                : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
            }`}
            style={enabled ? { backgroundColor: SOURCE_COLORS[source] } : undefined}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: enabled ? 'rgba(255,255,255,0.85)' : SOURCE_COLORS[source] }}
            />
            {SOURCE_LABELS[source]}
          </button>
        );
      })}
    </div>
  );
}
