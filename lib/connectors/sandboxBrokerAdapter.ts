import type { Holding } from './types';

/**
 * Sandbox broker connector.
 *
 * Simulates the holdings a brokerage connection *would* return. Nothing here
 * touches the network — the portfolios are fixed constants, so the flow is
 * deterministic, works offline, and can be demoed without credentials.
 *
 * The source is always presented as "Connected (Sandbox)", never "Live".
 */

export type SandboxBroker = 'futu' | 'tiger' | 'ibkr';

export interface SandboxBrokerOption {
  id: SandboxBroker;
  name: string;
  /** What a real integration with this broker would actually require. */
  realPath: string;
}

export const SANDBOX_BROKERS: SandboxBrokerOption[] = [
  {
    id: 'futu',
    name: 'Futu Securities',
    realPath: 'Futu OpenAPI — requires a funded account and an approved API entitlement.',
  },
  {
    id: 'tiger',
    name: 'Tiger Brokers',
    realPath: 'Tiger OpenAPI — client key issued per account, plus signed request auth.',
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers',
    realPath: 'IBKR Client Portal Web API — gateway session with 2FA on every login.',
  },
];

/** Fixed, deterministic portfolios so the same broker always yields the same figures. */
const SANDBOX_PORTFOLIOS: Record<SandboxBroker, Holding[]> = {
  futu: [
    { id: 'sb-futu-0700', symbol: '0700.HK', name: 'Tencent Holdings', assetClass: 'stock', quantity: 300, currentPrice: 395, costBasis: 340 },
    { id: 'sb-futu-9988', symbol: '9988.HK', name: 'Alibaba Group', assetClass: 'stock', quantity: 200, currentPrice: 118, costBasis: 90 },
    { id: 'sb-futu-3067', symbol: '3067.HK', name: 'HS Tech ETF', assetClass: 'etf', quantity: 500, currentPrice: 12.8, costBasis: 11.5 },
  ],
  tiger: [
    { id: 'sb-tiger-aapl', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', quantity: 20, currentPrice: 1980, costBasis: 1700 },
    { id: 'sb-tiger-tsla', symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stock', quantity: 15, currentPrice: 1850, costBasis: 2100 },
    { id: 'sb-tiger-voo', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', assetClass: 'etf', quantity: 5, currentPrice: 3620, costBasis: 3100 },
  ],
  ibkr: [
    { id: 'sb-ibkr-voo', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', assetClass: 'etf', quantity: 12, currentPrice: 3620, costBasis: 3000 },
    { id: 'sb-ibkr-qqq', symbol: 'QQQ', name: 'Invesco QQQ Trust', assetClass: 'etf', quantity: 8, currentPrice: 4200, costBasis: 3800 },
    { id: 'sb-ibkr-2800', symbol: '2800.HK', name: 'Tracker Fund of Hong Kong', assetClass: 'etf', quantity: 2000, currentPrice: 21.4, costBasis: 19 },
    { id: 'sb-ibkr-btc', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', quantity: 0.08, currentPrice: 510000, costBasis: 400000 },
  ],
};

export function getSandboxBroker(broker: SandboxBroker): SandboxBrokerOption | undefined {
  return SANDBOX_BROKERS.find((option) => option.id === broker);
}

/**
 * The adapter. Implements the same `getHoldings(): Holding[]` contract as the
 * bundled and CSV connectors, so `buildSnapshot` accepts it unchanged.
 */
export function createSandboxBrokerAdapter(broker: SandboxBroker) {
  const holdings = SANDBOX_PORTFOLIOS[broker];

  return {
    id: 'investment' as const,
    status: 'Sandbox' as const,
    getHoldings(): Holding[] {
      return holdings;
    },
  };
}

export function buildSandboxConnectorMeta(broker: SandboxBroker, connectedAt: string) {
  const option = getSandboxBroker(broker);
  const provider = option?.name ?? 'Broker';
  const realPath = option?.realPath ?? 'No public sandbox API.';

  return {
    id: 'investment' as const,
    name: 'Investments',
    provider: `Simulated portfolio — ${provider}`,
    status: 'Sandbox' as const,
    transport: 'Sandbox connection (no network call)',
    lastSyncedAt: connectedAt,
    realIntegrationPath: `${realPath} FINA.AI does not call it in this demo — the connection is simulated.`,
  };
}
