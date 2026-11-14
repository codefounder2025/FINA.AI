# FINA.AI

**Your money, finally in one place.**

FINA.AI is an AI-assisted financial command center for Hong Kong university students. It
aggregates **bank transactions, Octopus spending and investment holdings** into one dashboard,
then uses AI to turn the numbers into plain-language insights.

Built for **BUHack 2.0 — FinTech track**.

> **Everything runs on a bundled sample dataset.** There are no live bank, Octopus or brokerage
> credentials in this project. Every source is backed by a connector adapter that returns realistic
> JSON, and the UI labels the data as sample everywhere it appears. See
> [INTEGRATION_ROADMAP.md](./INTEGRATION_ROADMAP.md) for each source's real production path.

---

## Quick start

```bash
npm install
npm run dev
# http://localhost:3000
```

**No environment variables are required.** The AI Insight Panel falls back to a rule-based
generator automatically, so the full demo works out of the box.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run typecheck
```

---

## The demo flow

| # | Route | What it proves |
|---|-------|----------------|
| 1 | `/` | Landing page — value prop and entry point. |
| 2 | `/connections` | Three connector cards, each showing `Sample`, last sync, and its real integration path. |
| 3 | `/dashboard` | Unified dashboard: 3 summary cards, AI Insight Panel, spending bar chart, investment donut, upcoming bills. |
| 4 | `/dashboard` (toggle) | Source toggle for Bank / Octopus / Investments — **every number, both charts and the insight text recompute instantly.** |
| 5 | `/transactions` | Unified feed with source, category and date filters and colour-coded source badges. |
| 6 | `/dashboard` (AI panel) | AI insights with a guaranteed rule-based fallback; the panel labels its source. |

The full 90-second judge walkthrough is in [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

---

## File structure

```
app/
  layout.tsx                    # Root layout + nav + footer
  page.tsx                      # Landing
  globals.css                   # Tailwind entry
  dashboard/page.tsx            # Dashboard + source toggle + AI insight panel
  transactions/page.tsx         # Unified transaction list + filters
  connections/page.tsx          # Three connector cards
  api/insight/route.ts          # LLM insight route with rule-based fallback
components/
  NavBar.tsx
  SummaryCard.tsx
  SpendingBarChart.tsx          # recharts bar chart
  InvestmentDonut.tsx           # recharts donut + legend
  TransactionRow.tsx
  SourceBadge.tsx               # Bank = blue, Octopus = orange, Investment = green
  InsightPanel.tsx              # Rule-based first, upgraded by the LLM route
  UpcomingBills.tsx
  SourceToggle.tsx
lib/
  connectors/
    types.ts                    # Transaction, Holding, Source, Category, AssetClass
    bankConnector.ts            # getBankTransactions(): Transaction[]
    octopusConnector.ts         # getOctopusTransactions(): Transaction[]
    investmentConnector.ts      # getHoldings(): Holding[]
  aggregator.ts                 # Normalise + compute every derived number
  insights.ts                   # getRuleBasedInsights() — the guaranteed fallback
  format.ts                     # Currency / percent / date formatters + colour maps
data/
  sampleBank.ts                 # 30 bank rows, 2 months (Sep + Oct 2026)
  sampleOctopus.ts              # 15 Octopus rows
  sampleInvestments.ts          # 8 holdings (2 HK stocks, 2 ETFs, 2 crypto, 2 cash)
```

---

## Environment variables

All optional — see [.env.example](./.env.example).

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_API_KEY` | *(unset)* | Enables the LLM path in `/api/insight`. Unset → rule-based fallback. |
| `AI_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible gateway. |
| `AI_MODEL` | `gpt-4o-mini` | Model name. |

**OpenAI**

```bash
AI_API_KEY=sk-...
```

**DeepSeek**

```bash
AI_API_KEY=sk-...
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

The route returns `{ insights: string[], source: "ai" | "rule-based" }`. If the key is missing, the
HTTP call fails, or the model returns nothing usable, it returns the rule-based insights instead —
the panel is never empty and the demo can never break.

---

## Hand-verified totals

Sample data covers two complete calendar months: **September 2026** and **October 2026**.
Every figure below was verified against the rendered dashboard.

### Inputs

| Stream | Sep 2026 | Oct 2026 | Two-month total |
|--------|----------|----------|-----------------|
| Bank income | HK$30,500.00 | HK$31,200.00 | **HK$61,700.00** |
| Bank expenses | HK$11,789.00 | HK$12,633.30 | HK$24,422.30 |
| Octopus expenses | HK$190.80 | HK$279.70 | HK$470.50 |
| **Total expenses** | HK$11,979.80 | HK$12,913.00 | **HK$24,892.80** |

Investments: market value **HK$124,290** (cost HK$108,960 → **+HK$15,330** unrealised).
Allocation: HK Stocks HK$28,840 · ETFs HK$30,450 · Crypto HK$42,200 · Cash HK$22,800.

### Derived (dashboard, all sources on)

| Figure | Value | Check |
|--------|-------|-------|
| Total Net Position | **HK$161,097** | 61,700 − 24,892.80 = 36,807.20 cash + 124,290 investments = 161,097.20 |
| Monthly Spending (Oct) | **HK$12,913** | 12,633.30 bank + 279.70 Octopus |
| Month-over-month | **+8%** | (12,913 − 11,979.80) / 11,979.80 = +7.8% |
| Investment Value | **HK$124,290** | 77% of net position |
| Upcoming bills | **HK$10,454** | rent 9,500 + CLP 620 + China Mobile 198 + Netflix 78 + Spotify 58 |

### Source toggle (verified in a real browser)

| Toggle state | Net Position | Monthly Spending | Source split | Investment |
|--------------|--------------|------------------|--------------|------------|
| All on | HK$161,097 | HK$12,913 | 98% bank · 2% Octopus | HK$124,290 |
| Octopus off | HK$161,568 | HK$12,633 | 100% bank | HK$124,290 |
| Investments off | HK$36,807 | HK$12,913 | 98% bank · 2% Octopus | HK$0 |
| Bank off | HK$123,820 | HK$280 | 100% Octopus | HK$124,290 |

The insight text changes with the toggle, because it is regenerated from the same snapshot:

- **All on** → *"Bills & rent are 80% of this month's spending (HK$10,318) — fixed costs dominate
  your budget."* / *"Shopping is 49% above September 2026 — the biggest swing in your spending."* /
  *"77% of your net position (HK$161,097) is invested — Crypto is the largest slice at 34%."*
- **Octopus off** → bills share becomes **82%**, shopping swing becomes **51%**.
- **Investments off** → the third insight becomes the Octopus one: *"Octopus accounts for 2.2% of
  this month's spending — mostly small transit and convenience-store taps…"*
- **Bank off** → *"Transport is your biggest category at 42% of this month's spending (HK$117)."* /
  *"Dining is 144% above September 2026…"* / *"100% of your net position (HK$123,820) is invested…"*

---

## Design notes

- **Connector architecture.** `lib/connectors/*` are the only files that know a data source exists.
  Each is a drop-in adapter over bundled sample JSON; replacing one with a real API client is a
  single-file change and nothing downstream needs to move.
- **Pure aggregation.** `lib/aggregator.ts` is pure and side-effect free. `buildSnapshot(toggle)`
  is the single entry point used by both the dashboard and the insight API.
- **Fallback first.** `lib/insights.ts` runs on the client so the panel paints instantly, and the
  API route reuses the exact same function when the LLM is unavailable.
- **No client state library.** `useState` + `useMemo` only. No database, no auth, no OAuth.

## Constraints respected

No login/signup · no real bank/Octopus/brokerage API calls · no external database · no OAuth ·
no fake "live" language · works with `npm install && npm run dev` and zero env vars.
