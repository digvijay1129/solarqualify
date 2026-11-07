import { lazy, Suspense } from "react";
import { useDashboardOverview } from "../hooks/useDashboardOverview.js";

import DashboardKpiCards from "../components/DashboardKpiCards.jsx";
const MonthlyLeadTrend = lazy(() => import("../components/MonthlyLeadTrend.jsx"));
const PriorityDistribution = lazy(() => import("../components/PriorityDistribution.jsx"));
import RecentLeadsTable from "../components/RecentLeadsTable.jsx";

function DashboardLoading() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div className="h-16 animate-pulse rounded-2xl bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-gray-200"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

function DashboardError({ onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-brand-text">
        Dashboard data could not be loaded
      </h2>

      <p className="mt-2 text-sm text-brand-muted">
        Something went wrong while retrieving dashboard information.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-emerald-hover"
      >
        Try again
      </button>
    </section>
  );
}

function SalesDashboardPage() {
  const { data, isPending, isError, refetch } = useDashboardOverview();

  if (isPending) {
    return <DashboardLoading />;
  }

  if (isError) {
    return <DashboardError onRetry={refetch} />;
  }

  return (
    <div className="space-y-7">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-text">
            Sales Overview
          </h2>

          <p className="mt-1 text-sm text-brand-muted">
            Monitor leads, quotations and ongoing solar projects.
          </p>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          Illustrative demo data
        </span>
      </div>

      <DashboardKpiCards kpis={data.kpis} />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <MonthlyLeadTrend data={data.monthlyLeadTrend} />
          <PriorityDistribution data={data.priorityDistribution} />
        </div>
      </Suspense>

      <RecentLeadsTable leads={data.recentLeads} />

      <p className="text-xs leading-5 text-brand-muted">
        Dashboard figures and chart values are illustrative demonstration
        data, not verified company performance. Lead priority is a follow-up
        indicator; a low-priority lead is not automatically rejected.
      </p>

    </div>
  );
}

export default SalesDashboardPage;