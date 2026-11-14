import { getBankTransactions } from './connectors/bankConnector';
import { getOctopusTransactions } from './connectors/octopusConnector';
import { getHoldings } from './connectors/investmentConnector';
import type {
  AssetClass,
  Category,
  Holding,
  Source,
  Transaction,
} from './connectors/types';

/**
 * Pure, testable aggregation layer. Everything the UI shows is computed here
 * from the raw connector output — nothing is hardcoded downstream.
 */

export const ALL_SOURCES: Source[] = ['bank', 'octopus', 'investment'];

export interface SourceToggle {
  bank: boolean;
  octopus: boolean;
  investment: boolean;
}

/**
 * Optional per-source data overrides. Used by the CSV import flow to swap the
 * mock portfolio for an imported one without introducing any hidden state:
 * omitting `holdings` leaves the mock adapter in charge, so every previously
 * verified figure is unchanged.
 */
export interface SnapshotOverrides {
  holdings?: Holding[];
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
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

// ------------------------------------------------------------------ helpers

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

function emptyCategoryRecord(): Record<Category, number> {
  return {
    food: 0,
    transport: 0,
    shopping: 0,
    bills: 0,
    entertainment: 0,
    education: 0,
    income: 0,
    other: 0,
  };
}

/** Unique month keys (YYYY-MM) present in the data, newest first. */
export function getMonths(transactions: Transaction[]): string[] {
  const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
  return [...set].sort((a, b) => b.localeCompare(a));
}

function addOneMonth(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonth = m === 12 ? 1 : m + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ------------------------------------------------------------------ core API

/** Every transaction across all connectors (bank + Octopus). */
export function getAllTransactions(): Transaction[] {
  return [...getBankTransactions(), ...getOctopusTransactions()];
}

/** Transactions limited to the currently enabled sources. */
export function getTransactionsForSources(sources: Source[]): Transaction[] {
  const enabled = new Set(sources);
  return getAllTransactions().filter((t) => enabled.has(t.source));
}

export function getTotals(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.amount >= 0) income += t.amount;
    else expense += -t.amount;
  }
  return {
    income: round2(income),
    expense: round2(expense),
    net: round2(income - expense),
  };
}

/** Expense totals per category (income rows are ignored). */
export function getSpendingByCategory(
  transactions: Transaction[],
): Record<Category, number> {
  const out = emptyCategoryRecord();
  for (const t of transactions) {
    if (t.amount < 0 && t.category !== 'income') out[t.category] += -t.amount;
  }
  for (const key of Object.keys(out) as Category[]) out[key] = round2(out[key]);
  return out;
}

/** Cash flow across all transactions + current market value of holdings. */
export function getNetPosition(
  bankTx: Transaction[],
  octopusTx: Transaction[],
  holdings: Holding[],
): number {
  const { net } = getTotals([...bankTx, ...octopusTx]);
  const investments = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  return round2(net + investments);
}

/**
 * Recurring payments detected from history: a merchant that appears in two or
 * more distinct months within a "bill-like" category (utilities, rent,
 * subscriptions, courses). The next due date is projected one month after the
 * latest occurrence.
 */
export function getUpcomingBills(transactions: Transaction[]): Transaction[] {
  const billCategories = new Set<Category>(['bills', 'entertainment', 'education']);
  const byMerchant = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (t.amount >= 0 || !billCategories.has(t.category)) continue;
    const list = byMerchant.get(t.merchant) ?? [];
    list.push(t);
    byMerchant.set(t.merchant, list);
  }

  const bills: Transaction[] = [];
  for (const list of byMerchant.values()) {
    const months = new Set(list.map((t) => t.date.slice(0, 7)));
    if (months.size < 2) continue;
    const latest = [...list].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    if (!latest) continue;
    bills.push({ ...latest, id: `upcoming-${latest.id}`, date: addOneMonth(latest.date) });
  }

  return bills.sort((a, b) => a.date.localeCompare(b.date));
}

/** Percent change in a category's spend, current month vs previous month. */
export function getMonthOverMonthChange(
  transactions: Transaction[],
  category: Category,
): number {
  const months = getMonths(transactions);
  if (months.length < 2) return 0;
  const [current, previous] = months;

  const sumFor = (month: string) =>
    transactions
      .filter((t) => t.amount < 0 && t.category === category && t.date.startsWith(month))
      .reduce((s, t) => s + -t.amount, 0);

  const prev = sumFor(previous);
  const curr = sumFor(current);
  if (prev === 0) return curr === 0 ? 0 : 100;
  return round1(((curr - prev) / prev) * 100);
}

// ------------------------------------------------------------------ snapshot

export interface AggregatedSnapshot {
  enabledSources: Source[];
  monthLabel: string;
  previousMonthLabel: string;
  totals: Totals;
  currentMonthSpending: number;
  previousMonthSpending: number;
  spendingByCategory: Record<Category, number>;
  previousSpendingByCategory: Record<Category, number>;
  momChangeByCategory: Record<Category, number>;
  netPosition: number;
  investmentValue: number;
  investmentCost: number;
  /** 0..1 — share of net position held in investments */
  investmentShare: number;
  /** 0..1 — share of current-month spending paid via Octopus */
  octopusShare: number;
  /** 0..1 — share of current-month spending paid from the bank account */
  bankShare: number;
  allocation: Record<AssetClass, number>;
  largestExpense: Transaction | null;
  topHolding: Holding | null;
  upcomingBillsTotal: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/**
 * Single entry point used by the dashboard and the insight API: takes the
 * current source toggle and returns every derived number the UI needs.
 */
export function buildSnapshot(
  toggle: SourceToggle,
  overrides: SnapshotOverrides = {},
): AggregatedSnapshot {
  const enabledSources = (
    Object.keys(toggle) as Array<keyof SourceToggle>
  ).filter((k) => toggle[k]) as Source[];

  const transactions = getTransactionsForSources(enabledSources);
  const bankTx = toggle.bank ? getBankTransactions() : [];
  const octopusTx = toggle.octopus ? getOctopusTransactions() : [];
  const holdings = toggle.investment
    ? overrides.holdings ?? getHoldings()
    : [];

  // Month axis is derived from the FULL dataset so labels never shift on toggle.
  const months = getMonths(getAllTransactions());
  const currentMonth = months[0] ?? '';
  const previousMonth = months[1] ?? '';

  const currentTx = transactions.filter((t) => t.date.startsWith(currentMonth));
  const previousTx = transactions.filter((t) => t.date.startsWith(previousMonth));

  const currentTotals = getTotals(currentTx);
  const previousTotals = getTotals(previousTx);

  const spendingByCategory = getSpendingByCategory(currentTx);
  const previousSpendingByCategory = getSpendingByCategory(previousTx);

  const momChangeByCategory = emptyCategoryRecord();
  for (const c of EXPENSE_CATEGORIES) {
    momChangeByCategory[c] = getMonthOverMonthChange(transactions, c);
  }

  const investmentValue = round2(
    holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0),
  );
  const investmentCost = round2(
    holdings.reduce((s, h) => s + h.quantity * h.costBasis, 0),
  );

  const allocation: Record<AssetClass, number> = { stock: 0, etf: 0, crypto: 0, cash: 0 };
  for (const h of holdings) allocation[h.assetClass] += h.quantity * h.currentPrice;
  for (const k of Object.keys(allocation) as AssetClass[]) allocation[k] = round2(allocation[k]);

  const netPosition = getNetPosition(bankTx, octopusTx, holdings);

  const periodTotals = getTotals(transactions);
  const investmentShare = netPosition > 0 ? investmentValue / netPosition : 0;

  const octopusSpend = currentTx
    .filter((t) => t.source === 'octopus' && t.amount < 0)
    .reduce((s, t) => s + -t.amount, 0);
  const bankSpend = currentTx
    .filter((t) => t.source === 'bank' && t.amount < 0)
    .reduce((s, t) => s + -t.amount, 0);
  const currentSpend = currentTotals.expense;

  const largestExpense =
    currentTx
      .filter((t) => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)[0] ?? null;

  const topHolding =
    [...holdings].sort(
      (a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice,
    )[0] ?? null;

  const upcomingBillsTotal = round2(
    getUpcomingBills(transactions).reduce((s, b) => s + -b.amount, 0),
  );

  return {
    enabledSources,
    monthLabel: formatMonthKey(currentMonth),
    previousMonthLabel: formatMonthKey(previousMonth),
    totals: periodTotals,
    currentMonthSpending: currentSpend,
    previousMonthSpending: previousTotals.expense,
    spendingByCategory,
    previousSpendingByCategory,
    momChangeByCategory,
    netPosition,
    investmentValue,
    investmentCost,
    investmentShare,
    octopusShare: currentSpend > 0 ? octopusSpend / currentSpend : 0,
    bankShare: currentSpend > 0 ? bankSpend / currentSpend : 0,
    allocation,
    largestExpense,
    topHolding,
    upcomingBillsTotal,
  };
}
