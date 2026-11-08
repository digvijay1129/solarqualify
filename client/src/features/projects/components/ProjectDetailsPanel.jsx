import { useState } from "react";
import { UserRound, MapPin, Zap, FileText, Layers3, Pencil, ArrowRight, Activity } from "lucide-react";
import ProjectProgressTimeline from "./ProjectProgressTimeline.jsx";
import ProjectDocumentsPanel from "./ProjectDocumentsPanel.jsx";
import ProjectNotesPanel from "./ProjectNotesPanel.jsx";

const detailTabs = [
  { id: "progress", label: "Project Progress" },
  { id: "documents", label: "Documents" },
  { id: "notes", label: "Notes" },
];

function ProjectDetailsPanel({ project, onUpdateStage = () => {}, onViewFullDetails = () => {}, onUploadDocument = () => {}, onAddNote = () => {}, activeTab, onTabChange }) {
  const [localTab, setLocalTab] = useState("progress");
  const selectedTab = activeTab ?? localTab;
  const setSelectedTab = onTabChange ?? setLocalTab;

  if (!project) {
    return <section className="rounded-2xl border border-brand-border bg-white p-6 text-center text-sm text-brand-muted">Select a project to see its details.</section>;
  }

  return (
    <aside className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card xl:sticky xl:top-5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-green-50 to-white px-4 py-3.5">
        <div className="flex items-center gap-2"><FileText size={22} className="text-brand-emerald" /><h2 className="text-lg font-bold text-brand-text">Project Details</h2></div>
        <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-extrabold text-green-800">{project.id}</span>
      </div>

      <div className="p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-mint-soft text-brand-emerald"><UserRound size={24} /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-text">{project.customerName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-brand-muted"><MapPin size={13} />{project.address}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 py-3">
          <div className="min-w-0 px-2 text-center"><Layers3 size={20} className="mx-auto text-brand-emerald" /><p className="mt-1 truncate text-sm font-extrabold text-brand-text">{project.systemSizeKw} kW</p><p className="text-[9px] text-brand-muted">System Size</p></div>
          <div className="min-w-0 px-2 text-center"><Zap size={20} className="mx-auto text-brand-emerald" /><p className="mt-1 truncate text-sm font-extrabold text-brand-text">{project.annualGenerationUnits.toLocaleString("en-IN")}</p><p className="text-[9px] text-brand-muted">Annual Generation*</p></div>
          <div className="min-w-0 px-2 text-center"><FileText size={20} className="mx-auto text-brand-emerald" /><p className="mt-1 truncate text-sm font-extrabold text-brand-text">{project.quotationReference}</p><p className="text-[9px] text-brand-muted">Quotation Ref.</p></div>
        </div>
        <p className="mt-2 text-[9px] leading-4 text-brand-muted">*Illustrative annual generation assumption, not a performance guarantee.</p>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Project detail views">
          {detailTabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={selectedTab === tab.id} onClick={() => setSelectedTab(tab.id)} className={`min-h-9 rounded-lg px-1.5 py-2 text-[10px] font-bold transition sm:text-xs ${selectedTab === tab.id ? "bg-brand-forest text-white shadow-sm" : "text-slate-700 hover:bg-white"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[300px]">
          {selectedTab === "progress" && <ProjectProgressTimeline project={project} />}
          {selectedTab === "documents" && <ProjectDocumentsPanel documents={project.documents} onUpload={(file) => onUploadDocument(project.id, file)} />}
          {selectedTab === "notes" && <ProjectNotesPanel notes={project.notes} onAddNote={(text) => onAddNote(project.id, text)} />}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onUpdateStage(project.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-brand-text hover:bg-slate-50"><Pencil size={15} />Update Stage</button>
          <button type="button" onClick={() => onViewFullDetails(project.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-emerald px-3 py-2.5 text-xs font-bold text-white hover:bg-brand-emerald-hover">View Full Details <ArrowRight size={15} /></button>
        </div>
      </div>
    </aside>
  );
}

export default ProjectDetailsPanel;
