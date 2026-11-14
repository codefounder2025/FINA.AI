import Papa from 'papaparse';
import type { AssetClass, Holding } from './types';

/**
 * CSV broker adapter.
 *
 * A brokerage has no standard consented API in Hong Kong, so the realistic
 * import path is a CSV export. This module is the *only* place that understands
 * CSV: it parses untrusted user input into normalised `Holding[]`, which is the
 * same shape the bundled adapter returns. Everything downstream — the aggregator,
 * the insights, the UI — is unchanged.
 *
 * Expected header (case-insensitive, order-independent):
 *   ticker, quantity, avgCost          <- required
 *   currency, currentPrice, assetClass, name   <- optional
 */

/** Upload ceiling. Kept identical to the API route's request cap. */
export const MAX_CSV_BYTES = 16 * 1024;

export interface BrokerCsvRow {
  ticker: string;
  quantity: number;
  avgCost: number;
  currency: string;
  /** Falls back to avgCost when the column is absent. */
  currentPrice: number;
  assetClass: AssetClass;
  name: string;
}

export interface CsvParseResult {
  rows: BrokerCsvRow[];
  /** Non-empty means the file was rejected in full — nothing is imported. */
  errors: string[];
}

/**
 * Canonical column name -> the normalised (lowercased) key used for row access.
 * Headers are lowercased while parsing, so camel-case names must be looked up
 * in their normalised form.
 */
const COLUMN = {
  ticker: 'ticker',
  quantity: 'quantity',
  avgCost: 'avgcost',
  currency: 'currency',
  currentPrice: 'currentprice',
  assetClass: 'assetclass',
  name: 'name',
} as const;

/** Column names as they appear to the user, and in error messages. */
const REQUIRED_COLUMNS = ['ticker', 'quantity', 'avgCost'] as const;

const CRYPTO_TICKERS = new Set([
  'BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'XRP', 'DOGE', 'AVAX',
  'MATIC', 'LTC', 'BNB', 'USDT', 'USDC',
]);

const ETF_HINTS = ['ETF', 'VOO', 'SPY', 'QQQ', 'IVV', 'VTI', 'ARKK', '2800', '3033', '2828'];

const ASSET_CLASSES = new Set<string>(['stock', 'etf', 'crypto', 'cash']);

/**
 * Best-effort asset-class inference so an imported portfolio still produces a
 * meaningful allocation donut. An explicit `assetClass` column always wins.
 */
function inferAssetClass(ticker: string, currency: string): AssetClass {
  const t = ticker.toUpperCase();

  if (t === 'CASH') return 'cash';
  if (CRYPTO_TICKERS.has(t) || /^(BTC|ETH|SOL|USDT|USDC)/.test(t)) return 'crypto';
  if (ETF_HINTS.some((hint) => t.includes(hint))) return 'etf';

  // Anything else with a recognisable instrument suffix is treated as a stock;
  // the explicit `assetClass` column exists for cases this gets wrong.
  void currency;
  return 'stock';
}

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  // Strip an optional currency prefix and thousands separators only — never
  // arbitrary letters, which would corrupt values like "1K".
  const cleaned = String(value)
    .trim()
    .replace(/^HKD\s*/i, '')
    .replace(/^HK\$\s*/i, '')
    .replace(/^\$\s*/, '')
    .replace(/[,\s]/g, '');

  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parses CSV text into validated rows. Returns *all* problems it finds rather
 * than only the first, so the user can fix the file in one pass.
 */
export function parseBrokerCsv(text: string): CsvParseResult {
  const errors: string[] = [];

  if (text.trim() === '') {
    return { rows: [], errors: ['The file is empty.'] };
  }

  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    for (const error of parsed.errors.slice(0, 3)) {
      errors.push(`Row ${(error.row ?? 0) + 2}: ${error.message}`);
    }
  }

  const headers = parsed.meta.fields?.map((f) => f.trim().toLowerCase()) ?? [];
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(COLUMN[column]));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ` +
          `Expected a header row like: ${REQUIRED_COLUMNS.join(', ')},currency`,
      ],
    };
  }

  const data = parsed.data.filter((row) =>
    Object.values(row).some((value) => String(value ?? '').trim() !== ''),
  );

  if (data.length === 0) {
    return { rows: [], errors: ['No data rows found below the header.'] };
  }

  const rows: BrokerCsvRow[] = [];
  const seen = new Set<string>();

  data.forEach((raw, index) => {
    const line = index + 2; // +1 for zero-index, +1 for the header row
    const ticker = String(raw[COLUMN.ticker] ?? '').trim().toUpperCase();

    if (ticker === '') {
      errors.push(`Row ${line}: "ticker" is empty.`);
      return;
    }

    if (seen.has(ticker)) {
      errors.push(`Row ${line}: duplicate ticker "${ticker}". Combine the rows into one.`);
      return;
    }

    const quantity = parseNumber(raw[COLUMN.quantity]);
    if (quantity === null) {
      errors.push(`Row ${line}: "quantity" is not a number ("${raw[COLUMN.quantity] ?? ''}").`);
      return;
    }
    if (quantity <= 0) {
      errors.push(`Row ${line}: "quantity" must be greater than zero.`);
      return;
    }

    const avgCost = parseNumber(raw[COLUMN.avgCost]);
    if (avgCost === null) {
      errors.push(`Row ${line}: "avgCost" is not a number ("${raw[COLUMN.avgCost] ?? ''}").`);
      return;
    }
    if (avgCost < 0) {
      errors.push(`Row ${line}: "avgCost" cannot be negative.`);
      return;
    }

    const currency = String(raw[COLUMN.currency] ?? 'HKD').trim().toUpperCase() || 'HKD';
    if (currency !== 'HKD') {
      errors.push(
        `Row ${line}: currency "${currency}" is not supported — the portfolio model is HKD-only.`,
      );
      return;
    }

    const rawCurrent = String(raw[COLUMN.currentPrice] ?? '').trim();
    let currentPrice = avgCost;
    if (rawCurrent !== '') {
      const parsedCurrent = parseNumber(rawCurrent);
      if (parsedCurrent === null || parsedCurrent < 0) {
        errors.push(`Row ${line}: "currentPrice" is not a positive number ("${rawCurrent}").`);
        return;
      }
      currentPrice = parsedCurrent;
    }

    const rawClass = String(raw[COLUMN.assetClass] ?? '').trim().toLowerCase();
    if (rawClass !== '' && !ASSET_CLASSES.has(rawClass)) {
      errors.push(
        `Row ${line}: "assetClass" must be one of stock, etf, crypto, cash (got "${rawClass}").`,
      );
      return;
    }

    seen.add(ticker);
    rows.push({
      ticker,
      quantity,
      avgCost,
      currency,
      currentPrice,
      assetClass: rawClass === '' ? inferAssetClass(ticker, currency) : (rawClass as AssetClass),
      name: String(raw[COLUMN.name] ?? '').trim() || ticker,
    });
  });

  if (errors.length > 0) return { rows: [], errors };

  return { rows, errors: [] };
}

/** Normalises parsed rows into the shared `Holding` shape. */
export function toHoldings(rows: BrokerCsvRow[]): Holding[] {
  return rows.map((row) => ({
    id: `csv-${row.ticker}`,
    symbol: row.ticker,
    name: row.name,
    assetClass: row.assetClass,
    quantity: row.quantity,
    currentPrice: row.currentPrice,
    costBasis: row.avgCost,
  }));
}

/**
 * The adapter itself. Implements the same `getHoldings(): Holding[]` contract
 * as the bundled investment connector, so `buildSnapshot` accepts it unchanged.
 */
export function createCsvBrokerAdapter(rows: BrokerCsvRow[]) {
  const holdings = toHoldings(rows);

  return {
    id: 'investment' as const,
    /** Provenance label surface — never claims a live connection. */
    status: 'CSV' as const,
    getHoldings(): Holding[] {
      return holdings;
    },
  };
}

export function buildCsvConnectorMeta(fileName: string, importedAt: string) {
  return {
    id: 'investment' as const,
    name: 'Investments',
    provider: `Imported portfolio — ${fileName}`,
    status: 'CSV' as const,
    transport: 'Broker CSV import',
    lastSyncedAt: importedAt,
    realIntegrationPath:
      'No standard consented brokerage API in HK; real path is CSV / manual import or a future multi-broker aggregator.',
  };
}
