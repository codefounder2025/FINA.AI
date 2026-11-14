import type { Transaction } from '@/lib/connectors/types';
import { CATEGORY_LABELS, formatDate, formatSignedHKD } from '@/lib/format';
import SourceBadge from './SourceBadge';

export default function TransactionRow({
  transaction,
  onRemove,
}: {
  transaction: Transaction;
  onRemove?: () => void;
}) {
  const isIncome = transaction.amount >= 0;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{transaction.merchant}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{formatDate(transaction.date)}</span>
          <span aria-hidden>·</span>
          <span>{CATEGORY_LABELS[transaction.category]}</span>
        </p>
      </div>
      <SourceBadge source={transaction.source} />
      <p
        className={`w-24 shrink-0 text-right text-sm font-semibold tabular-nums ${
          isIncome ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {formatSignedHKD(transaction.amount)}
      </p>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${transaction.merchant}`}
          className="shrink-0 rounded-lg px-1.5 py-1 text-xs font-medium text-slate-400 transition hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:text-red-400"
        >
          Remove
        </button>
      )}
    </div>
  );
}
