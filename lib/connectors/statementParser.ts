import type { Category, Transaction } from './types';
import type { LedgerSourceId } from './sandboxLedgerAdapter';

/**
 * Bank / Octopus statement parser.
 *
 * A PDF statement is the only realistic export a Hong Kong bank or Octopus
 * offers, so this module turns the *text lines* of such a statement into
 * normalised `Transaction[]` — the same shape the mock adapters return.
 *
 * Layouts differ between banks, so this is deliberately a tolerant line
 * parser rather than a format-specific one. It never invents data: a line it
 * cannot read is counted as skipped, and a file it cannot read at all is
 * rejected with an explanation instead of a guess.
 */

/** Upload ceiling for a statement PDF. Larger than the CSV cap: PDFs are big. */
export const MAX_PDF_BYTES = 2 * 1024 * 1024;

export interface StatementRow {
  /** ISO date, e.g. 2026-11-03 */
  date: string;
  merchant: string;
  /** negative = money out, positive = money in */
  amount: number;
  category: Category;
}

export interface StatementParseResult {
  rows: StatementRow[];
  /** Non-empty means nothing was imported. */
  errors: string[];
  /** Data-looking lines that could not be read. Informational only. */
  skipped: number;
}

// ------------------------------------------------------------------ dates

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const ISO_DATE = /(\d{4})-(\d{1,2})-(\d{1,2})/;
const DMY_SLASH = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
const DMY_DASH = /(\d{1,2})-(\d{1,2})-(\d{4})/;
const DMY_TEXT = /(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})/;

const pad = (n: number) => String(n).padStart(2, '0');

/** Builds an ISO date, rejecting impossible days (e.g. 31 February). */
function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

interface DateMatch {
  iso: string;
  index: number;
  length: number;
}

function findDate(line: string): DateMatch | null {
  const iso = ISO_DATE.exec(line);
  if (iso) {
    const value = toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    if (value) return { iso: value, index: iso.index, length: iso[0].length };
  }

  const slash = DMY_SLASH.exec(line);
  if (slash) {
    const value = toIso(Number(slash[3]), Number(slash[2]), Number(slash[1]));
    if (value) return { iso: value, index: slash.index, length: slash[0].length };
  }

  const dash = DMY_DASH.exec(line);
  if (dash) {
    const value = toIso(Number(dash[3]), Number(dash[2]), Number(dash[1]));
    if (value) return { iso: value, index: dash.index, length: dash[0].length };
  }

  const text = DMY_TEXT.exec(line);
  if (text) {
    const month = MONTHS[text[2].toLowerCase()];
    if (month) {
      const value = toIso(Number(text[3]), month, Number(text[1]));
      if (value) return { iso: value, index: text.index, length: text[0].length };
    }
  }

  return null;
}

// ------------------------------------------------------------------ amounts

/**
 * A statement amount always has two decimals, which is what keeps bus route
 * numbers ("104") and reference codes out of the match. A trailing `CR`/`DR`
 * marker is captured when the statement uses one.
 */
const DECIMAL_AMOUNT = /(-)?\s?(?:HK\$|\$)?\s?(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})(?:\s*(CR|DR))?/gi;
/** Fallback for statements that print whole dollars with no decimals. */
const TRAILING_INTEGER = /(-)?\s?(?:HK\$|\$)?\s?(\d{1,3}(?:,\d{3})*|\d{1,7})\s*(CR|DR)?\s*$/i;

interface AmountMatch {
  value: number;
  negative: boolean;
  marker: 'CR' | 'DR' | null;
  index: number;
  length: number;
}

function findAmount(line: string): AmountMatch | null {
  // The amount column precedes the running-balance column on every statement
  // layout seen, so the FIRST decimal match is the transaction amount.
  DECIMAL_AMOUNT.lastIndex = 0;
  let match: RegExpExecArray | null = DECIMAL_AMOUNT.exec(line);
  if (match) {
    const value = Number(match[2].replace(/,/g, ''));
    if (Number.isFinite(value)) {
      return {
        value,
        negative: match[1] === '-',
        marker: (match[3]?.toUpperCase() as 'CR' | 'DR') ?? null,
        index: match.index,
        length: match[0].length,
      };
    }
  }

  const integer = TRAILING_INTEGER.exec(line);
  if (integer) {
    const value = Number(integer[2].replace(/,/g, ''));
    if (Number.isFinite(value) && value > 0) {
      return {
        value,
        negative: integer[1] === '-',
        marker: (integer[3]?.toUpperCase() as 'CR' | 'DR') ?? null,
        index: integer.index,
        length: integer[0].length,
      };
    }
  }

  return null;
}

// ------------------------------------------------------------------ categories

/** Merchant keyword -> category. First match wins, so order is significant. */
const CATEGORY_HINTS: Array<[RegExp, Category]> = [
  [/salary|payroll|deposit|refund|rebate|cashback|interest|dividend/i, 'income'],
  [/mtr|kmb|citybus|bus route|ferry|tram|taxi|uber|transport|octopus.*top.?up/i, 'transport'],
  [/rent|landlord|electric|clp|towngas|gas bill|water|utility|mobile|smarTone|china mobile|broadband|internet|insurance/i, 'bills'],
  [/netflix|spotify|disney|cinema|broadway|theatre|concert|steam|game|hkbn.*tv/i, 'entertainment'],
  [/coursera|udemy|university|tuition|textbook|course|education/i, 'education'],
  [/starbucks|pacific coffee|mcdonald|fairwood|cafe|coffee|restaurant|supermarket|wellcome|parknshop|deliveroo|foodpanda|keeta|bakery|noodle|dining/i, 'food'],
  [/uniqlo|h&m|zara|watson|mannings|japan home|hmv|log.?on|broadway.*camera|shop|store|mall/i, 'shopping'],
];

export function inferCategory(merchant: string, amount: number): Category {
  if (amount > 0) return 'income';
  for (const [pattern, category] of CATEGORY_HINTS) {
    if (pattern.test(merchant)) return category;
  }
  return 'other';
}

// ------------------------------------------------------------------ line parser

function cleanMerchant(text: string): string {
  return text
    .replace(/[|*_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—:.,]+|[\s\-–—:.,]+$/g, '')
    .trim();
}

/**
 * Statements print a running-balance column after the amount, which would
 * otherwise be glued onto the description ("ParknShop 1,234.56"). Only a
 * money-formatted token is stripped, so a description like "Bus 104" is safe.
 */
const TRAILING_BALANCE = /(?:\s|^)(?:HK\$|\$)?\s?-?\d{1,3}(?:,\d{3})*\.\d{2}\s*(?:CR|DR)?$/i;

/**
 * Pulls one transaction out of one statement line. Returns `null` when the
 * line carries no usable date or amount, so the caller can count it as skipped
 * rather than guess.
 */
export function parseStatementLine(line: string): StatementRow | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;

  const date = findDate(trimmed);
  if (!date) return null;

  const amount = findAmount(trimmed);
  if (!amount || amount.value === 0) return null;

  // Remove the two fields we consumed, leaving the description in the middle.
  const rest = (
    trimmed.slice(0, date.index) +
    ' ' +
    trimmed.slice(date.index + date.length, amount.index) +
    ' ' +
    trimmed.slice(amount.index + amount.length)
  );
  const merchant = cleanMerchant(rest.replace(TRAILING_BALANCE, ''));
  if (merchant.length < 2) return null;

  // Sign precedence: an explicit marker beats a minus sign, which beats the
  // income-keyword heuristic, which beats the default of "this is a spend".
  let signed = amount.value;
  if (amount.marker === 'DR') signed = -Math.abs(amount.value);
  else if (amount.marker === 'CR') signed = Math.abs(amount.value);
  else if (amount.negative) signed = -Math.abs(amount.value);
  else if (/salary|payroll|deposit|refund|rebate|cashback|interest|dividend/i.test(merchant)) {
    signed = Math.abs(amount.value);
  } else signed = -Math.abs(amount.value);

  return {
    date: date.iso,
    merchant,
    amount: signed,
    category: inferCategory(merchant, signed),
  };
}

/**
 * Parses every line of an extracted statement. Rows are returned sorted oldest
 * first, matching how the mock ledgers are written.
 */
export function parseStatementLines(
  lines: string[],
  options: { source: LedgerSourceId },
): StatementParseResult {
  const rows: StatementRow[] = [];
  let skipped = 0;

  for (const line of lines) {
    if (line.trim().length < 4) continue;
    const row = parseStatementLine(line);
    if (row) rows.push(row);
    else skipped += 1;
  }

  if (rows.length === 0) {
    return {
      rows: [],
      skipped,
      errors: [
        `No transactions could be read from this ${options.source === 'bank' ? 'bank' : 'Octopus'} statement.`,
        'FINA.AI reads text-based PDFs. Scanned or image-only statements (and password-protected files) have no extractable text.',
        'Download the statement again from your bank or Octopus app as a text PDF, or add entries by hand on the Transactions page.',
      ],
    };
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows, skipped, errors: [] };
}

// ------------------------------------------------------------------ adapter

/**
 * The adapter. Implements the same `getTransactions(): Transaction[]` contract
 * as the mock bank / Octopus connectors, so `buildSnapshot` accepts it
 * unchanged.
 */
export function createStatementAdapter(source: LedgerSourceId, rows: StatementRow[]) {
  const transactions: Transaction[] = rows.map((row, index) => ({
    id: `stmt-${source}-${index + 1}`,
    source,
    merchant: row.merchant,
    amount: row.amount,
    currency: 'HKD',
    date: row.date,
    category: row.category,
  }));

  return {
    id: source,
    /** Provenance label surface — never claims a live connection. */
    status: 'Statement' as const,
    getTransactions(): Transaction[] {
      return transactions;
    },
  };
}

export function buildStatementConnectorMeta(
  source: LedgerSourceId,
  fileName: string,
  importedAt: string,
) {
  return {
    id: source,
    name: source === 'bank' ? 'Bank Account' : 'Octopus Card',
    provider: `Imported statement — ${fileName}`,
    status: 'Statement' as const,
    transport: 'PDF statement import',
    lastSyncedAt: importedAt,
    realIntegrationPath:
      source === 'bank'
        ? 'HKMA IADS / Open API sandbox with customer-consented account data (AISP licence required for production). Until then, a PDF statement import is the realistic path.'
        : 'No public transaction API today; a PDF/eStatement import is the realistic path until a future Octopus OR3.0 open API.',
  };
}
