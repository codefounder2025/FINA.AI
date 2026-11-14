import {
  ASSET_CLASS_LABELS,
  CATEGORY_LABELS,
  formatHKD,
  formatPercent,
} from './format';
import type { AssetClass, Category, Source, Transaction } from './connectors/types';

/**
 * The slice of aggregated data that the insight generator actually reads.
 * `AggregatedSnapshot` satisfies this structurally, and the `/api/insight`
 * route builds it from validated input — so the same generator serves both the
 * browser (instant paint) and the server (fallback + LLM prompt).
 */
export interface InsightInput {
  enabledSources: Source[];
  monthLabel: string;
  previousMonthLabel: string;
  currentMonthSpending: number;
  spendingByCategory: Record<Category, number>;
  previousSpendingByCategory: Record<Category, number>;
  momChangeByCategory: Record<Category, number>;
  netPosition: number;
  investmentValue: number;
  investmentShare: number;
  octopusShare: number;
  allocation: Record<AssetClass, number>;
  largestExpense: Transaction | null;
}

const EXPENSE_CATEGORIES: Category[] = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'education',
  'other',
];

/**
 * Rule-based insight generator.
 *
 * This is the guaranteed path: it runs instantly in the browser (so the panel
 * is never empty and never blocks the demo) and it is also what the
 * `/api/insight` route returns when no LLM key is configured or the LLM call
 * fails. Every string is derived from the current aggregated data, so toggling
 * a source changes the text.
 */
export function getRuleBasedInsights(snapshot: InsightInput): string[] {
  const insights: string[] = [];
  const total = snapshot.currentMonthSpending;

  // 1) Where the money actually goes this month.
  if (total > 0) {
    const ranked = EXPENSE_CATEGORIES.map(
      (c) => [c, snapshot.spendingByCategory[c]] as const,
    )
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);

    const top = ranked[0];
    if (top) {
      const [category, value] = top;
      const share = Math.round((value / total) * 100);
      insights.push(
        category === 'bills'
          ? `Bills & rent are ${share}% of this month's spending (${formatHKD(value)}) — fixed costs dominate your budget.`
          : `${CATEGORY_LABELS[category]} is your biggest category at ${share}% of this month's spending (${formatHKD(value)}).`,
      );
    }
  }

  // 2) The biggest month-over-month move, measured in dollars.
  const movers = EXPENSE_CATEGORIES.map((c) => ({
    category: c,
    change: snapshot.momChangeByCategory[c],
    prevValue: snapshot.previousSpendingByCategory[c],
    value: snapshot.spendingByCategory[c],
  }))
    .filter((m) => m.prevValue > 0 && Math.abs(m.value - m.prevValue) > 0)
    .sort((a, b) => Math.abs(b.value - b.prevValue) - Math.abs(a.value - a.prevValue));

  const mover = movers[0];
  if (mover) {
    const dir = mover.change > 0 ? 'above' : 'below';
    insights.push(
      `${CATEGORY_LABELS[mover.category]} is ${Math.abs(mover.change).toFixed(0)}% ${dir} ${snapshot.previousMonthLabel} — the biggest swing in your spending.`,
    );
  }

  // 3) How much of net worth sits in the market (only when investments are on).
  if (snapshot.enabledSources.includes('investment') && snapshot.investmentValue > 0) {
    const allocation = Object.entries(snapshot.allocation) as Array<[AssetClass, number]>;
    const heaviest = [...allocation].sort((a, b) => b[1] - a[1])[0];
    const heaviestShare = heaviest ? heaviest[1] / snapshot.investmentValue : 0;
    insights.push(
      `${formatPercent(snapshot.investmentShare)} of your net position (${formatHKD(snapshot.netPosition)}) is invested — ${
        heaviest ? ASSET_CLASS_LABELS[heaviest[0]] : 'your portfolio'
      } is the largest slice at ${formatPercent(heaviestShare)}.`,
    );
  }

  // 4) How much runs through Octopus (only when the card is on).
  if (snapshot.enabledSources.includes('octopus') && snapshot.octopusShare > 0) {
    insights.push(
      `Octopus accounts for ${formatPercent(snapshot.octopusShare, 1)} of this month's spending — mostly small transit and convenience-store taps that never show on your bank statement.`,
    );
  }

  // 5) Single largest expense.
  if (snapshot.largestExpense) {
    insights.push(
      `Your largest single expense this month was ${snapshot.largestExpense.merchant} at ${formatHKD(
        Math.abs(snapshot.largestExpense.amount),
      )}.`,
    );
  }

  if (insights.length === 0) {
    insights.push('Turn on at least one data source to generate insights from your aggregated finances.');
  }

  return insights.slice(0, 3);
}
