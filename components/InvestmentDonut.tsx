'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AssetClass } from '@/lib/connectors/types';
import ImportCsvButton from '@/components/ImportCsvButton';
import ProvenanceBadge from '@/components/ProvenanceBadge';
import { usePortfolio } from '@/components/PortfolioProvider';
import {
  ASSET_CLASS_COLORS,
  ASSET_CLASS_LABELS,
  formatHKD,
  formatPercent,
} from '@/lib/format';

interface InvestmentDonutProps {
  allocation: Record<AssetClass, number>;
  total: number;
}

const ORDER: AssetClass[] = ['stock', 'etf', 'crypto', 'cash'];

export default function InvestmentDonut({ allocation, total }: InvestmentDonutProps) {
  const { imported, clearImport } = usePortfolio();

  const data = ORDER.map((assetClass) => ({
    name: ASSET_CLASS_LABELS[assetClass],
    value: allocation[assetClass],
    color: ASSET_CLASS_COLORS[assetClass],
  })).filter((row) => row.value > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Investment allocation
              </h2>
              <ProvenanceBadge
                kind={imported ? 'csv' : 'mock'}
                date={imported?.importedAt}
              />
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {imported
                ? `By asset class · imported from ${imported.fileName}`
                : 'By asset class (mock portfolio)'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ImportCsvButton />
          {imported && (
            <button
              type="button"
              onClick={clearImport}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Clear import
            </button>
          )}
        </div>
      </header>

      {data.length === 0 || total <= 0 ? (
        <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
          Investments are switched off — turn them on to see the allocation.
        </p>
      ) : (
        <>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((row) => (
                    <Cell key={row.name} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatHKD(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--chart-tooltip-border)',
                    background: 'var(--chart-tooltip-bg)',
                    color: 'var(--chart-tooltip-text)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 space-y-2">
            {data.map((row) => (
              <li key={row.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.name}
                </span>
                <span className="tabular-nums text-slate-900 dark:text-slate-100">
                  {formatHKD(row.value)}
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatPercent(row.value / total)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
