import { Copy, MapPin, Zap, CalendarDays, Clock3 } from "lucide-react";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { getMilestoneProgress } from "../utils/homeowner-portal.js";
import ProjectMilestoneTimeline from "../components/ProjectMilestoneTimeline.jsx";
import HomeownerHero from "../components/HomeownerHero.jsx";

function HomeownerProjectStatusPage() {
  const { projects = [], isLoading, isError, error, refetch, setNotice } = useHomeownerPortal();

  async function copyProjectId(projectId) {
    try {
      await navigator.clipboard.writeText(projectId);
      setNotice({ tone: "success", message: "Project ID copied." });
    } catch {
      setNotice({ tone: "warning", message: "Clipboard permission unavailable. You can copy the project ID manually." });
    }
  }

  if (isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />;
  if (isError) return <section className="rounded-2xl border border-red-200 bg-white p-6"><p className="text-sm text-red-800">{error?.message || "Projects could not be loaded."}</p><button type="button" onClick={() => refetch()} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Retry</button></section>;

  return (
    <div className="space-y-5">
      <HomeownerHero eyebrow="Project workspace" title="Project Status & Tracking" description="View project milestones and the latest status recorded by your SolarQualify project team." />
      {projects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center"><h2 className="text-lg font-black text-slate-950">No active project records</h2><p className="mt-2 text-sm text-slate-600">A project record appears after Sales Staff create a project from an accepted quotation.</p></section>
      ) : projects.map((project) => {
        const progress = getMilestoneProgress(project.milestones);
        const quotation = project.quotation ?? {};
        return (
          <section key={project.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">{project.title}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={14} />{project.location}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900">{project.statusLabel}</span></div>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-4"><div><p className="text-[10px] text-slate-500">Project ID</p><p className="mt-1 break-all text-xs font-bold text-slate-900">{project.id}</p><button type="button" onClick={() => copyProjectId(project.id)} className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800"><Copy size={12} /> Copy</button></div><div><p className="text-[10px] text-slate-500">Current stage</p><p className="mt-1 text-xs font-bold text-slate-900">{project.stage}</p></div><div><p className="text-[10px] text-slate-500">System capacity</p><p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-900"><Zap size={13} />{quotation.systemCapacityKW ?? "—"} kW</p></div><div><p className="text-[10px] text-slate-500">Progress</p><p className="mt-1 text-xs font-bold text-slate-900">{progress}%</p></div></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div>
            <div className="rounded-xl border border-slate-100 p-4"><div className="mb-4 flex items-center gap-2"><CalendarDays size={19} className="text-emerald-700" /><div><h3 className="text-sm font-black text-slate-950">Project Milestones</h3><p className="text-[11px] text-slate-500">Latest milestone status from the backend</p></div></div><ProjectMilestoneTimeline milestones={project.milestones} /></div>
            {project.updates.length > 0 && <div className="rounded-xl border border-slate-100 p-4"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><Clock3 size={17} className="text-emerald-700" /> Recent Project History</h3><ol className="mt-3 space-y-3">{project.updates.slice(0,6).map((update) => <li key={update.id} className="border-l-2 border-emerald-100 pl-3"><p className="text-xs font-bold text-slate-900">{update.title}</p><p className="mt-1 text-xs text-slate-600">{update.description}</p><p className="mt-1 text-[10px] text-slate-400">{update.date ? new Date(update.date).toLocaleString("en-IN") : "Date unavailable"}</p></li>)}</ol></div>}
          </section>
        );
      })}
    </div>
  );
}

export default HomeownerProjectStatusPage;
