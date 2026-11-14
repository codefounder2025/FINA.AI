'use client';

import { useMemo, useState } from 'react';
import InsightPanel from '@/components/InsightPanel';
import InvestmentDonut from '@/components/InvestmentDonut';
import ProvenanceBadge from '@/components/ProvenanceBadge';
import SourceToggle from '@/components/SourceToggle';
import SpendingBarChart from '@/components/SpendingBarChart';
import SummaryCard from '@/components/SummaryCard';
import UpcomingBills from '@/components/UpcomingBills';
import { usePortfolio } from '@/components/PortfolioProvider';
import {
  buildSnapshot,
  getTransactionsForSources,
  getUpcomingBills,
  type SourceToggle as SourceToggleState,
} from '@/lib/aggregator';
import { formatHKD, formatPercent } from '@/lib/format';

const DEFAULT_TOGGLE: SourceToggleState = { bank: true, octopus: true, investment: true };

export default function DashboardPage() {
  const [toggle, setToggle] = useState<SourceToggleState>(DEFAULT_TOGGLE);
  const { provenance, provenanceAt, overrides } = usePortfolio();

  // Every derived number comes from here — nothing is hardcoded downstream.
  // Imported statements, sandbox connections and hand-entered transactions are
  // passed as overrides; the provider omits the keys for untouched sources, so
  // the mock adapters keep owning them and every verified figure is unchanged.
  const snapshot = useMemo(() => buildSnapshot(toggle, overrides), [toggle, overrides]);

  const bills = useMemo(
    () => getUpcomingBills(getTransactionsForSources(snapshot.enabledSources, overrides)),
    [snapshot.enabledSources, overrides],
  );

  const spendingChange =
    snapshot.previousMonthSpending > 0
      ? ((snapshot.currentMonthSpending - snapshot.previousMonthSpending) /
          snapshot.previousMonthSpending) *
        100
      : null;

  const unrealised = snapshot.investmentValue - snapshot.investmentCost;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Unified Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {snapshot.monthLabel} vs {snapshot.previousMonthLabel} · all figures in HKD · mock data
          </p>
        </div>
        <SourceToggle value={toggle} onChange={setToggle} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Net Position"
          value={formatHKD(snapshot.netPosition)}
          accent="blue"
          hint={`Cash flow ${formatHKD(snapshot.totals.net)} + investments ${formatHKD(
            snapshot.investmentValue,
          )}`}
        />
        <SummaryCard
          label="Monthly Spending"
          value={formatHKD(snapshot.currentMonthSpending)}
          accent="orange"
          delta={spendingChange}
          hint={`${snapshot.monthLabel}: ${formatPercent(snapshot.bankShare)} bank · ${formatPercent(
            snapshot.octopusShare,
          )} Octopus`}
        />
        <SummaryCard
          label="Investment Value"
          value={formatHKD(snapshot.investmentValue)}
          accent="green"
          badge={
            <ProvenanceBadge
              kind={provenance.investment}
              date={provenanceAt.investment}
            />
          }
          hint={
            snapshot.enabledSources.includes('investment')
              ? `${formatPercent(snapshot.investmentShare)} of net position · ${
                  unrealised >= 0 ? '+' : '-'
                }${formatHKD(Math.abs(unrealised))} unrealised`
              : 'Investments source is switched off'
          }
        />
      </section>

      <InsightPanel snapshot={snapshot} />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingBarChart
            spendingByCategory={snapshot.spendingByCategory}
            monthLabel={snapshot.monthLabel}
          />
        </div>
        <InvestmentDonut
          allocation={snapshot.allocation}
          total={snapshot.investmentValue}
        />
      </section>

      <UpcomingBills bills={bills} total={snapshot.upcomingBillsTotal} />
    </div>
  );
}
