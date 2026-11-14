import Link from 'next/link';

const SOURCES = [
  {
    name: 'Bank',
    tone: 'border-blue-200 bg-blue-50',
    dot: '#2563eb',
    body: 'Salary, rent, dining, utilities and subscriptions from a schema that mirrors an HKMA IADS consented account feed.',
  },
  {
    name: 'Octopus',
    tone: 'border-orange-200 bg-orange-50',
    dot: '#f97316',
    body: 'MTR, bus, taxi and convenience-store taps — the day-to-day spending that never appears on a bank statement.',
  },
  {
    name: 'Investments',
    tone: 'border-green-200 bg-green-50',
    dot: '#16a34a',
    body: 'HK stocks, ETFs, crypto and cash balances, valued in HKD and merged into a single net position.',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="pt-6 text-center sm:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
          BUHack 2.0 · FinTech track
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Your money, finally in one place.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
          FINA.AI pulls your bank account, Octopus card and investment portfolio into a single
          command center — then uses AI to explain what the numbers actually mean.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Open Dashboard
          </Link>
          <Link
            href="/connections"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            See the connections
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Demo runs entirely on mock data — no login, no live bank or Octopus credentials.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {SOURCES.map((source) => (
          <article
            key={source.name}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${source.tone}`}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: source.dot }}
              />
              <h2 className="text-sm font-semibold text-slate-900">{source.name}</h2>
              <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Mock
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{source.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">What you get</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">One unified view</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Net position, monthly spending and portfolio value in a single dashboard, with a
              combined transaction feed.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Toggle any source</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Switch Octopus or investments on and off — every number, both charts and the
              insights recompute instantly.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">AI that explains</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Plain-language insights generated from your real aggregated numbers, with a
              rule-based fallback so the panel never goes blank.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
