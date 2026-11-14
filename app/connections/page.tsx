import { bankConnectorMeta } from '@/lib/connectors/bankConnector';
import { octopusConnectorMeta } from '@/lib/connectors/octopusConnector';
import { investmentConnectorMeta } from '@/lib/connectors/investmentConnector';
import { SOURCE_COLORS } from '@/lib/format';

const CONNECTORS = [bankConnectorMeta, octopusConnectorMeta, investmentConnectorMeta];

function formatSync(iso: string): string {
  return new Date(iso).toLocaleString('en-HK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Hong_Kong',
  });
}

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Connections</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Every source below is backed by a mock adapter returning realistic JSON — there are no
          live bank, Octopus or brokerage credentials in this demo. Each card lists the status, the
          last sync time, and the real-world integration path this connector is designed for.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {CONNECTORS.map((connector) => (
          <article
            key={connector.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[connector.id] }}
                />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{connector.name}</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800">
                {connector.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{connector.provider}</p>

            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Transport</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">{connector.transport}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Last sync</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">
                  {formatSync(connector.lastSyncedAt)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-300">Real integration path: </span>
              {connector.realIntegrationPath}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Why everything is mocked</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Production access to bank account data requires an AISP licence and customer consent;
          Octopus publishes no public transaction API; and HK brokerages have no standard consented
          API. For a 48-hour hackathon none of these are reachable, so FINA.AI ships a connector
          architecture where each source is a drop-in adapter. Swapping a mock adapter for a real
          one is a single-file change — the aggregator, insights and UI never need to know.
        </p>
      </section>
    </div>
  );
}
