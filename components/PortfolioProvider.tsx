'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createCsvBrokerAdapter, type BrokerCsvRow } from '@/lib/connectors/csvBrokerAdapter';
import {
  createSandboxBrokerAdapter,
  type SandboxBroker,
} from '@/lib/connectors/sandboxBrokerAdapter';
import type { Holding } from '@/lib/connectors/types';
import type { Provenance } from '@/components/ProvenanceBadge';

/**
 * Session-scoped portfolio state.
 *
 * Two things can replace the mock portfolio: a CSV import, or a simulated
 * broker connection. They are tracked separately so the Connections page can
 * report on each honestly, but only one owns the dashboard at a time — whichever
 * the user did most recently.
 *
 * Everything is in-memory: there is no database and no localStorage, so a
 * reload always returns to the mock figures. Nothing here mutates the mock
 * adapters; an alternative portfolio is passed to `buildSnapshot` as an
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

type ActiveKind = 'csv' | 'sandbox';

interface PortfolioContextValue {
  imported: ImportedPortfolio | null;
  sandbox: SandboxConnection | null;
  /** Holdings the dashboard should use; undefined means the mock adapter. */
  activeHoldings: Holding[] | undefined;
  provenance: Provenance;
  /** ISO timestamp backing the provenance badge, when there is one. */
  provenanceAt: string | undefined;
  importRows: (rows: BrokerCsvRow[], fileName: string) => void;
  clearImport: () => void;
  connectSandbox: (broker: SandboxBroker) => void;
  disconnectSandbox: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [imported, setImported] = useState<ImportedPortfolio | null>(null);
  const [sandbox, setSandbox] = useState<SandboxConnection | null>(null);
  const [active, setActive] = useState<ActiveKind | null>(null);

  const importRows = useCallback((rows: BrokerCsvRow[], fileName: string) => {
    // Go through the adapter so imported data arrives in exactly the same shape
    // the mock connector returns.
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
  // is still open, otherwise to the mock adapter.
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

  // Disconnecting returns to the mock state, unless a CSV import is still
  // loaded, in which case that becomes the most recent remaining source.
  const disconnectSandbox = useCallback(() => {
    setSandbox(null);
    setActive((current) => (current === 'sandbox' ? (imported ? 'csv' : null) : current));
  }, [imported]);

  const activeHoldings = useMemo(() => {
    if (active === 'csv') return imported?.holdings;
    if (active === 'sandbox') return sandbox?.holdings;
    return undefined;
  }, [active, imported, sandbox]);

  const provenance: Provenance =
    active === 'csv' && imported
      ? 'csv'
      : active === 'sandbox' && sandbox
        ? 'sandbox'
        : 'mock';

  const provenanceAt =
    provenance === 'csv' ? imported?.importedAt : provenance === 'sandbox' ? sandbox?.connectedAt : undefined;

  const value = useMemo(
    () => ({
      imported,
      sandbox,
      activeHoldings,
      provenance,
      provenanceAt,
      importRows,
      clearImport,
      connectSandbox,
      disconnectSandbox,
    }),
    [
      imported,
      sandbox,
      activeHoldings,
      provenance,
      provenanceAt,
      importRows,
      clearImport,
      connectSandbox,
      disconnectSandbox,
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
