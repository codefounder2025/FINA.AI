'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createCsvBrokerAdapter, type BrokerCsvRow } from '@/lib/connectors/csvBrokerAdapter';
import {
  createSandboxBrokerAdapter,
  type SandboxBroker,
} from '@/lib/connectors/sandboxBrokerAdapter';
import {
  createSandboxLedgerAdapter,
  getSandboxApp,
  type LedgerSourceId,
  type SandboxApp,
} from '@/lib/connectors/sandboxLedgerAdapter';
import { createStatementAdapter, type StatementRow } from '@/lib/connectors/statementParser';
import { getBankTransactions } from '@/lib/connectors/bankConnector';
import { getOctopusTransactions } from '@/lib/connectors/octopusConnector';
import type { Category, Holding, Source, Transaction } from '@/lib/connectors/types';
import type { SnapshotOverrides } from '@/lib/aggregator';
import type { Provenance } from '@/components/ProvenanceBadge';

/**
 * Session-scoped portfolio state.
 *
 * Three things can replace a bundled sample source: a CSV import or sandbox
 * connection for the investment portfolio, and a PDF statement import or
 * sandbox connection for each spending source. On top of that the user can add
 * individual transactions by hand.
 *
 * Everything is in-memory: there is no database and no localStorage, so a
 * reload always returns to the bundled figures. Nothing here mutates the
 * bundled adapters; alternative data is passed to `buildSnapshot` as an
 * override.
 */

export interface ImportedPortfolio {
  rows: BrokerCsvRow[];
  holdings: Holding[];
  fileName: string;
  /** ISO timestamp of the import. */
  importedAt: string;
}

export interface SandboxConnection {
  broker: SandboxBroker;
  holdings: Holding[];
  /** ISO timestamp of the connection. */
  connectedAt: string;
}

/** A replacement transaction ledger for one spending source. */
export interface LedgerImport {
  kind: 'sandbox' | 'statement';
  /** App name for a sandbox connection, file name for a statement import. */
  label: string;
  /** Which app was simulated, for the sandbox case only. */
  app?: SandboxApp;
  transactions: Transaction[];
  /** ISO timestamp of the import/connection. */
  at: string;
}

export interface ManualTransactionInput {
  source: LedgerSourceId;
  merchant: string;
  /** Signed: negative = expense, positive = income. */
  amount: number;
  date: string;
  category: Category;
}

type ActiveKind = 'csv' | 'sandbox';

interface PortfolioContextValue {
  // ---- investment portfolio
  imported: ImportedPortfolio | null;
  sandbox: SandboxConnection | null;
  /** Holdings the dashboard should use; undefined means the bundled adapter. */
  activeHoldings: Holding[] | undefined;
  importRows: (rows: BrokerCsvRow[], fileName: string) => void;
  clearImport: () => void;
  connectSandbox: (broker: SandboxBroker) => void;
  disconnectSandbox: () => void;

  // ---- spending ledgers (bank + Octopus)
  ledgers: Record<LedgerSourceId, LedgerImport | null>;
  connectLedger: (source: LedgerSourceId, app: SandboxApp) => void;
  importStatement: (source: LedgerSourceId, rows: StatementRow[], fileName: string) => void;
  clearLedger: (source: LedgerSourceId) => void;

  // ---- hand-entered transactions
  manualTransactions: Transaction[];
  addManualTransaction: (input: ManualTransactionInput) => void;
  removeManualTransaction: (id: string) => void;

  // ---- derived
  provenance: Record<Source, Provenance>;
  provenanceAt: Partial<Record<Source, string>>;
  /** Everything the aggregator needs; keys are omitted for untouched sources. */
  overrides: SnapshotOverrides;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const EMPTY_LEDGERS: Record<LedgerSourceId, LedgerImport | null> = {
  bank: null,
  octopus: null,
};

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [imported, setImported] = useState<ImportedPortfolio | null>(null);
  const [sandbox, setSandbox] = useState<SandboxConnection | null>(null);
  const [active, setActive] = useState<ActiveKind | null>(null);
  const [ledgers, setLedgers] =
    useState<Record<LedgerSourceId, LedgerImport | null>>(EMPTY_LEDGERS);
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);

  const importRows = useCallback((rows: BrokerCsvRow[], fileName: string) => {
    // Go through the adapter so imported data arrives in exactly the same shape
    // the bundled connector returns.
    const adapter = createCsvBrokerAdapter(rows);

    setImported({
      rows,
      holdings: adapter.getHoldings(),
      fileName,
      importedAt: new Date().toISOString(),
    });
    setActive('csv');
  }, []);

  // Clearing an import hands the portfolio back to the sandbox connection if one
  // is still open, otherwise to the bundled adapter.
  const clearImport = useCallback(() => {
    setImported(null);
    setActive((current) => (current === 'csv' ? (sandbox ? 'sandbox' : null) : current));
  }, [sandbox]);

  const connectSandbox = useCallback((broker: SandboxBroker) => {
    const adapter = createSandboxBrokerAdapter(broker);

    setSandbox({
      broker,
      holdings: adapter.getHoldings(),
      connectedAt: new Date().toISOString(),
    });
    setActive('sandbox');
  }, []);

  // Disconnecting returns to the bundled state, unless a CSV import is still
  // loaded, in which case that becomes the most recent remaining source.
  const disconnectSandbox = useCallback(() => {
    setSandbox(null);
    setActive((current) => (current === 'sandbox' ? (imported ? 'csv' : null) : current));
  }, [imported]);

  const connectLedger = useCallback((source: LedgerSourceId, app: SandboxApp) => {
    const adapter = createSandboxLedgerAdapter(app);

    setLedgers((current) => ({
      ...current,
      [source]: {
        kind: 'sandbox',
        label: getSandboxApp(app)?.name ?? 'App',
        app,
        transactions: adapter.getTransactions(),
        at: new Date().toISOString(),
      },
    }));
  }, []);

  const importStatement = useCallback(
    (source: LedgerSourceId, rows: StatementRow[], fileName: string) => {
      const adapter = createStatementAdapter(source, rows);

      setLedgers((current) => ({
        ...current,
        [source]: {
          kind: 'statement',
          label: fileName,
          transactions: adapter.getTransactions(),
          at: new Date().toISOString(),
        },
      }));
    },
    [],
  );

  const clearLedger = useCallback((source: LedgerSourceId) => {
    setLedgers((current) => ({ ...current, [source]: null }));
  }, []);

  const addManualTransaction = useCallback((input: ManualTransactionInput) => {
    setManualTransactions((current) => [
      ...current,
      {
        id: `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        source: input.source,
        merchant: input.merchant,
        amount: input.amount,
        currency: 'HKD',
        date: input.date,
        category: input.category,
      },
    ]);
  }, []);

  const removeManualTransaction = useCallback((id: string) => {
    setManualTransactions((current) => current.filter((t) => t.id !== id));
  }, []);

  const activeHoldings = useMemo(() => {
    if (active === 'csv') return imported?.holdings;
    if (active === 'sandbox') return sandbox?.holdings;
    return undefined;
  }, [active, imported, sandbox]);

  /**
   * Untouched sources stay `undefined` so the bundled adapter keeps owning them —
   * that is what keeps every previously verified figure identical.
   */
  const overrides = useMemo<SnapshotOverrides>(() => {
    const ledgerOverride = (id: LedgerSourceId): Transaction[] | undefined => {
      const ledger = ledgers[id];
      const typed = manualTransactions.filter((t) => t.source === id);
      if (!ledger && typed.length === 0) return undefined;

      const base = ledger
        ? ledger.transactions
        : id === 'bank'
          ? getBankTransactions()
          : getOctopusTransactions();

      return [...base, ...typed];
    };

    return {
      holdings: activeHoldings,
      bank: ledgerOverride('bank'),
      octopus: ledgerOverride('octopus'),
    };
  }, [ledgers, manualTransactions, activeHoldings]);

  const provenance = useMemo<Record<Source, Provenance>>(() => {
    const investment: Provenance =
      active === 'csv' && imported
        ? 'csv'
        : active === 'sandbox' && sandbox
          ? 'sandbox'
          : 'sample';

    const forLedger = (id: LedgerSourceId): Provenance => {
      const ledger = ledgers[id];
      if (ledger) return ledger.kind === 'statement' ? 'statement' : 'sandbox';
      return manualTransactions.some((t) => t.source === id) ? 'manual' : 'sample';
    };

    return { bank: forLedger('bank'), octopus: forLedger('octopus'), investment };
  }, [active, imported, sandbox, ledgers, manualTransactions]);

  const provenanceAt = useMemo<Partial<Record<Source, string>>>(() => {
    const at: Partial<Record<Source, string>> = {};
    if (provenance.investment === 'csv') at.investment = imported?.importedAt;
    if (provenance.investment === 'sandbox') at.investment = sandbox?.connectedAt;
    if (provenance.bank === 'statement' || provenance.bank === 'sandbox') at.bank = ledgers.bank?.at;
    if (provenance.octopus === 'statement' || provenance.octopus === 'sandbox') {
      at.octopus = ledgers.octopus?.at;
    }
    return at;
  }, [provenance, imported, sandbox, ledgers]);

  const value = useMemo(
    () => ({
      imported,
      sandbox,
      activeHoldings,
      importRows,
      clearImport,
      connectSandbox,
      disconnectSandbox,
      ledgers,
      connectLedger,
      importStatement,
      clearLedger,
      manualTransactions,
      addManualTransaction,
      removeManualTransaction,
      provenance,
      provenanceAt,
      overrides,
    }),
    [
      imported,
      sandbox,
      activeHoldings,
      importRows,
      clearImport,
      connectSandbox,
      disconnectSandbox,
      ledgers,
      connectLedger,
      importStatement,
      clearLedger,
      manualTransactions,
      addManualTransaction,
      removeManualTransaction,
      provenance,
      provenanceAt,
      overrides,
    ],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioContextValue {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used inside <PortfolioProvider>');
  }
  return context;
}
