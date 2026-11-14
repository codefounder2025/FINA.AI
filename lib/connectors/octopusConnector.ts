import type { Transaction } from './types';
import { mockOctopusTransactions } from '@/data/mockOctopus';

/**
 * Octopus connector.
 *
 * Octopus publishes no public transaction API, so in production this data can
 * only come from a manual export (Octopus app / website statement) or, in the
 * future, the OR3.0 open API. This mock adapter stands in for that manual
 * import.
 */
export function getOctopusTransactions(): Transaction[] {
  return mockOctopusTransactions;
}

export const octopusConnectorMeta = {
  id: 'octopus' as const,
  name: 'Octopus Card',
  provider: 'Octopus — Manual Import (Mock)',
  status: 'Connected (Mock)' as const,
  transport: 'Manual CSV / statement import',
  lastSyncedAt: '2026-11-14T08:40:00+08:00',
  realIntegrationPath:
    'No public transaction API today; real path is a manual statement/CSV import or a future Octopus OR3.0 open API.',
};
