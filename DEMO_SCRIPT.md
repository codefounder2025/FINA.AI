# FINA.AI — 90-second demo script

Setup before you present:

```bash
npm install && npm run dev
```

Open `http://localhost:3000`. Have `/`, `/connections`, `/dashboard` and `/transactions` in mind —
the nav bar at the top links all four.

---

## 0:00 – 0:12 · Landing (`/`)

**Say:** "FINA.AI. Hong Kong students have money in three places — a bank account, an Octopus card
and a small investment portfolio. Nobody has one view. So we built one."

**Do:** Point at the headline *"Your money, finally in one place."* Click **Open Dashboard**.

---

## 0:12 – 0:25 · Connections (`/connections`) — *the honesty beat*

**Say:** "Before the numbers, the plumbing. Three sources, and all three run on a bundled sample
dataset — we did not pretend to have bank credentials in 48 hours."

**Do:** Sweep across the three cards. Each shows **Sample**, the last sync time, and one
line of the real integration path — HKMA IADS for the bank, manual import for Octopus, CSV for
brokerages.

---

## 0:25 – 0:45 · Dashboard, all sources on (`/dashboard`)

**Do:** Click **Dashboard** in the nav.

**Say:** "One screen. Net position HK$161,097. This month's spending HK$12,913 — 98% through the
bank, 2% through Octopus. Investments HK$124,290, which is 77% of net worth."

**Do:** Point at the bar chart (spending by category) and the donut (allocation by asset class).
Scroll to **Upcoming bills** — HK$10,454 of recurring payments detected from the history.

---

## 0:45 – 1:05 · The AI Insight Panel — *the moment that justifies the name*

**Do:** Scroll back to the **Insight panel**. It reads:

- *"Bills & rent are 80% of this month's spending (HK$10,318) — fixed costs dominate your budget."*
- *"Shopping is 49% above September 2026 — the biggest swing in your spending."*
- *"77% of your net position (HK$161,097) is invested — Crypto is the largest slice at 34%."*

**Say:** "This is the layer that makes it FINA.AI and not a spreadsheet. And notice the badge:
**Rule-based fallback** — we have no AI key in this build, so the panel falls back to deterministic
insight logic. Give it a key and the same route returns LLM-written insights instead. The demo
cannot break either way."

---

## 1:05 – 1:20 · Toggle a source — *the proof*

**Do:** Click the **Octopus** pill in the source toggle. Hold the pose.

**Say:** "Watch every number, both charts *and the insight text* move together."

- Net Position → **HK$161,568**
- Monthly spending → **HK$12,633**, split now reads **100% bank · 0% Octopus**
- Bills share → **80% → 82%**, shopping swing → **49% → 51%**

**Do:** Click **Investment** off.

**Say:** "And with investments gone, net position drops to cash only — HK$36,807 — the donut goes
empty, and the third insight swaps to the Octopus line. Nothing here is hardcoded; it's all
recomputed from the aggregated dataset."

---

## 1:20 – 1:30 · Transactions (`/transactions`)

**Do:** Click **Transactions**. Filter **Source → Octopus**.

**Say:** "One unified feed with colour-coded sources — blue bank, orange Octopus. Filter by source,
category or date. That's FINA.AI."

---

### Toggle cheat-sheet (if a judge asks you to prove it twice)

| Toggle | Net Position | Monthly Spending | Third insight |
|--------|--------------|------------------|---------------|
| All on | HK$161,097 | HK$12,913 | "77% … is invested — Crypto is the largest slice at 34%." |
| Octopus off | HK$161,568 | HK$12,633 | unchanged (bills/shopping shares shift) |
| Investments off | HK$36,807 | HK$12,913 | "Octopus accounts for 2.2% of this month's spending …" |
| Bank off | HK$123,820 | HK$280 | "100% of your net position (HK$123,820) is invested …" |

Reloading the page resets the toggle to all-on (state is in memory only, by design).
