import type { Transaction } from '@/lib/connectors/types';
import { formatDate, formatHKD } from '@/lib/format';
import SourceBadge from './SourceBadge';

interface UpcomingBillsProps {
  bills: Transaction[];
  total: number;
}

export default function UpcomingBills({ bills, total }: UpcomingBillsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upcoming bills &amp; subscriptions</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Detected from recurring merchants in the transaction history
          </p>
        </div>
        {bills.length > 0 && (
          <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
            {formatHKD(total)} expected
          </span>
        )}
      </header>

      {bills.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No recurring bills detected from the enabled sources.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {bills.map((bill) => (
            <li key={bill.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{bill.merchant}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Due {formatDate(bill.date)}</p>
              </div>
              <SourceBadge source={bill.source} />
              <p className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatHKD(Math.abs(bill.amount))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
