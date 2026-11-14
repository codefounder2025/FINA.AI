'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AssetClass } from '@/lib/connectors/types';
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
  const data = ORDER.map((assetClass) => ({
    name: ASSET_CLASS_LABELS[assetClass],
    value: allocation[assetClass],
    color: ASSET_CLASS_COLORS[assetClass],
  })).filter((row) => row.value > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Investment allocation</h2>
        <p className="mt-0.5 text-xs text-slate-500">By asset class (mock portfolio)</p>
      </header>

      {data.length === 0 || total <= 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">
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
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 space-y-2">
            {data.map((row) => (
              <li key={row.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.name}
                </span>
                <span className="tabular-nums text-slate-900">
                  {formatHKD(row.value)}
                  <span className="ml-2 text-xs text-slate-400">
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
