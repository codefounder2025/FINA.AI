'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { extractPdfLines } from '@/lib/pdf';
import {
  MAX_PDF_BYTES,
  parseStatementLines,
  type StatementRow,
} from '@/lib/connectors/statementParser';
import type { LedgerSourceId } from '@/lib/connectors/sandboxLedgerAdapter';
import { CATEGORY_LABELS, formatDate, formatSignedHKD } from '@/lib/format';

interface StatementUploadModalProps {
  source: LedgerSourceId;
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: StatementRow[], fileName: string) => void;
}

const MAX_MB = MAX_PDF_BYTES / (1024 * 1024);

export default function StatementUploadModal({
  source,
  open,
  onClose,
  onConfirm,
}: StatementUploadModalProps) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<StatementRow[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const hintId = useId();

  const noun = source === 'bank' ? 'bank' : 'Octopus';

  // Fresh state every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setFileName('');
    setRows(null);
    setSkipped(0);
    setErrors([]);
    setBusy(false);
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

  const handleFile = useCallback(
    async (file: File) => {
      setErrors([]);
      setRows(null);
      setSkipped(0);
      setFileName(file.name);

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrors(['Please choose a .pdf file.']);
        return;
      }

      setBusy(true);
      try {
        const extracted = await extractPdfLines(file);
        if (extracted.errors.length > 0) {
          setErrors(extracted.errors);
          return;
        }

        const result = parseStatementLines(extracted.lines, { source });
        if (result.errors.length > 0) {
          setErrors(result.errors);
          return;
        }

        setRows(result.rows);
        setSkipped(result.skipped);
      } finally {
        setBusy(false);
      }
    },
    [source],
  );

  if (!open) return null;

  const spend = rows?.filter((row) => row.amount < 0).reduce((sum, row) => sum + -row.amount, 0) ?? 0;
  const income = rows?.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0) ?? 0;

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
            <h2 id={headingId} className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Upload {noun} statement (PDF)
            </h2>
            <p id={hintId} className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Read in your browser and held for this session only — the file is never uploaded or
              stored. Importing replaces the sample {noun} ledger.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close statement upload dialog"
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
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const chosen = event.target.files?.[0];
                if (chosen) void handleFile(chosen);
                // Allow re-picking the same file after a failed attempt.
                event.target.value = '';
              }}
            />
            <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              {busy ? 'Reading the statement…' : fileName || 'Drop a .pdf here, or click to choose a file'}
            </span>
            <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
              Max {MAX_MB} MB · text-based PDF (not a scan) · password-protected files are not supported
            </span>
          </label>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            <p className="font-semibold">This statement was not imported — nothing was changed.</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {errors.slice(0, 4).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {rows && (
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Preview · {rows.length} transaction{rows.length === 1 ? '' : 's'}
              </h3>
              <p className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                Out {formatSignedHKD(-spend)} · In {formatSignedHKD(income)}
              </p>
            </div>

            {skipped > 0 && (
              <p
                role="status"
                className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
              >
                {skipped} line{skipped === 1 ? '' : 's'} could not be read and {skipped === 1 ? 'was' : 'were'}{' '}
                left out. Check the preview before confirming.
              </p>
            )}

            <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Date</th>
                    <th scope="col" className="px-3 py-2 font-medium">Description</th>
                    <th scope="col" className="px-3 py-2 font-medium">Category</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row, index) => (
                    <tr key={`${row.date}-${row.merchant}-${index}`} className="text-slate-700 dark:text-slate-300">
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatDate(row.date)}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{row.merchant}</td>
                      <td className="whitespace-nowrap px-3 py-2">{CATEGORY_LABELS[row.category]}</td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums ${
                          row.amount >= 0
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatSignedHKD(row.amount)}
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
