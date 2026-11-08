import { X, FileText, MapPin, CalendarDays, Zap, UserRound, Layers3 } from "lucide-react";
import { formatProjectDate } from "../utils/project-tracker.js";

function DetailRow({ label, value, icon: Icon }) {
  return <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0"><Icon size={17} className="mt-0.5 shrink-0 text-brand-emerald" /><div className="min-w-0 flex-1"><p className="text-[10px] text-brand-muted">{label}</p><p className="mt-0.5 break-words text-sm font-semibold text-brand-text">{value || "Not provided"}</p></div></div>;
}

function ProjectFullDetailsDialog({ open, project, onClose = () => {} }) {
  if (!open || !project) return null;
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="project-full-details-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint-soft text-brand-emerald"><FileText size={21} /></div><div><h2 id="project-full-details-title" className="text-lg font-bold text-brand-text">Project Full Details</h2><p className="mt-0.5 text-xs text-brand-muted">{project.id} · Illustrative demo record</p></div></div><button type="button" onClick={onClose} aria-label="Close project details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>
        <div className="mt-2 divide-y divide-slate-100">
          <DetailRow label="Customer" value={project.customerName} icon={UserRound} />
          <DetailRow label="Location" value={project.address} icon={MapPin} />
          <DetailRow label="System Size" value={`${project.systemSizeKw} kW`} icon={Zap} />
          <DetailRow label="Annual Generation Assumption" value={`${project.annualGenerationUnits.toLocaleString("en-IN")} units`} icon={Zap} />
          <DetailRow label="Current Stage" value={project.currentStageLabel} icon={Layers3} />
          <DetailRow label="Progress" value={`${project.progressPercent}%`} icon={Layers3} />
          <DetailRow label="Quotation Reference" value={project.quotationReference} icon={FileText} />
          <DetailRow label="Due Date" value={formatProjectDate(project.dueDate)} icon={CalendarDays} />
          <DetailRow label="Assigned To" value={project.assignedToName} icon={UserRound} />
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900">All project values in this package are illustrative. The page does not read or update a live project database.</p>
        <div className="mt-4 flex justify-end"><button type="button" onClick={onClose} className="min-h-10 rounded-xl bg-brand-emerald px-5 py-2 text-sm font-bold text-white">Close</button></div>
      </section>
    </div>
  );
}

export default ProjectFullDetailsDialog;
