'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  MAX_CSV_BYTES,
  parseBrokerCsv,
  type BrokerCsvRow,
} from '@/lib/connectors/csvBrokerAdapter';
import { ASSET_CLASS_LABELS, formatHKD } from '@/lib/format';

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: BrokerCsvRow[], fileName: string) => void;
}

const MAX_KB = MAX_CSV_BYTES / 1024;

export default function ImportCsvModal({ open, onClose, onConfirm }: ImportCsvModalProps) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<BrokerCsvRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const hintId = useId();

  // Fresh state every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setFileName('');
    setRows(null);
    setErrors([]);
    setDragActive(false);
  }, [open]);

  // Escape closes, and the page behind is frozen while the dialog is up.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Move focus into the dialog so keyboard users are not left behind it.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleFile = useCallback(async (file: File) => {
    setErrors([]);
    setRows(null);
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please choose a .csv file.']);
      return;
    }

    if (file.size > MAX_CSV_BYTES) {
      setErrors([
        `That file is ${Math.ceil(file.size / 1024)} KB. The limit is ${MAX_KB} KB.`,
      ]);
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setErrors(['The file could not be read.']);
      return;
    }

    const result = parseBrokerCsv(text);
    if (result.errors.length > 0) {
      setErrors(result.errors);
      return;
    }

    setRows(result.rows);
  }, []);

  if (!open) return null;

  const previewTotal =
    rows?.reduce((sum, row) => sum + row.quantity * row.currentPrice, 0) ?? 0;

  const confirm = () => {
    if (!rows) return;
    onConfirm(rows, fileName);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 py-10 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={hintId}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={headingId}
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Import broker CSV
            </h2>
            <p
              id={hintId}
              className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400"
            >
              Parsed in your browser and held for this session only — nothing is uploaded and
              nothing is stored. Importing replaces the mock portfolio.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Drop zone — the input is visually hidden but focusable, so the whole
            area is reachable and operable by keyboard. */}
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) void handleFile(dropped);
          }}
          className={`mt-4 rounded-xl border-2 border-dashed p-5 text-center transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-500 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
              : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'
          }`}
        >
          <label className="block cursor-pointer">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                const chosen = event.target.files?.[0];
                if (chosen) void handleFile(chosen);
                // Allow re-picking the same file after a failed attempt.
                event.target.value = '';
              }}
            />
            <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              {fileName || 'Drop a .csv here, or click to choose a file'}
            </span>
            <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
              Max {MAX_KB} KB · header row required:
              <code className="ml-1 rounded bg-slate-200 px-1 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                ticker, quantity, avgCost, currency
              </code>
            </span>
          </label>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            <p className="font-semibold">
              This file was rejected — nothing was imported.
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {errors.slice(0, 8).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {errors.length > 8 && (
              <p className="mt-1">…and {errors.length - 8} more.</p>
            )}
          </div>
        )}

        {rows && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Preview · {rows.length} holding{rows.length === 1 ? '' : 's'}
              </h3>
              <p className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                Market value {formatHKD(previewTotal)}
              </p>
            </div>

            <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Ticker</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Qty</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Avg cost</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Price</th>
                    <th scope="col" className="px-3 py-2 font-medium">Class</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.ticker} className="text-slate-700 dark:text-slate-300">
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                        {row.ticker}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatHKD(row.avgCost, true)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatHKD(row.currentPrice, true)}
                      </td>
                      <td className="px-3 py-2">{ASSET_CLASS_LABELS[row.assetClass]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatHKD(row.quantity * row.currentPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!rows}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:text-slate-950 dark:hover:bg-indigo-400"
          >
            Confirm import
          </button>
        </div>
      </div>
    </div>
  );
}
