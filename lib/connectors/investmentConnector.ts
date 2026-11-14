import type { Holding } from './types';
import { sampleHoldings } from '@/data/sampleInvestments';

/**
 * Investment connector.
 *
 * There is no standard consented brokerage API across HK brokers, so this sample
 * adapter represents a portfolio snapshot the user would import via CSV/manual
 * entry (or a future aggregator). It returns normalised `Holding[]`.
 */
export function getHoldings(): Holding[] {
  return sampleHoldings;
}

export const investmentConnectorMeta = {
  id: 'investment' as const,
  name: 'Investments',
  provider: 'Brokerage / Wallet — bundled sample portfolio',
  status: 'Sample' as const,
  transport: 'CSV / manual portfolio import',
  lastSyncedAt: '2026-11-14T09:05:00+08:00',
  realIntegrationPath:
    'No standard consented brokerage API in HK; real path is CSV / manual import or a future multi-broker aggregator.',
};
