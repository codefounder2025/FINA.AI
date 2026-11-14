'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { BrokerCsvRow } from '@/lib/connectors/csvBrokerAdapter';
import { createCsvBrokerAdapter } from '@/lib/connectors/csvBrokerAdapter';
import type { Holding } from '@/lib/connectors/types';

/**
 * Session-scoped portfolio import.
 *
 * Deliberately in-memory only: there is no database and no localStorage, so an
 * imported CSV is gone on reload and the demo always starts from the mock
 * figures. Nothing here mutates the mock adapters — an import is passed to
 * `buildSnapshot` as an override, never written back.
 */

export interface ImportedPortfolio {
  rows: BrokerCsvRow[];
  holdings: Holding[];
  fileName: string;
  /** ISO timestamp of the import. */
  importedAt: string;
}

interface PortfolioContextValue {
  imported: ImportedPortfolio | null;
  importRows: (rows: BrokerCsvRow[], fileName: string) => void;
  clearImport: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [imported, setImported] = useState<ImportedPortfolio | null>(null);

  const importRows = useCallback((rows: BrokerCsvRow[], fileName: string) => {
    // Go through the adapter so the imported data arrives in exactly the same
    // shape the mock connector returns.
    const adapter = createCsvBrokerAdapter(rows);

    setImported({
      rows,
      holdings: adapter.getHoldings(),
      fileName,
      importedAt: new Date().toISOString(),
    });
  }, []);

  const clearImport = useCallback(() => setImported(null), []);

  const value = useMemo(
    () => ({ imported, importRows, clearImport }),
    [imported, importRows, clearImport],
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
