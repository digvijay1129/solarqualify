import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../authentication/context/AuthContext.jsx";
import {
  useLeadsOverview, useLeads, useLeadDetails, useLeadQualification,
  leadsQueryKeys,
} from "../hooks/useLeads.js";
import { claimLead, qualifyLead } from "../services/leads.service.js";
import LeadManagementHero from "../components/LeadManagementHero.jsx";
import LeadKpiCards from "../components/cards/LeadKpiCards.jsx";
import LeadStatusTabs from "../components/filters/LeadStatusTabs.jsx";
import LeadFilters from "../components/filters/LeadFilters.jsx";
import LeadsTable from "../components/table/LeadsTable.jsx";
import LeadDetailsPanel from "../components/details/LeadDetailsPanel.jsx";

function LeadsPageLoading() {
  return <div className="space-y-5" aria-label="Loading lead management"><div className="h-28 animate-pulse rounded-2xl bg-gray-200" /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-gray-200" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-gray-200" /></div>;
}

function LeadsPageError({ onRetry, message }) {
  return <section className="rounded-2xl border border-red-200 bg-white p-8 text-center"><h2 className="text-lg font-semibold text-brand-text">Lead information could not be loaded</h2><p className="mt-2 text-sm text-brand-muted">{message || "Something went wrong while retrieving live lead information."}</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white">Try again</button></section>;
}

function LeadManagementPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [locationValue, setLocationValue] = useState("all");
  const [priorityValue, setPriorityValue] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);
  const [confirmedLeadId, setConfirmedLeadId] = useState(null);

  const overviewQuery = useLeadsOverview();
  const listFilters = {
    status: activeStatus,
    search: searchValue,
    location: locationValue,
    priority: priorityValue,
    page: currentPage,
    pageSize,
  };
  const leadsQuery = useLeads(listFilters);
  const detailQuery = useLeadDetails(selectedLeadId);
  const qualificationQuery = useLeadQualification(selectedLeadId);

  const refreshAll = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      leadsQuery.refetch(),
    ]);
  };

  const claimMutation = useMutation({
    mutationFn: (leadId) => claimLead(leadId, user.id),
    onSuccess: async (_lead, leadId) => {
      setConfirmedLeadId(leadId);
      setActionNotice({ tone: "success", message: "Lead assigned to your Sales Staff account." });
      await queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all });
    },
    onError: (error) => setActionNotice({ tone: "error", message: error?.message || "Lead could not be assigned." }),
  });

  const qualifyMutation = useMutation({
    mutationFn: (leadId) => qualifyLead(leadId),
    onSuccess: async () => {
      setActionNotice({ tone: "success", message: "Lead qualification score recalculated and saved." });
      await queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all });
    },
    onError: (error) => setActionNotice({ tone: "error", message: error?.message || "Lead could not be scored. Claim it first if it is unassigned." }),
  });

  if (overviewQuery.isPending || leadsQuery.isPending) return <LeadsPageLoading />;
  if (overviewQuery.isError || leadsQuery.isError) {
    return <LeadsPageError onRetry={refreshAll} message={overviewQuery.error?.message || leadsQuery.error?.message} />;
  }

  const overview = overviewQuery.data;
  const filteredLeads = leadsQuery.data;
  const selectedLead = detailQuery.data ?? filteredLeads.items.find((lead) => lead.id === selectedLeadId) ?? null;

  const resetSelection = () => {
    setSelectedLeadId(null);
    setIsDetailsOpen(true);
    setActionNotice(null);
    setConfirmedLeadId(null);
    setCurrentPage(1);
  };

  const handleStatusChange = (nextStatus) => {
    setActiveStatus(nextStatus);
    resetSelection();
  };

  const setFilter = (setter, value) => {
    setter(value);
    resetSelection();
  };

  return (
    <div className="min-w-0 space-y-5">
      <LeadManagementHero />
      <LeadKpiCards summary={overview.summary} growth={overview.summary.growth} />
      <p className="text-xs leading-5 text-brand-muted">{overview.dataLabel} · {overview.dataNote || "Statistics are scoped to your authorised lead records."}</p>
      <LeadStatusTabs statuses={overview.statuses} statusCounts={overview.statusCounts} activeStatus={activeStatus} onStatusChange={handleStatusChange} />
      <LeadFilters
        searchValue={searchValue}
        onSearchChange={(value) => { setSearchValue(value); resetSelection(); }}
        locationValue={locationValue}
        locationOptions={[{ value: "all", label: "All Locations" }, { value: "not-provided", label: "Not provided" }]}
        onLocationChange={(value) => setFilter(setLocationValue, value)}
        priorityValue={priorityValue}
        priorities={overview.priorities}
        onPriorityChange={(value) => setFilter(setPriorityValue, value)}
        statusValue={activeStatus}
        statuses={overview.statuses}
        onStatusChange={handleStatusChange}
        onAddLead={refreshAll}
        refreshing={overviewQuery.isFetching || leadsQuery.isFetching}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <LeadsTable
            leads={filteredLeads.items}
            selectedLeadId={selectedLead?.id ?? null}
            onSelectLead={(lead) => { setSelectedLeadId(lead.id); setIsDetailsOpen(true); setActionNotice(null); setConfirmedLeadId(null); }}
            pagination={filteredLeads.pagination}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
        {isDetailsOpen && (
          <LeadDetailsPanel
            lead={selectedLead}
            qualification={qualificationQuery.data}
            qualificationLoading={qualificationQuery.isPending}
            detailLoading={detailQuery.isFetching}
            detailError={detailQuery.isError ? detailQuery.error?.message : null}
            onRetryDetails={() => void detailQuery.refetch()}
            onClose={() => setIsDetailsOpen(false)}
            onClaim={() => selectedLeadId && claimMutation.mutate(selectedLeadId)}
            onQualify={() => selectedLeadId && qualifyMutation.mutate(selectedLeadId)}
            claiming={claimMutation.isPending}
            qualifying={qualifyMutation.isPending}
            canQualify={confirmedLeadId === selectedLeadId}
            actionNotice={actionNotice}
          />
        )}
      </div>
      <p className="text-xs leading-5 text-brand-muted">Only leads assigned to your Sales Staff account and unassigned leads are returned by the backend. Scoring is explainable and supports follow-up; a low-priority lead is not automatically rejected. Site-visit scheduling and customer notification are not provided by these APIs.</p>
    </div>
  );
}

export default LeadManagementPage;
