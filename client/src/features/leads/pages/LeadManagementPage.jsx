import { useState } from "react";

import {
  useLeadsOverview,
  useLeads,
} from "../hooks/useLeads.js";

import LeadManagementHero from "../components/LeadManagementHero.jsx";
import LeadKpiCards from "../components/cards/LeadKpiCards.jsx";
import LeadStatusTabs from "../components/filters/LeadStatusTabs.jsx";
import LeadFilters from "../components/filters/LeadFilters.jsx";
import LeadsTable from "../components/table/LeadsTable.jsx";
import LeadDetailsPanel from "../components/details/LeadDetailsPanel.jsx";

function LeadsPageLoading() {
  return (
    <div className="space-y-5" aria-label="Loading lead management">
      <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-gray-200"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
    </div>
  );
}

function LeadsPageError({ onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-brand-text">
        Lead information could not be loaded
      </h2>

      <p className="mt-2 text-sm text-brand-muted">
        Something went wrong while retrieving lead information.
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

function LeadManagementPage() {
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [locationValue, setLocationValue] = useState("all");
  const [priorityValue, setPriorityValue] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [notice, setNotice] = useState("");

  const {
    data,
    isPending,
    isError,
    refetch,
  } = useLeadsOverview();

  const {
    data: filteredLeads,
    isPending: isLeadsPending,
    isError: isLeadsError,
  } = useLeads({
    status: activeStatus,
    search: searchValue,
    location: locationValue,
    priority: priorityValue,
    page: currentPage,
    pageSize: pageSize,
  });

  if (isPending || isLeadsPending) {
    return <LeadsPageLoading />;
  }

  if (isError || isLeadsError) {
    return <LeadsPageError onRetry={refetch} />;
  }

  const selectedStatus = data.statuses.find(
    (status) => status.id === activeStatus
  );

  const selectedLead =
    filteredLeads.items.find(
      (lead) => lead.id === selectedLeadId
    ) ??
    (selectedLeadId === null
      ? filteredLeads.items[0] ?? null
      : null);

  const resetLeadSelection = () => {
    setSelectedLeadId(null);
    setIsDetailsOpen(true);
    setNotice("");
    setCurrentPage(1);
  };

  const handleStatusChange = (nextStatus) => {
    setActiveStatus(nextStatus);
    resetLeadSelection();
  };

  const handleAddLead = () => {
    setNotice(
      "The Add New Lead form will be connected in a later implementation step."
    );
  };

  const handleCreateQuotation = (lead) => {
    setNotice(
      `Quotation workflow for ${lead.name} will be connected when the Quotation Builder is implemented.`
    );
  };

  const handleScheduleVisit = (lead) => {
    setNotice(
      `Site visit scheduling for ${lead.name} will be connected in a later implementation step.`
    );
  };

  return (
    <div className="min-w-0 space-y-5">
      <LeadManagementHero />

      <LeadKpiCards
        summary={data.summary}
        growth={data.summary.growth}
      />

      <p className="text-xs leading-5 text-brand-muted">
        {data.dataLabel}. Summary figures and growth percentages are
        illustrative demonstration values, not verified company performance.
      </p>

      <LeadStatusTabs
        statuses={data.statuses}
        statusCounts={data.statusCounts}
        activeStatus={activeStatus}
        onStatusChange={handleStatusChange}
      />

      <LeadFilters
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          resetLeadSelection();
        }}
        locationValue={locationValue}
        locationOptions={[
          { value: "all", label: "All Locations" },
          { value: "not-provided", label: "Not provided" },
        ]}
        onLocationChange={(value) => {
          setLocationValue(value);
          resetLeadSelection();
        }}
        priorityValue={priorityValue}
        priorities={data.priorities}
        onPriorityChange={(value) => {
          setPriorityValue(value);
          resetLeadSelection();
        }}
        statusValue={activeStatus}
        statuses={data.statuses}
        onStatusChange={handleStatusChange}
        onAddLead={handleAddLead}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        <div className="min-w-0">
          <LeadsTable
            leads={filteredLeads.items}
            selectedLeadId={selectedLead?.id ?? null}
            onSelectLead={(lead) => {
              setSelectedLeadId(lead.id);
              setIsDetailsOpen(true);
              setNotice("");
            }}
            pagination={filteredLeads.pagination}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>

        {isDetailsOpen && (
          <LeadDetailsPanel
            lead={selectedLead}
            onClose={() => setIsDetailsOpen(false)}
            onCreateQuotation={handleCreateQuotation}
            onScheduleVisit={handleScheduleVisit}
          />
        )}
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white p-4 text-sm text-brand-muted shadow-sm"
        >
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="shrink-0 font-semibold text-brand-emerald"
          >
            Dismiss
          </button>
        </div>
      )}

      <p className="text-xs leading-5 text-brand-muted">
        Only three demonstration customer records are currently available.
        Missing customer information is not inferred or automatically populated.
      </p>
    </div>
  );
}

export default LeadManagementPage;