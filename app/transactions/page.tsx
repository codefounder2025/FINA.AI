'use client';

import { useMemo, useState } from 'react';
import ManualTransactionForm from '@/components/ManualTransactionForm';
import ProvenanceBadge, { combineProvenance } from '@/components/ProvenanceBadge';
import TransactionRow from '@/components/TransactionRow';
import { usePortfolio } from '@/components/PortfolioProvider';
import { getAllTransactions } from '@/lib/aggregator';
import type { Category, Source } from '@/lib/connectors/types';
import { CATEGORY_LABELS, formatHKD } from '@/lib/format';

const CATEGORIES: Category[] = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'education',
  'income',
  'other',
];

export default function TransactionsPage() {
  const { overrides, manualTransactions, removeManualTransaction, provenance } = usePortfolio();

  // The provider's overrides fold in imported statements, sandbox connections
  // and hand-entered transactions; untouched sources fall through to the bundled adapters.
  const all = useMemo(
    () => [...getAllTransactions(overrides)].sort((a, b) => b.date.localeCompare(a.date)),
    [overrides],
  );

  const manualIds = useMemo(
    () => new Set(manualTransactions.map((t) => t.id)),
    [manualTransactions],
  );

  const [source, setSource] = useState<Source | 'all'>('all');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(
    () =>
      all.filter(
        (t) =>
          (source === 'all' || t.source === source) &&
          (category === 'all' || t.category === category) &&
          (!from || t.date >= from) &&
          (!to || t.date <= to),
      ),
    [all, source, category, from, to],
  );

  const spent = filtered
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + -t.amount, 0);
  const received = filtered
    .filter((t) => t.amount >= 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const isFiltered = source !== 'all' || category !== 'all' || from !== '' || to !== '';

  const reset = () => {
    setSource('all');
    setCategory('all');
    setFrom('');
    setTo('');
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Unified Transactions
          </h1>
          <ProvenanceBadge kind={combineProvenance([provenance.bank, provenance.octopus])} />
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Bank and Octopus activity in one feed · newest first
        </p>
      </header>

      <ManualTransactionForm />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Source
            </span>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as Source | 'all')}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-100"
            >
              <option value="all">All sources</option>
              <option value="bank">Bank</option>
              <option value="octopus">Octopus</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Category
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Category | 'all')}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-100"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-100"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
          <span className="text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{filtered.length}</span> transactions
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            Spent <span className="font-semibold text-slate-900 dark:text-slate-100">{formatHKD(spent)}</span>
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            Received <span className="font-semibold text-green-600 dark:text-green-400">{formatHKD(received)}</span>
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            No transactions match these filters.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onRemove={
                  manualIds.has(transaction.id)
                    ? () => removeManualTransaction(transaction.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
