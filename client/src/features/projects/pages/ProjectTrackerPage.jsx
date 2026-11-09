import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import ProjectTrackerHero from "../components/ProjectTrackerHero.jsx";
import ProjectMetricCards from "../components/ProjectMetricCards.jsx";
import StageWiseProgressCard from "../components/StageWiseProgressCard.jsx";
import ProjectFilters from "../components/ProjectFilters.jsx";
import ProjectsTable from "../components/ProjectsTable.jsx";
import ProjectDetailsPanel from "../components/ProjectDetailsPanel.jsx";
import UpdateProjectStageDialog from "../components/UpdateProjectStageDialog.jsx";
import ProjectFullDetailsDialog from "../components/ProjectFullDetailsDialog.jsx";
import {
  PROJECT_STAGES,
  PROJECT_STATUSES,
  issueCustomerTrackingLink,
  revokeCustomerTrackingLink,
  updateProjectLifecycle,
} from "../services/projects.service.js";
import {
  projectQueryKeys,
  useProjectDetails,
  useProjectNotifications,
  useProjects,
} from "../hooks/useProjects.js";

const initialFilters = { status: "all", stage: "all" };
const chartColors = ["#166534", "#15803D", "#22C55E", "#65A30D", "#84CC16", "#A3E635", "#4D7C0F", "#94A3B8"];

function ProjectTrackerLoading() {
  return <div className="space-y-5" aria-label="Loading live Project Tracker"><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_.95fr]"><div className="h-[620px] animate-pulse rounded-2xl bg-slate-200" /><div className="h-[620px] animate-pulse rounded-2xl bg-slate-200" /></div></div>;
}

function ProjectTrackerError({ onRetry, message }) {
  return <section className="rounded-2xl border border-red-200 bg-white p-8 text-center"><h2 className="text-lg font-bold text-brand-text">Project Tracker could not be loaded</h2><p className="mt-2 text-sm text-brand-muted">{message || "The authenticated project API could not be reached."}</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white">Try again</button></section>;
}

function ProjectTrackerPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [detailTab, setDetailTab] = useState("progress");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [fullDetailsOpen, setFullDetailsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [trackingLink, setTrackingLink] = useState(null);

  const listFilters = { ...filters, page, pageSize };
  const projectsQuery = useProjects(listFilters);
  const records = projectsQuery.data?.projects ?? [];
  const paginationData = projectsQuery.data?.pagination;

  useEffect(() => {
    if (records.length && !records.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(records[0].id);
    } else if (!records.length) {
      setSelectedProjectId(null);
    }
  }, [records, selectedProjectId]);

  const detailQuery = useProjectDetails(selectedProjectId);
  const selectedProject = detailQuery.data ?? records.find((project) => project.id === selectedProjectId) ?? null;
  const notificationsQuery = useProjectNotifications(selectedProjectId);

  const updateMutation = useMutation({
    mutationFn: ({ projectId, payload }) => updateProjectLifecycle(projectId, payload),
    onSuccess: async (project) => {
      setStageDialogOpen(false);
      setNotice({ tone: "success", message: `Project ${project.id} was updated. Its lifecycle event, audit record and simulated in-app notifications were saved.` });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(project.id) }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.notifications(project.id) }),
      ]);
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "The project lifecycle update could not be saved." }),
  });

  const issueLinkMutation = useMutation({
    mutationFn: (projectId) => issueCustomerTrackingLink(projectId),
    onSuccess: (result) => {
      setTrackingLink(result);
      setNotice({ tone: "success", message: "Customer tracking link issued. Copy and share it now; the token is only returned once and this page does not persist it." });
      if (selectedProjectId) {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(selectedProjectId) });
      }
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "A public tracking link could not be issued." }),
  });

  const revokeLinkMutation = useMutation({
    mutationFn: (projectId) => revokeCustomerTrackingLink(projectId),
    onSuccess: () => {
      setTrackingLink(null);
      setNotice({ tone: "success", message: "Customer tracking link revoked." });
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "The tracking link could not be revoked." }),
  });

  const stageCounts = useMemo(() => PROJECT_STAGES.map((stage, index) => ({
    stageId: stage.id,
    label: stage.label,
    count: records.filter((project) => project.currentStageId === stage.id).length,
    color: chartColors[index],
  })), [records]);

  if (projectsQuery.isPending) return <ProjectTrackerLoading />;
  if (projectsQuery.isError || !projectsQuery.data) {
    return <ProjectTrackerError onRetry={projectsQuery.refetch} message={projectsQuery.error?.message} />;
  }

  const totalPages = Math.max(1, paginationData?.totalPages ?? 1);
  const pagination = {
    page: paginationData?.page ?? page,
    pageSize: paginationData?.pageSize ?? pageSize,
    totalItems: paginationData?.totalItems ?? 0,
    totalPages,
    startItem: records.length ? ((paginationData?.page ?? page) - 1) * (paginationData?.pageSize ?? pageSize) + 1 : 0,
    endItem: records.length ? ((paginationData?.page ?? page) - 1) * (paginationData?.pageSize ?? pageSize) + records.length : 0,
  };

  function updateFilter(key, value) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
    setSelectedProjectId(null);
    setTrackingLink(null);
    setNotice(null);
  }

  function selectProject(projectId) {
    setSelectedProjectId(projectId);
    setDetailTab("progress");
    setTrackingLink(null);
    setNotice(null);
  }

  async function copyTrackingLink() {
    if (!trackingLink?.url) return;
    try {
      await navigator.clipboard.writeText(trackingLink.url);
      setNotice({ tone: "success", message: "Customer tracking link copied to clipboard." });
    } catch {
      setNotice({ tone: "info", message: "Clipboard access was unavailable. Select and copy the displayed tracking URL manually." });
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <ProjectTrackerHero />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div><p className="text-xs font-extrabold text-slate-900">Live project portfolio</p><p className="mt-1 text-[11px] text-slate-500">{projectsQuery.data.dataLabel} {pagination.totalItems} matching records · Page {pagination.page} of {pagination.totalPages}</p></div>
        <button type="button" onClick={() => projectsQuery.refetch()} disabled={projectsQuery.isFetching} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw size={14} className={projectsQuery.isFetching ? "animate-spin" : ""} />Refresh Projects</button>
      </div>

      <ProjectMetricCards projects={records} totalItems={pagination.totalItems} />

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(350px,.95fr)] xl:gap-5">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <ProjectFilters filters={filters} statuses={PROJECT_STATUSES} stages={PROJECT_STAGES} onChange={updateFilter} onReset={() => { setFilters(initialFilters); setPage(1); setTrackingLink(null); setNotice(null); }} />
            <StageWiseProgressCard stageCounts={stageCounts} />
          </div>
          <div className="flex flex-wrap items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] leading-5 text-blue-900">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>Stage distribution and capacity metrics describe the current page of live results. The API scopes Sales Staff to projects assigned to the signed-in user and does not expose global company portfolio totals.</span>
          </div>
          <ProjectsTable
            projects={records}
            pagination={pagination}
            selectedProjectId={selectedProject?.id}
            onSelectProject={selectProject}
            onUpdateStage={() => setStageDialogOpen(true)}
            onPageChange={(nextPage) => { setPage(nextPage); setTrackingLink(null); }}
          />
        </div>

        <ProjectDetailsPanel
          project={selectedProject}
          onUpdateStage={() => setStageDialogOpen(true)}
          onViewFullDetails={() => setFullDetailsOpen(true)}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          notifications={notificationsQuery.data ?? []}
          notificationsLoading={notificationsQuery.isPending}
          notificationsError={notificationsQuery.isError}
          onRetryNotifications={() => notificationsQuery.refetch()}
          trackingLink={trackingLink}
          onIssueTrackingLink={() => selectedProjectId && issueLinkMutation.mutate(selectedProjectId)}
          onRevokeTrackingLink={() => selectedProjectId && revokeLinkMutation.mutate(selectedProjectId)}
          onCopyTrackingLink={copyTrackingLink}
          trackingBusy={issueLinkMutation.isPending || revokeLinkMutation.isPending}
        />
      </div>

      {notice && <div role={notice.tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : notice.tone === "info" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{notice.message}</div>}

      <p className="text-[10px] leading-5 text-brand-muted">Milestone transitions, hold/resume/cancel actions, audit history, simulated notifications and public status links are saved by the backend. Project document upload and free-form note endpoints are not available in the current API and are therefore not presented as working actions.</p>

      <UpdateProjectStageDialog
        open={stageDialogOpen}
        project={selectedProject}
        onClose={() => setStageDialogOpen(false)}
        busy={updateMutation.isPending}
        onSubmit={(request) => updateMutation.mutate(request)}
      />
      <ProjectFullDetailsDialog
        open={fullDetailsOpen}
        project={selectedProject}
        onClose={() => setFullDetailsOpen(false)}
      />
    </div>
  );
}

export default ProjectTrackerPage;
