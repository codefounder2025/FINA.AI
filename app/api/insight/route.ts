import { NextResponse } from 'next/server';
import type { AssetClass, Category, Source, Transaction } from '@/lib/connectors/types';
import { getRuleBasedInsights, type InsightInput } from '@/lib/insights';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * LLM insight route.
 *
 * Primary path : if AI_API_KEY is set, ask an OpenAI-compatible chat model for
 *                2-3 plain-language insights derived from the aggregated data.
 * Fallback path: no key, or the call fails -> return rule-based insights so the
 *                panel is never empty. The response always states its source.
 *
 * Provider selection:
 *   OpenAI   -> AI_API_KEY only
 *   DeepSeek -> AI_API_KEY + AI_BASE_URL=https://api.deepseek.com/v1 + AI_MODEL=deepseek-chat
 *
 * This is the only public, unauthenticated write endpoint in the app, so the
 * request body is treated as untrusted: it is size-capped, rate-limited, and
 * normalised into a strict numeric/text shape before anything else runs.
 */

const SYSTEM_PROMPT = [
  'You are FINA.AI, a friendly financial analyst for Hong Kong university students.',
  "You receive aggregated numbers from a student's bank account, Octopus card and investment portfolio.",
  'Write 2-3 short, concrete, plain-language insights (max 28 words each).',
  'Every insight MUST cite a real number or percentage from the data provided.',
  'Never invent figures. Never use markdown, bullet characters, or headings — plain sentences only.',
  'Return each insight on its own line, without numbering.',
].join(' ');

// ------------------------------------------------------------------ limits

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TEXT = 120;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 30;

const CATEGORY_KEYS = [
  'food', 'transport', 'shopping', 'bills',
  'entertainment', 'education', 'income', 'other',
] as const;
const ASSET_KEYS = ['stock', 'etf', 'crypto', 'cash'] as const;
const SOURCE_KEYS = ['bank', 'octopus', 'investment'] as const;

const CATEGORY_SET = new Set<string>(CATEGORY_KEYS);
const SOURCE_SET = new Set<string>(SOURCE_KEYS);

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    if (rateBuckets.size > 5_000) {
      for (const [existingKey, value] of rateBuckets) {
        if (now > value.resetAt) rateBuckets.delete(existingKey);
      }
    }
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_MAX_REQUESTS;
}

// ------------------------------------------------------------------ sanitising

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 100) / 100
    : 0;
}

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, MAX_TEXT)
    : fallback;
}

function toNumberRecord<K extends string>(value: unknown, keys: readonly K[]): Record<K, number> {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const out = {} as Record<K, number>;
  for (const key of keys) out[key] = toNumber(source[key]);
  return out;
}

function sanitiseLargestExpense(value: unknown): Transaction | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const merchant = toText(raw.merchant, '');
  if (!merchant) return null;

  return {
    id: 'sanitised',
    source:
      typeof raw.source === 'string' && SOURCE_SET.has(raw.source)
        ? (raw.source as Source)
        : 'bank',
    merchant,
    amount: toNumber(raw.amount),
    currency: 'HKD',
    date:
      typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
        ? raw.date
        : '1970-01-01',
    category:
      typeof raw.category === 'string' && CATEGORY_SET.has(raw.category)
        ? (raw.category as Category)
        : 'other',
  };
}

/** Turns any untrusted value into a strict `InsightInput`, or null if unusable. */
function sanitiseSnapshot(value: unknown): InsightInput | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const snapshot: InsightInput = {
    enabledSources: Array.isArray(raw.enabledSources)
      ? raw.enabledSources.filter(
          (item): item is Source => typeof item === 'string' && SOURCE_SET.has(item),
        )
      : [],
    monthLabel: toText(raw.monthLabel, 'This month'),
    previousMonthLabel: toText(raw.previousMonthLabel, 'Last month'),
    currentMonthSpending: toNumber(raw.currentMonthSpending),
    spendingByCategory: toNumberRecord(raw.spendingByCategory, CATEGORY_KEYS),
    previousSpendingByCategory: toNumberRecord(raw.previousSpendingByCategory, CATEGORY_KEYS),
    momChangeByCategory: toNumberRecord(raw.momChangeByCategory, CATEGORY_KEYS),
    netPosition: toNumber(raw.netPosition),
    investmentValue: toNumber(raw.investmentValue),
    investmentShare: toNumber(raw.investmentShare),
    octopusShare: toNumber(raw.octopusShare),
    allocation: toNumberRecord<AssetClass>(raw.allocation, ASSET_KEYS),
    largestExpense: sanitiseLargestExpense(raw.largestExpense),
  };

  const hasContent =
    snapshot.enabledSources.length > 0 ||
    snapshot.currentMonthSpending > 0 ||
    snapshot.netPosition !== 0;

  return hasContent ? snapshot : null;
}

// ------------------------------------------------------------------ LLM

function buildUserPrompt(snapshot: InsightInput): string {
  const summary = {
    month: snapshot.monthLabel,
    previousMonth: snapshot.previousMonthLabel,
    enabledSources: snapshot.enabledSources,
    monthlySpendingHKD: Math.round(snapshot.currentMonthSpending),
    spendingByCategoryHKD: snapshot.spendingByCategory,
    monthOverMonthChangePercent: snapshot.momChangeByCategory,
    netPositionHKD: Math.round(snapshot.netPosition),
    investmentValueHKD: Math.round(snapshot.investmentValue),
    investmentShareOfNetPositionPercent: Math.round(snapshot.investmentShare * 1000) / 10,
    octopusShareOfSpendingPercent: Math.round(snapshot.octopusShare * 1000) / 10,
    allocationHKD: snapshot.allocation,
    largestExpense: snapshot.largestExpense
      ? {
          merchant: snapshot.largestExpense.merchant,
          amountHKD: Math.abs(snapshot.largestExpense.amount),
        }
      : null,
  };
  return `Aggregated data (HKD, sample dataset):\n${JSON.stringify(summary, null, 2)}\n\nWrite the insights now.`;
}

function parseInsights(content: string): string[] {
  return content
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
        .replace(/\*\*/g, '')
        .trim(),
    )
    .filter((line) => line.length > 12)
    .slice(0, 3);
}

// ------------------------------------------------------------------ handler

export async function POST(request: Request) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 },
    );
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const snapshot = sanitiseSnapshot(
    parsed && typeof parsed === 'object' ? (parsed as { snapshot?: unknown }).snapshot : undefined,
  );

  if (!snapshot) {
    return NextResponse.json(
      { error: 'Missing or invalid "snapshot" in request body.' },
      { status: 400 },
    );
  }

  const fallback = getRuleBasedInsights(snapshot);
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      insights: fallback,
      source: 'rule-based',
      reason: 'AI_API_KEY not configured',
    });
  }

  try {
    const baseUrl = (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = process.env.AI_MODEL ?? 'gpt-4o-mini';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 320,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(snapshot) },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    const insights = parseInsights(content);

    if (insights.length === 0) {
      throw new Error('LLM returned no usable insights');
    }

    return NextResponse.json({ insights, source: 'ai', model });
  } catch (error) {
    return NextResponse.json({
      insights: fallback,
      source: 'rule-based',
      reason: error instanceof Error ? error.message : 'Unknown LLM error',
    });
  }
}
