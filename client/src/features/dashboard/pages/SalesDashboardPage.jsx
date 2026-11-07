import { lazy, Suspense, useState } from "react";

import { useDashboardOverview } from "../hooks/useDashboardOverview.js";

import DashboardHero from "../components/DashboardHero.jsx";
import DashboardKpiCards from "../components/DashboardKpiCards.jsx";
import RecentLeadsTable from "../components/RecentLeadsTable.jsx";
import QuickActions from "../components/QuickActions.jsx";

const MonthlyLeadTrend = lazy(
  () => import("../components/MonthlyLeadTrend.jsx")
);

const PriorityDistribution = lazy(
  () => import("../components/PriorityDistribution.jsx")
);

const actionMessages = {
  "add-lead":
    "The Add New Lead workflow will be connected when the Lead Management screen is implemented.",
  "analyze-bill":
    "The Bill Analysis workflow will be connected when its screen is implemented.",
  "create-quotation":
    "The Quotation Builder workflow will be connected when its screen is implemented.",
};

function DashboardLoading() {
  return (
    <div className="space-y-5" aria-label="Loading dashboard">
      <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-gray-200"
          />
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
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
  const [actionNotice, setActionNotice] = useState("");

  function handleQuickAction(actionId) {
    setActionNotice(
      actionMessages[actionId] ??
        "This action is not available yet."
    );
  }

  if (isPending) {
    return <DashboardLoading />;
  }

  if (isError) {
    return <DashboardError onRetry={refetch} />;
  }

  return (
    <div className="min-w-0 space-y-5">

      <DashboardHero />

      <DashboardKpiCards kpis={data.kpis} />

      <Suspense
        fallback={
          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        }
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <MonthlyLeadTrend data={data.monthlyLeadTrend} />
          <PriorityDistribution data={data.priorityDistribution} />
        </div>
      </Suspense>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)]">
        <RecentLeadsTable leads={data.recentLeads} />

        <QuickActions onAction={handleQuickAction} />
      </div>

      {actionNotice && (
        <div
          role="status"
          className="flex items-start justify-between gap-4 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-muted shadow-sm"
        >
          <p>{actionNotice}</p>

          <button
            type="button"
            onClick={() => setActionNotice("")}
            aria-label="Dismiss action message"
            className="shrink-0 font-semibold text-brand-emerald hover:text-brand-forest"
          >
            Dismiss
          </button>
        </div>
      )}

      <p className="text-xs leading-5 text-brand-muted">
        Dashboard figures and chart values are illustrative demonstration
        data, not verified company performance. Lead priority is a follow-up
        indicator; a low-priority lead is not automatically rejected.
      </p>

    </div>
  );
}

export default SalesDashboardPage;