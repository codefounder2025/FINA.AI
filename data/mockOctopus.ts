import type { Transaction } from '@/lib/connectors/types';

/**
 * Mock Octopus card activity. In reality Octopus exposes no public
 * transaction API, so these rows represent what a user would get from a
 * manual CSV export of their Octopus app history.
 *
 * Amount convention: negative = money out (Octopus is a stored-value card, so
 * every row here is a spend).
 */
export const mockOctopusTransactions: Transaction[] = [
  // ---------------------------------------------------------------- September 2026
  {
    id: 'octo-2026-09-mtr-1',
    source: 'octopus',
    merchant: 'MTR — Kowloon Tong → Central',
    amount: -14.5,
    currency: 'HKD',
    date: '2026-09-03',
    category: 'transport',
  },
  {
    id: 'octo-2026-09-kmb',
    source: 'octopus',
    merchant: 'KMB Bus Route 104',
    amount: -11.6,
    currency: 'HKD',
    date: '2026-09-05',
    category: 'transport',
  },
  {
    id: 'octo-2026-09-7eleven',
    source: 'octopus',
    merchant: '7-Eleven — Snacks',
    amount: -23,
    currency: 'HKD',
    date: '2026-09-08',
    category: 'shopping',
  },
  {
    id: 'octo-2026-09-circlek',
    source: 'octopus',
    merchant: 'Circle K — Drinks',
    amount: -18.5,
    currency: 'HKD',
    date: '2026-09-11',
    category: 'shopping',
  },
  {
    id: 'octo-2026-09-pacific',
    source: 'octopus',
    merchant: 'Pacific Coffee — Latte',
    amount: -45,
    currency: 'HKD',
    date: '2026-09-14',
    category: 'food',
  },
  {
    id: 'octo-2026-09-mtr-2',
    source: 'octopus',
    merchant: 'MTR — Return Journey',
    amount: -28.2,
    currency: 'HKD',
    date: '2026-09-18',
    category: 'transport',
  },
  {
    id: 'octo-2026-09-taxi',
    source: 'octopus',
    merchant: 'Urban Taxi — Top-up',
    amount: -50,
    currency: 'HKD',
    date: '2026-09-25',
    category: 'transport',
  },

  // ---------------------------------------------------------------- October 2026
  {
    id: 'octo-2026-10-mtr-1',
    source: 'octopus',
    merchant: 'MTR — Kowloon Tong → Central',
    amount: -14.5,
    currency: 'HKD',
    date: '2026-10-03',
    category: 'transport',
  },
  {
    id: 'octo-2026-10-kmb',
    source: 'octopus',
    merchant: 'KMB Bus Route 104',
    amount: -12.4,
    currency: 'HKD',
    date: '2026-10-05',
    category: 'transport',
  },
  {
    id: 'octo-2026-10-7eleven',
    source: 'octopus',
    merchant: '7-Eleven — Snacks',
    amount: -31,
    currency: 'HKD',
    date: '2026-10-07',
    category: 'shopping',
  },
  {
    id: 'octo-2026-10-circlek',
    source: 'octopus',
    merchant: 'Circle K — Drinks',
    amount: -22,
    currency: 'HKD',
    date: '2026-10-09',
    category: 'shopping',
  },
  {
    id: 'octo-2026-10-pacific',
    source: 'octopus',
    merchant: 'Pacific Coffee — Flat White',
    amount: -42,
    currency: 'HKD',
    date: '2026-10-12',
    category: 'food',
  },
  {
    id: 'octo-2026-10-mtr-2',
    source: 'octopus',
    merchant: 'MTR — Airport Express Segment',
    amount: -29.8,
    currency: 'HKD',
    date: '2026-10-15',
    category: 'transport',
  },
  {
    id: 'octo-2026-10-taxi',
    source: 'octopus',
    merchant: 'Urban Taxi — Top-up',
    amount: -60,
    currency: 'HKD',
    date: '2026-10-21',
    category: 'transport',
  },
  {
    id: 'octo-2026-10-wellcome',
    source: 'octopus',
    merchant: 'Wellcome — Paid with Octopus',
    amount: -68,
    currency: 'HKD',
    date: '2026-10-24',
    category: 'food',
  },
];
