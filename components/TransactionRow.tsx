import type { Transaction } from '@/lib/connectors/types';
import { CATEGORY_LABELS, formatDate, formatSignedHKD } from '@/lib/format';
import SourceBadge from './SourceBadge';

export default function TransactionRow({ transaction }: { transaction: Transaction }) {
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
    </div>
  );
}
