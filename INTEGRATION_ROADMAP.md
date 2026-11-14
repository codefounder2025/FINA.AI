# FINA.AI — Integration Roadmap

FINA.AI is built as a **connector architecture**: each data source is an adapter that normalises
its output into shared `Transaction` / `Holding` types, and nothing downstream — aggregator,
insights, UI — knows where the data came from. In this build every adapter runs on a bundled
sample dataset. This document describes what it takes to make each one real.

---

## Bank — HKMA IADS / Open API sandbox with consented account data

The sample adapter in `lib/connectors/bankConnector.ts` returns a current-account feed in the shape a
Hong Kong bank would expose: salary credits, rent transfers, card spending and utility debits, each
with a merchant, amount, date and a category we derive. In production this data comes through the
**HKMA's IADS (Interbank Account Data Sharing)** scheme — the territory's open banking framework —
where a customer explicitly consents to share a specific account with a specific licensed party for
a fixed period. Building it for real means becoming (or partnering with) a licensed **AISP**
(Account Information Service Provider), completing the HKMA sandbox onboarding, integrating the
consent flow (redirect-based authorisation plus a consent dashboard where the user can see and
revoke access), and handling the ongoing obligations that come with it: token refresh, per-account
scopes, re-consent on expiry, and audit logging of every data access. The adapter would swap its
sample function for an authenticated API client; because it already returns normalised
`Transaction[]`, nothing else in the app changes.

## Octopus — no public transaction API; manual import today, OR3.0 possibly later

The sample adapter in `lib/connectors/octopusConnector.ts` stands in for a **manual import**. Octopus
does not publish a public transaction API — the card's history is designed to be viewed by the
cardholder in the Octopus app or website, not consumed by third parties, and Octopus has not opened
a general-purpose read API to developers. So the realistic production path is a **user-driven
import**: the user exports or screenshots their Octopus statement, and FINA.AI parses it with an
OCR/CSV pipeline that maps rows to merchants, amounts, dates and categories (transport for MTR, bus
and taxi; food and shopping for coffee shops and convenience stores). The forward-looking option is
**Octopus OR3.0**, the next-generation open platform — if it ships a consented transaction API with
a proper developer programme and per-user authorisation, the same adapter could be pointed at it and
Octopus spending would become as automatic as the bank feed. Until then, the honest status is
`Sample` on top of a manual import, which is exactly what the Connections page shows.

## Investments — no standard consented brokerage API; CSV or manual import, or a future aggregator

The sample adapter in `lib/connectors/investmentConnector.ts` returns a **portfolio snapshot** —
quantity, current price and cost basis per holding — which is what a CSV or manual entry would give
us. Hong Kong has no single consented brokerage API: securities accounts sit behind individual
brokers and banks, each with its own (or no) developer programme, so an open-banking-style
aggregation standard for investments does not yet exist here the way AISP does for deposit accounts.
The realistic production path is therefore **CSV / manual import**: the user exports their holdings
from each broker and wallet, and FINA.AI maps symbols, asset classes (stock / ETF / crypto / cash)
and prices into `Holding[]`, then periodically revalues positions from a market-data provider for
the symbols it recognises. A future multi-broker aggregator — if HK regulators extend open banking
to investments, or a regional aggregator covers HK brokerages — could replace the import with a
live feed. Because the adapter already returns normalised `Holding[]`, that upgrade is contained to
this one file.

---

## Why this matters for the demo

The connector boundary is the whole point: **the bundled sample is a stand-in for the integration,
not a shortcut around it.** The types, the normalisation, the aggregation and the insight logic are
all production-shaped. When a real IADS consent flow, an Octopus import parser or a brokerage CSV
loader lands, each one replaces a single adapter and every number on the dashboard — including the
AI insights — keeps working unchanged.
