import type { AssetClass, Category, Source } from './connectors/types';

/**
 * Shared display constants + formatters. Kept in one place so colours and
 * labels are consistent across every card, badge and chart.
 */

export const SOURCE_COLORS: Record<Source, string> = {
  bank: '#2563eb',
  octopus: '#f97316',
  investment: '#16a34a',
};

export const SOURCE_LABELS: Record<Source, string> = {
  bank: 'Bank',
  octopus: 'Octopus',
  investment: 'Investment',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  food: 'Dining',
  transport: 'Transport',
  shopping: 'Shopping',
  bills: 'Bills & Rent',
  entertainment: 'Entertainment',
  education: 'Education',
  income: 'Income',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  food: '#ef4444',
  transport: '#0ea5e9',
  shopping: '#a855f7',
  bills: '#64748b',
  entertainment: '#f59e0b',
  education: '#14b8a6',
  income: '#22c55e',
  other: '#94a3b8',
};

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'HK Stocks',
  etf: 'ETFs',
  crypto: 'Crypto',
  cash: 'Cash',
};

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  stock: '#2563eb',
  etf: '#16a34a',
  crypto: '#f59e0b',
  cash: '#94a3b8',
};

const HKD_0 = new Intl.NumberFormat('en-HK', {
  style: 'currency',
  currency: 'HKD',
  maximumFractionDigits: 0,
});

const HKD_2 = new Intl.NumberFormat('en-HK', {
  style: 'currency',
  currency: 'HKD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatHKD(amount: number, decimals = false): string {
  return (decimals ? HKD_2 : HKD_0).format(amount);
}

/** e.g. "-HK$9,500" / "+HK$28,000" */
export function formatSignedHKD(amount: number): string {
  return `${amount < 0 ? '-' : '+'}${formatHKD(Math.abs(amount))}`;
}

/** ratio 0..1 -> "82%" */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** signed percentage value -> "+49%" */
export function formatSignedPercent(value: number, digits = 0): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2026-10-03" -> "3 Oct 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}
