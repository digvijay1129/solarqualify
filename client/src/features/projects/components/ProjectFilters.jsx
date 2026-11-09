import { Layers3, RotateCcw, ShieldCheck } from "lucide-react";

const selectClass = "h-11 w-full min-w-0 rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15";

function ProjectFilters({ filters, statuses = [], stages = [], onChange = () => {}, onReset = () => {} }) {
  return (
    <section aria-label="Filter projects from the live API" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
      <label className="block min-w-0"><span className="mb-1.5 block text-xs font-bold text-brand-text">Project status</span><span className="relative block"><ShieldCheck size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" /><select aria-label="Filter by project status" value={filters.status} onChange={(event) => onChange("status", event.target.value)} className={`${selectClass} pl-9`}><option value="all">All statuses</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></span></label>
      <label className="block min-w-0"><span className="mb-1.5 block text-xs font-bold text-brand-text">Current milestone</span><span className="relative block"><Layers3 size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" /><select aria-label="Filter by project milestone" value={filters.stage} onChange={(event) => onChange("stage", event.target.value)} className={`${selectClass} pl-9`}><option value="all">All milestones</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></span></label>
      <button type="button" onClick={onReset} className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-brand-text transition hover:bg-slate-50"><RotateCcw size={15} />Reset filters</button>
    </section>
  );
}

export default ProjectFilters;
