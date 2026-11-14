/**
 * Shared domain types for FINA.AI.
 *
 * Every connector (bank, Octopus, investment) normalises its output into these
 * shapes so the aggregator and insight layers never need to know where the
 * data came from. Today every connector is backed by a mock adapter; the types
 * are written so a real adapter can be dropped in without touching the rest of
 * the app.
 */

export type Source = 'bank' | 'octopus' | 'investment';

export type Category =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'education'
  | 'income'
  | 'other';

export type AssetClass = 'stock' | 'etf' | 'crypto' | 'cash';

export interface Transaction {
  id: string;
  source: Source;
  merchant: string;
  /** negative = expense, positive = income */
  amount: number;
  currency: 'HKD';
  /** ISO date, e.g. 2026-10-03 */
  date: string;
  category: Category;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  /** current market price per unit, in HKD */
  currentPrice: number;
  /** average cost per unit, in HKD */
  costBasis: number;
}
