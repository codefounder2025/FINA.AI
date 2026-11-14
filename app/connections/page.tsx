'use client';

import { useMemo } from 'react';
import ConnectAppPanel from '@/components/ConnectAppPanel';
import ImportCsvButton from '@/components/ImportCsvButton';
import ProvenanceBadge from '@/components/ProvenanceBadge';
import SandboxBrokerPanel from '@/components/SandboxBrokerPanel';
import StatementUploadButton from '@/components/StatementUploadButton';
import { usePortfolio } from '@/components/PortfolioProvider';
import { bankConnectorMeta } from '@/lib/connectors/bankConnector';
import { buildCsvConnectorMeta } from '@/lib/connectors/csvBrokerAdapter';
import { octopusConnectorMeta } from '@/lib/connectors/octopusConnector';
import { investmentConnectorMeta } from '@/lib/connectors/investmentConnector';
import { buildSandboxConnectorMeta } from '@/lib/connectors/sandboxBrokerAdapter';
import { buildSandboxLedgerMeta, type LedgerSourceId } from '@/lib/connectors/sandboxLedgerAdapter';
import { buildStatementConnectorMeta } from '@/lib/connectors/statementParser';
import { SOURCE_COLORS } from '@/lib/format';

function formatSync(iso: string): string {
  return new Date(iso).toLocaleString('en-HK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Hong_Kong',
  });
}

const STATUS_STYLES: Record<string, string> = {
  CSV: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800',
  Sandbox:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  Statement:
    'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800',
  mock: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
};

const LEDGER_SOURCES: LedgerSourceId[] = ['bank', 'octopus'];

export default function ConnectionsPage() {
  const { imported, sandbox, ledgers, provenance, provenanceAt } = usePortfolio();

  // The investment portfolio and the two spending ledgers can all change at
  // runtime; each card's meta follows whatever currently owns that source.
  const connectors = useMemo(() => {
    const investment =
      provenance.investment === 'csv' && imported
        ? buildCsvConnectorMeta(imported.fileName, imported.importedAt)
        : provenance.investment === 'sandbox' && sandbox
          ? buildSandboxConnectorMeta(sandbox.broker, sandbox.connectedAt)
          : investmentConnectorMeta;

    const forLedger = (id: LedgerSourceId) => {
      const ledger = ledgers[id];
      if (ledger?.kind === 'statement') {
        return buildStatementConnectorMeta(id, ledger.label, ledger.at);
      }
      if (ledger?.kind === 'sandbox' && ledger.app) {
        return buildSandboxLedgerMeta(ledger.app, ledger.at);
      }
      return id === 'bank' ? bankConnectorMeta : octopusConnectorMeta;
    };

    return [forLedger('bank'), forLedger('octopus'), investment];
  }, [provenance, imported, sandbox, ledgers]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Connections</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Every source below is backed by a mock adapter returning realistic JSON — there are no
          live bank, Octopus or brokerage credentials in this demo. Any source can be replaced at
          runtime with data you supply: a PDF statement for the bank or Octopus card, a broker CSV
          for the portfolio, or a simulated sandbox app connection. Each card lists the status, the
          last sync time, and the real-world integration path this connector is designed for.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {connectors.map((connector) => {
          const isInvestment = connector.id === 'investment';
          const ledgerId = LEDGER_SOURCES.find((id) => id === connector.id);
          const statusStyle = STATUS_STYLES[connector.status] ?? STATUS_STYLES.mock;

          return (
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
                <span
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyle}`}
                >
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
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Provenance</dt>
                  <dd>
                    <ProvenanceBadge
                      kind={provenance[connector.id]}
                      date={provenanceAt[connector.id]}
                    />
                  </dd>
                </div>
              </dl>

              {isInvestment && (
                <>
                  <ImportCsvButton className="mt-4 w-full justify-center" />
                  <SandboxBrokerPanel />
                </>
              )}

              {ledgerId && (
                <div className="mt-4 space-y-2">
                  <StatementUploadButton source={ledgerId} />
                  <ConnectAppPanel source={ledgerId} />
                </div>
              )}

              <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">Real integration path: </span>
                {connector.realIntegrationPath}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Why everything is mocked</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Production access to bank account data requires an AISP licence and customer consent;
          Octopus publishes no public transaction API; and HK brokerages have no standard consented
          API. For a 48-hour hackathon none of these are reachable, so FINA.AI ships a connector
          architecture where each source is a drop-in adapter. Swapping a mock adapter for a real
          one is a single-file change — the aggregator, insights and UI never need to know. The PDF
          statement import and the broker CSV import are real today; the app connections are
          simulated and labelled as such.
        </p>
      </section>
    </div>
  );
}
