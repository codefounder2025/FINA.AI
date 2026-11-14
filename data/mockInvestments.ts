import type { Holding } from '@/lib/connectors/types';

/**
 * Mock brokerage + wallet holdings for a Hong Kong student: two HK-listed
 * stocks, a local tracker ETF, an S&P 500 ETF, two crypto positions and two
 * cash balances. Prices are realistic HKD levels.
 *
 * marketValue = quantity * currentPrice
 * costValue   = quantity * costBasis
 */
export const mockHoldings: Holding[] = [
  {
    id: 'hold-0700',
    symbol: '0700.HK',
    name: 'Tencent Holdings',
    assetClass: 'stock',
    quantity: 50,
    currentPrice: 420,
    costBasis: 350,
  },
  {
    id: 'hold-9988',
    symbol: '9988.HK',
    name: 'Alibaba Group',
    assetClass: 'stock',
    quantity: 80,
    currentPrice: 98,
    costBasis: 110,
  },
  {
    id: 'hold-2800',
    symbol: '2800.HK',
    name: 'Tracker Fund of Hong Kong',
    assetClass: 'etf',
    quantity: 300,
    currentPrice: 19.5,
    costBasis: 18.2,
  },
  {
    id: 'hold-voo',
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    assetClass: 'etf',
    quantity: 6,
    currentPrice: 4100,
    costBasis: 3600,
  },
  {
    id: 'hold-btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    assetClass: 'crypto',
    quantity: 0.05,
    currentPrice: 620000,
    costBasis: 480000,
  },
  {
    id: 'hold-eth',
    symbol: 'ETH',
    name: 'Ethereum',
    assetClass: 'crypto',
    quantity: 0.4,
    currentPrice: 28000,
    costBasis: 22000,
  },
  {
    id: 'hold-cash-hkd',
    symbol: 'HKD',
    name: 'HKD Cash Balance',
    assetClass: 'cash',
    quantity: 1,
    currentPrice: 15000,
    costBasis: 15000,
  },
  {
    id: 'hold-cash-usd',
    symbol: 'USD',
    name: 'USD Cash Balance (HKD equivalent)',
    assetClass: 'cash',
    quantity: 1,
    currentPrice: 7800,
    costBasis: 7800,
  },
];
