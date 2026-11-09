import { lazy, Suspense, useState } from "react";
import { useDashboardOverview } from "../hooks/useDashboardOverview.js";
import DashboardHero from "../components/DashboardHero.jsx";
import DashboardKpiCards from "../components/DashboardKpiCards.jsx";
import DashboardAnalyticsSummary from "../components/DashboardAnalyticsSummary.jsx";
import RecentLeadsTable from "../components/RecentLeadsTable.jsx";
import QuickActions from "../components/QuickActions.jsx";

const MonthlyLeadTrend = lazy(() => import("../components/MonthlyLeadTrend.jsx"));
const PriorityDistribution = lazy(() => import("../components/PriorityDistribution.jsx"));

function DashboardLoading() {
  return (
    <div className="space-y-5" aria-label="Loading live dashboard analytics">
      <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-gray-200" />)}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

function DashboardError({ onRetry, message }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-brand-text">Dashboard analytics could not be loaded</h2>
      <p className="mt-2 text-sm text-brand-muted">{message || "The live analytics service could not return your authorized dashboard data."}</p>
      <button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-emerald-hover">Try again</button>
    </section>
  );
}

function SalesDashboardPage() {
  const [months, setMonths] = useState(12);
  const { data, isPending, isFetching, isError, error, refetch } = useDashboardOverview(months);

  if (isPending) return <DashboardLoading />;
  if (isError) return <DashboardError onRetry={refetch} message={error?.message} />;

  return (
    <div className="min-w-0 space-y-5">
      <DashboardHero />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-brand-text">Live performance overview</p>
          <p className="mt-1 text-[11px] text-brand-muted">{data.dataLabel} · {data.scope === "homeowner" ? "Homeowner" : "Sales Staff"} scope · {data.periodLabel}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-brand-text">
          <span>Reporting period</span>
          <select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-brand-emerald">
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </label>
        {isFetching && <span role="status" className="text-[10px] text-brand-muted">Refreshing analytics…</span>}
      </div>

      <DashboardKpiCards kpis={data.kpis} />

      <DashboardAnalyticsSummary
        summary={{
          ...data.summary,
          highPriority: data.kpis.find((item) => item.id === "high-priority")?.value ?? 0,
        }}
        reportingNotes={data.reportingNotes}
      />

      <Suspense fallback={<div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-gray-200" /><div className="h-80 animate-pulse rounded-2xl bg-gray-200" /></div>}>
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <MonthlyLeadTrend data={data.monthlyLeadTrend} periodLabel={data.periodLabel} />
          <PriorityDistribution data={data.priorityDistribution} />
        </div>
      </Suspense>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)]">
        <RecentLeadsTable leads={data.recentLeads} />
        <QuickActions />
      </div>

      <p className="text-xs leading-5 text-brand-muted">
        Dashboard figures are calculated from live, role-scoped application records for the selected creation-date range. Lead priority is a follow-up indicator; a low-priority lead is not automatically rejected.
      </p>
    </div>
  );
}

export default SalesDashboardPage;
