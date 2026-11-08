import { useEffect, useMemo, useState } from "react";
import { useProjects } from "../hooks/useProjects.js";
import ProjectTrackerHero from "../components/ProjectTrackerHero.jsx";
import ProjectMetricCards from "../components/ProjectMetricCards.jsx";
import ProjectLocationsPanel from "../components/ProjectLocationsPanel.jsx";
import StageWiseProgressCard from "../components/StageWiseProgressCard.jsx";
import ProjectViewTabs from "../components/ProjectViewTabs.jsx";
import ProjectFilters from "../components/ProjectFilters.jsx";
import ProjectsTable from "../components/ProjectsTable.jsx";
import ProjectDetailsPanel from "../components/ProjectDetailsPanel.jsx";
import UpdateProjectStageDialog from "../components/UpdateProjectStageDialog.jsx";
import ProjectFullDetailsDialog from "../components/ProjectFullDetailsDialog.jsx";
import { projectStages } from "../../../mocks/fixtures/project-tracker.fixture.js";
import { addLocalDocument, addProjectNote, filterProjects, paginateProjects, updateProjectStage } from "../utils/project-tracker.js";

const initialFilters = {
  view: "all",
  query: "",
  location: "all",
  stage: "all",
  dateRange: "all",
};

function ProjectTrackerLoading() {
  return <div className="space-y-5" aria-label="Loading Project Tracker"><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_.95fr]"><div className="h-[650px] animate-pulse rounded-2xl bg-slate-200" /><div className="h-[650px] animate-pulse rounded-2xl bg-slate-200" /></div></div>;
}

function ProjectTrackerError({ onRetry }) {
  return <section className="rounded-2xl border border-red-200 bg-white p-8 text-center"><h2 className="text-lg font-bold text-brand-text">Project Tracker could not be loaded</h2><p className="mt-2 text-sm text-brand-muted">The illustrative project portfolio could not be retrieved.</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white">Try again</button></section>;
}

function ProjectTrackerPage() {
  const { data, isPending, isError, refetch } = useProjects();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("P-1076");
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [detailTab, setDetailTab] = useState("progress");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [fullDetailsOpen, setFullDetailsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState("info");

  useEffect(() => {
    if (data?.projects) setProjects(data.projects);
  }, [data]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    return filterProjects(projects, filters, {
      referenceDate: data.referenceDate,
      currentStaffId: data.currentStaff.id,
    });
  }, [data, filters, projects]);

  const pagination = useMemo(() => paginateProjects(filteredProjects, page, 5), [filteredProjects, page]);

  useEffect(() => {
    setPage(1);
  }, [filters.view, filters.query, filters.location, filters.stage, filters.dateRange]);

  useEffect(() => {
    if (filteredProjects.length && !filteredProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProjectId]);

  if (isPending) return <ProjectTrackerLoading />;
  if (isError || !data) return <ProjectTrackerError onRetry={refetch} />;

  function updateFilter(key, value) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setNotice("");
  }

  function selectView(view) {
    setFilters((previous) => ({ ...previous, view }));
    setNotice("");
  }

  function handleProjectStageUpdate({ projectId, stageId, eventDate, note }) {
    try {
      setProjects((previous) => previous.map((project) => project.id === projectId ? updateProjectStage(project, stageId, eventDate, note) : project));
      setSelectedProjectId(projectId);
      setStageDialogOpen(false);
      setDetailTab("progress");
      setNotice("Project stage updated in this page session only. No server update or audit record was created.");
      setNoticeKind("success");
    } catch (error) {
      setNotice(error.message);
      setNoticeKind("error");
    }
  }

  function handleAddNote(projectId, text) {
    try {
      setProjects((previous) => previous.map((project) => project.id === projectId ? addProjectNote(project, text, data.currentStaff.name, data.referenceDate) : project));
      setNotice("Note added to this page session only. It has not been saved to a server.");
      setNoticeKind("info");
    } catch (error) {
      setNotice(error.message);
      setNoticeKind("error");
    }
  }

  function handleUploadDocument(projectId, file) {
    const current = projects.find((project) => project.id === projectId);
    const updated = addLocalDocument(current, file, data.referenceDate);
    setProjects((previous) => previous.map((project) => project.id === projectId ? updated : project));
  }

  const locationOptions = data.locations;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <ProjectTrackerHero />
      <ProjectMetricCards summary={data.summary} generation={data.generation} />

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(350px,.95fr)] xl:gap-5">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,.88fr)]">
            <ProjectLocationsPanel locations={locationOptions} selectedLocation={filters.location} onSelectLocation={(location) => updateFilter("location", location)} />
            <StageWiseProgressCard stageCounts={data.stageCounts} />
          </div>

          <ProjectViewTabs activeView={filters.view} summary={data.summary} onChange={selectView} />
          <ProjectFilters filters={filters} locations={locationOptions} stages={projectStages} onChange={updateFilter} onReset={() => { setFilters(initialFilters); setNotice(""); }} />

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] leading-4 text-blue-900">
            <span>Illustrative portfolio summary: {data.summary.totalProjects} projects. This frontend sample contains {projects.length} sample records for filtering and pagination tests.</span>
            <span>Reference date: {data.referenceDate}</span>
          </div>

          <ProjectsTable
            projects={pagination.items}
            pagination={pagination}
            selectedProjectId={selectedProject?.id}
            onSelectProject={(projectId) => { setSelectedProjectId(projectId); setDetailTab("progress"); }}
            onUpdateStage={(projectId) => { setSelectedProjectId(projectId); setStageDialogOpen(true); }}
            onOpenDocuments={() => setDetailTab("documents")}
            onPageChange={setPage}
          />
        </div>

        <ProjectDetailsPanel
          project={selectedProject}
          onUpdateStage={(projectId) => { setSelectedProjectId(projectId); setStageDialogOpen(true); }}
          onViewFullDetails={() => setFullDetailsOpen(true)}
          onUploadDocument={handleUploadDocument}
          onAddNote={handleAddNote}
          activeTab={detailTab}
          onTabChange={setDetailTab}
        />
      </div>

      {notice && (
        <div role={noticeKind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${noticeKind === "success" ? "border-green-200 bg-green-50 text-green-800" : noticeKind === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-blue-200 bg-blue-50 text-blue-900"}`}>
          {notice}
        </div>
      )}

      <p className="text-[10px] leading-5 text-brand-muted">{data.dataLabel} Stage updates, notes and document metadata are temporary in-memory demo interactions. Connect authenticated APIs, storage and audit history before operational use.</p>

      <UpdateProjectStageDialog
        open={stageDialogOpen}
        project={projects.find((project) => project.id === selectedProjectId)}
        onClose={() => setStageDialogOpen(false)}
        onSubmit={handleProjectStageUpdate}
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
