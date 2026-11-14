'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Category } from '@/lib/connectors/types';
import { CATEGORY_COLORS, CATEGORY_LABELS, formatHKD } from '@/lib/format';

const ORDER: Category[] = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'education',
  'other',
];

interface SpendingBarChartProps {
  spendingByCategory: Record<Category, number>;
  monthLabel: string;
}

export default function SpendingBarChart({
  spendingByCategory,
  monthLabel,
}: SpendingBarChartProps) {
  const data = ORDER.map((category) => ({
    name: CATEGORY_LABELS[category],
    value: spendingByCategory[category],
    color: CATEGORY_COLORS[category],
  })).filter((row) => row.value > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Spending by category</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {monthLabel} · bank + Octopus combined (mock)
          </p>
        </div>
      </header>

      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">
          No spending in scope — enable a source to see the breakdown.
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(value: number) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
                }
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                formatter={(value: number) => [formatHKD(value), 'Spent']}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {data.map((row) => (
                  <Cell key={row.name} fill={row.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
