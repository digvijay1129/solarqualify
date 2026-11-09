import { useState } from "react";
import { Eye, MoreHorizontal, Pencil, MapPin, Zap } from "lucide-react";
import ProjectPagination from "./ProjectPagination.jsx";

const statusStyles = {
  active: "bg-emerald-100 text-emerald-900",
  on_hold: "bg-amber-100 text-amber-900",
  completed: "bg-blue-100 text-blue-900",
  cancelled: "bg-slate-100 text-slate-700",
};

function ProjectsTable({ projects = [], pagination, selectedProjectId, onSelectProject = () => {}, onUpdateStage = () => {}, onPageChange = () => {} }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card">
    <div className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-4"><div><h2 className="text-lg font-bold text-brand-text">Live Project List</h2><p className="mt-0.5 text-[10px] text-brand-muted">Projects returned by the authenticated backend</p></div><span className="rounded-full bg-brand-mint-soft px-3 py-1 text-xs font-semibold text-brand-forest">{projects.length} on this page</span></div>
    {projects.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center"><p className="text-sm font-semibold text-brand-text">No projects match these filters</p><p className="mt-1 text-xs text-brand-muted">Try another project status or milestone.</p></div> :
      <div className="w-full overflow-x-auto"><table className="w-full min-w-[790px] border-collapse text-left">
        <thead><tr className="bg-slate-50 text-[11px] font-bold text-brand-text"><th className="px-3 py-3">Project ID</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">System Size</th><th className="px-3 py-3">Current Milestone</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Updated</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
        <tbody>{projects.map((project) => <tr key={project.id} className={`border-t border-slate-100 text-xs transition hover:bg-slate-50 ${selectedProjectId === project.id ? "bg-green-50/80" : "bg-white"}`}>
          <td className="max-w-[145px] break-all px-3 py-3.5 font-extrabold text-brand-forest">{project.id}</td>
          <td className="min-w-[150px] px-3 py-3.5"><button type="button" onClick={() => onSelectProject(project.id)} className="text-left font-semibold text-brand-text hover:text-brand-emerald">{project.customerName}</button><p className="mt-1 flex items-center gap-1 text-[10px] text-brand-muted"><MapPin size={11} />{project.location}</p></td>
          <td className="whitespace-nowrap px-3 py-3.5 font-semibold text-brand-text"><span className="inline-flex items-center gap-1"><Zap size={13} className="text-brand-emerald" />{project.systemSizeKw ?? "—"} kW</span></td>
          <td className="px-3 py-3.5"><span className="inline-flex max-w-[170px] rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-bold leading-4 text-slate-700">{project.currentStageLabel}</span><div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-emerald" style={{ width: `${Math.min(100, Math.max(0, project.progressPercent))}%` }} /></div></td>
          <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[project.status] ?? statusStyles.active}`}>{project.statusLabel}</span></td>
          <td className="whitespace-nowrap px-3 py-3.5 text-[10px] text-brand-muted">{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString("en-IN") : "—"}</td>
          <td className="px-3 py-3.5"><div className="flex items-center justify-end gap-1.5"><button type="button" onClick={() => onSelectProject(project.id)} aria-label={`View ${project.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-brand-emerald hover:text-brand-emerald"><Eye size={16} /></button><div className="relative"><button type="button" onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)} aria-label={`More actions for ${project.id}`} aria-expanded={openMenuId === project.id} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-brand-emerald"><MoreHorizontal size={17} /></button>{openMenuId === project.id && <div className="absolute right-0 top-9 z-30 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button type="button" onClick={() => { onSelectProject(project.id); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-brand-text hover:bg-slate-50"><Eye size={14} />View details</button><button type="button" onClick={() => { onSelectProject(project.id); onUpdateStage(project.id); setOpenMenuId(null); }} disabled={["completed", "cancelled"].includes(project.status)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-brand-text hover:bg-slate-50 disabled:opacity-40"><Pencil size={14} />Update lifecycle</button></div>}</div></div></td>
        </tr>)}</tbody>
      </table></div>}
    <ProjectPagination {...pagination} onPageChange={onPageChange} />
  </section>;
}

export default ProjectsTable;
