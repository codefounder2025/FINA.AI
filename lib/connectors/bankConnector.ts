import type { Transaction } from './types';
import { mockBankTransactions } from '@/data/mockBank';

/**
 * Bank connector.
 *
 * Today this is a mock adapter over `data/mockBank.ts`. It mimics a current
 * account feed (salary credits, rent, dining, utilities, subscriptions) that a
 * real integration would surface through the HKMA IADS / Open API sandbox once
 * the customer grants consent. The rest of the app only ever sees the
 * normalised `Transaction[]`, so swapping this adapter for a real one is a
 * single-file change.
 */
export function getBankTransactions(): Transaction[] {
  return mockBankTransactions;
}

export const bankConnectorMeta = {
  id: 'bank' as const,
  name: 'Bank Account',
  provider: 'HSBC / BOCHK — IADS Sandbox (Mock)',
  status: 'Connected (Mock)' as const,
  transport: 'Account Information API (consented)',
  lastSyncedAt: '2026-11-14T09:12:00+08:00',
  realIntegrationPath:
    'HKMA IADS / Open API sandbox with customer-consented account data (AISP licence required for production).',
};
