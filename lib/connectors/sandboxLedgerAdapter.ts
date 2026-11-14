import type { Category, Source, Transaction } from './types';

/**
 * Sandbox app connector for the two spending sources (bank + Octopus).
 *
 * Simulates what a consented bank-app or Octopus-app connection *would*
 * return. Nothing here touches the network — the ledgers are fixed constants,
 * so the flow is deterministic, works offline, and needs no credentials.
 *
 * The source is always presented as "Connected (Sandbox)", never "Live".
 */

/** Sources that can only be fed by a spending ledger. */
export type LedgerSourceId = Extract<Source, 'bank' | 'octopus'>;

export type SandboxApp = 'hsbc' | 'bochk' | 'octopus';

export interface SandboxAppOption {
  id: SandboxApp;
  source: LedgerSourceId;
  name: string;
  /** What a real integration with this app would actually require. */
  realPath: string;
}

export const SANDBOX_APPS: SandboxAppOption[] = [
  {
    id: 'hsbc',
    source: 'bank',
    name: 'HSBC HK',
    realPath:
      'HKMA IADS / Open API sandbox — customer-consented account information. Production needs an AISP licence.',
  },
  {
    id: 'bochk',
    source: 'bank',
    name: 'Bank of China (Hong Kong)',
    realPath:
      'HKMA IADS / Open API sandbox — consented account information over the same standard.',
  },
  {
    id: 'octopus',
    source: 'octopus',
    name: 'Octopus App',
    realPath:
      'Octopus publishes no public transaction API; the realistic path is an eStatement export, or a future OR3.0 open API.',
  },
];

/** [date, merchant, amount, category] — amount negative = money out. */
type LedgerRow = [string, string, number, Category];

/**
 * Fixed, deterministic ledgers so the same app always yields the same figures.
 * Both a current month (November 2026) and the prior month are present so
 * month-over-month comparisons still have something to work with.
 */
const SANDBOX_LEDGERS: Record<SandboxApp, LedgerRow[]> = {
  hsbc: [
    ['2026-11-01', 'HSBC — Monthly Salary Deposit', 28000, 'income'],
    ['2026-11-02', 'Landlord — Rent Transfer (Nov)', -9800, 'bills'],
    ['2026-11-03', 'Deliveroo — Dinner', -186, 'food'],
    ['2026-11-04', 'MTR — Top-up via Bank', -300, 'transport'],
    ['2026-11-05', 'HK Electric — Electricity Bill', -580, 'bills'],
    ['2026-11-06', 'Starbucks — IFC Mall', -52, 'food'],
    ['2026-11-07', 'Netflix HK', -78, 'entertainment'],
    ['2026-11-09', 'Wellcome Supermarket — Causeway Bay', -364.5, 'food'],
    ['2026-11-11', 'UNIQLO — Tsim Sha Tsui', -390, 'shopping'],
    ['2026-11-13', 'SmarTone — Mobile Plan', -188, 'bills'],
    ['2026-11-15', 'Freelance — UI Design Gig', 3600, 'income'],
    ['2026-11-17', 'Broadway Circuit — Cinema Ticket', -110, 'entertainment'],
    ['2026-10-01', 'HSBC — Monthly Salary Deposit', 28000, 'income'],
    ['2026-10-02', 'Landlord — Rent Transfer (Oct)', -9800, 'bills'],
    ['2026-10-06', 'HK Electric — Electricity Bill', -615, 'bills'],
    ['2026-10-09', 'PARKnSHOP — Festival Walk', -341.2, 'food'],
    ['2026-10-14', 'H&M — Harbour City', -540, 'shopping'],
    ['2026-10-18', 'Spotify Premium', -58, 'entertainment'],
    ['2026-10-22', 'Freelance — Brand Identity Gig', 3000, 'income'],
  ],
  bochk: [
    ['2026-11-01', 'BOCHK — Salary Credit', 26000, 'income'],
    ['2026-11-02', 'Landlord — Rent Transfer (Nov)', -8800, 'bills'],
    ['2026-11-04', 'Circle K — Snacks', -42, 'shopping'],
    ['2026-11-06', 'Fairwood — Lunch Set', -68, 'food'],
    ['2026-11-08', 'KMB — Monthly Pass', -780, 'transport'],
    ['2026-11-10', 'Towngas — Gas Bill', -310, 'bills'],
    ['2026-11-12', 'hmv — Headphones', -899, 'shopping'],
    ['2026-11-14', 'Coursera — Machine Learning', -430, 'education'],
    ['2026-11-16', 'Pacific Coffee — Flat White', -46, 'food'],
    ['2026-11-18', 'Disney+ HK', -73, 'entertainment'],
    ['2026-10-01', 'BOCHK — Salary Credit', 26000, 'income'],
    ['2026-10-03', 'Landlord — Rent Transfer (Oct)', -8800, 'bills'],
    ['2026-10-08', 'Fairwood — Lunch Set', -72, 'food'],
    ['2026-10-12', 'hmv — Vinyl Record', -320, 'shopping'],
    ['2026-10-19', 'Towngas — Gas Bill', -286, 'bills'],
  ],
  octopus: [
    ['2026-11-02', 'MTR — Central → Kowloon Tong', -15.2, 'transport'],
    ['2026-11-03', '7-Eleven — Drinks', -26.5, 'shopping'],
    ['2026-11-05', "McDonald's — Breakfast", -34, 'food'],
    ['2026-11-07', 'KMB Bus Route 104', -12.4, 'transport'],
    ['2026-11-09', 'Starbucks — Mong Kok', -48, 'food'],
    ['2026-11-12', 'Wellcome — Paid with Octopus', -96.4, 'food'],
    ['2026-11-15', 'Citybus — Airport Route', -42, 'transport'],
    ['2026-11-18', 'Japan Home Centre', -59, 'shopping'],
    ['2026-11-21', 'Pacific Coffee — Latte', -45, 'food'],
    ['2026-10-04', 'MTR — Central → Kowloon Tong', -15.2, 'transport'],
    ['2026-10-07', '7-Eleven — Snacks', -31, 'shopping'],
    ['2026-10-11', "McDonald's — Lunch", -58, 'food'],
    ['2026-10-16', 'KMB Bus Route 104', -12.4, 'transport'],
    ['2026-10-23', 'Urban Taxi — Top-up', -60, 'transport'],
  ],
};

export function getSandboxApp(app: SandboxApp): SandboxAppOption | undefined {
  return SANDBOX_APPS.find((option) => option.id === app);
}

export function getSandboxAppsFor(source: LedgerSourceId): SandboxAppOption[] {
  return SANDBOX_APPS.filter((option) => option.source === source);
}

/**
 * The adapter. Implements the same `getTransactions(): Transaction[]` contract
 * as the bundled bank / Octopus connectors, so `buildSnapshot` accepts it
 * unchanged.
 */
export function createSandboxLedgerAdapter(app: SandboxApp) {
  const option = SANDBOX_APPS.find((candidate) => candidate.id === app);
  const source: LedgerSourceId = option?.source ?? 'bank';

  const transactions: Transaction[] = SANDBOX_LEDGERS[app].map(
    ([date, merchant, amount, category], index) => ({
      id: `sb-${app}-${index + 1}`,
      source,
      merchant,
      amount,
      currency: 'HKD',
      date,
      category,
    }),
  );

  return {
    id: source,
    /** Provenance label surface — never claims a live connection. */
    status: 'Sandbox' as const,
    getTransactions(): Transaction[] {
      return transactions;
    },
  };
}

export function buildSandboxLedgerMeta(app: SandboxApp, connectedAt: string) {
  const option = getSandboxApp(app);
  const source = option?.source ?? 'bank';
  const realPath = option?.realPath ?? 'No public sandbox API.';

  return {
    id: source,
    name: source === 'bank' ? 'Bank Account' : 'Octopus Card',
    provider: `Simulated ledger — ${option?.name ?? 'App'}`,
    status: 'Sandbox' as const,
    transport: 'Sandbox connection (no network call)',
    lastSyncedAt: connectedAt,
    realIntegrationPath: `${realPath} FINA.AI does not call it in this demo — the connection is simulated.`,
  };
}
