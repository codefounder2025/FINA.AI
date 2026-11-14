'use client';

import { useId, useState } from 'react';
import { usePortfolio } from '@/components/PortfolioProvider';
import type { LedgerSourceId } from '@/lib/connectors/sandboxLedgerAdapter';
import type { Category } from '@/lib/connectors/types';
import { CATEGORY_LABELS, formatSignedHKD } from '@/lib/format';

const CATEGORIES: Category[] = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'education',
  'other',
];

const INPUT =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-100';

/**
 * Hand-entered transactions.
 *
 * Entries live only for the session and are labelled "Manual entry" everywhere
 * they appear, so a typed-in figure is never mistaken for imported data.
 */
export default function ManualTransactionForm() {
  const { addManualTransaction } = usePortfolio();
  const id = useId();

  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<LedgerSourceId>('bank');
  const [direction, setDirection] = useState<'expense' | 'income'>('expense');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<Category>('food');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ merchant: string; amount: number } | null>(null);

  const reset = () => {
    setMerchant('');
    setAmount('');
    setError(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const name = merchant.trim();
    const parsed = Number(amount.replace(/[,\s]/g, ''));

    if (!name) {
      setError('Enter a description.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Choose a date.');
      return;
    }

    const signed = direction === 'income' ? parsed : -parsed;

    addManualTransaction({
      source,
      merchant: name,
      amount: signed,
      date,
      category: direction === 'income' ? 'income' : category,
    });

    setAdded({ merchant: name, amount: signed });
    reset();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Add a transaction manually
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            For anything a statement or app connection missed. Session only — nothing is saved.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            setError(null);
          }}
          aria-expanded={open}
          aria-controls={`${id}-form`}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {open ? 'Hide form' : 'Add transaction'}
        </button>
      </div>

      {added && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800"
        >
          Added {added.merchant} · {formatSignedHKD(added.amount)}. It is marked as a manual entry.
        </p>
      )}

      {open && (
        <form id={`${id}-form`} onSubmit={submit} className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Type
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(['expense', 'income'] as const).map((option) => (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                    direction === option
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-direction`}
                    value={option}
                    checked={direction === option}
                    onChange={() => setDirection(option)}
                    className="sr-only"
                  />
                  {option === 'expense' ? 'Expense' : 'Income'}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Source
              </span>
              <select
                value={source}
                onChange={(event) => setSource(event.target.value as LedgerSourceId)}
                className={INPUT}
              >
                <option value="bank">Bank</option>
                <option value="octopus">Octopus</option>
              </select>
            </label>

            <label className="block sm:col-span-2 lg:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Description
              </span>
              <input
                type="text"
                value={merchant}
                onChange={(event) => setMerchant(event.target.value)}
                placeholder="e.g. ParknShop"
                className={INPUT}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Amount (HKD)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className={INPUT}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={INPUT}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Category
              </span>
              <select
                value={direction === 'income' ? 'income' : category}
                onChange={(event) => setCategory(event.target.value as Category)}
                disabled={direction === 'income'}
                className={`${INPUT} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {(direction === 'income' ? (['income'] as Category[]) : CATEGORIES).map((item) => (
                  <option key={item} value={item}>
                    {CATEGORY_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Add transaction
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setAdded(null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
            >
              Clear
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
