'use client';

import { useMemo, useState } from 'react';
import TransactionRow from '@/components/TransactionRow';
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
  const all = useMemo(
    () => [...getAllTransactions()].sort((a, b) => b.date.localeCompare(a.date)),
    [],
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Unified Transactions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Bank and Octopus activity in one feed · mock data · newest first
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Source
            </span>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as Source | 'all')}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              <option value="all">All sources</option>
              <option value="bank">Bank</option>
              <option value="octopus">Octopus</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Category
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Category | 'all')}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
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
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-600">
            <span className="font-semibold text-slate-900">{filtered.length}</span> transactions
          </span>
          <span className="text-slate-600">
            Spent <span className="font-semibold text-slate-900">{formatHKD(spent)}</span>
          </span>
          <span className="text-slate-600">
            Received <span className="font-semibold text-green-600">{formatHKD(received)}</span>
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">
            No transactions match these filters.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
