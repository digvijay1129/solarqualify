import { useState } from "react";
import { UserRound, MapPin, Zap, FileText, Layers3, Pencil, ArrowRight, Activity, Bell, Link2, Copy, ShieldOff } from "lucide-react";
import ProjectProgressTimeline from "./ProjectProgressTimeline.jsx";
import ProjectNotesPanel from "./ProjectNotesPanel.jsx";
import ProjectNotificationsPanel from "./ProjectNotificationsPanel.jsx";

const detailTabs = [
  { id: "progress", label: "Milestones", icon: Layers3 },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function ProjectDetailsPanel({
  project,
  onUpdateStage = () => {},
  onViewFullDetails = () => {},
  activeTab,
  onTabChange,
  notifications = [],
  notificationsLoading = false,
  notificationsError = false,
  onRetryNotifications = () => {},
  trackingLink = null,
  onIssueTrackingLink = () => {},
  onRevokeTrackingLink = () => {},
  onCopyTrackingLink = () => {},
  trackingBusy = false,
}) {
  const [localTab, setLocalTab] = useState("progress");
  const selectedTab = activeTab ?? localTab;
  const setSelectedTab = onTabChange ?? setLocalTab;
  if (!project) return <section className="rounded-2xl border border-brand-border bg-white p-6 text-center text-sm text-brand-muted">Select a live project to see its details.</section>;

  const canChange = !["completed", "cancelled"].includes(project.status);
  return (
    <aside className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card xl:sticky xl:top-5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-green-50 to-white px-4 py-3.5"><div className="flex items-center gap-2"><FileText size={22} className="text-brand-emerald" /><h2 className="text-lg font-bold text-brand-text">Project Details</h2></div><span className="max-w-[125px] truncate rounded-lg bg-green-100 px-2.5 py-1 text-[10px] font-extrabold text-green-800">{project.id}</span></div>
      <div className="p-4">
        <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-mint-soft text-brand-emerald"><UserRound size={24} /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-brand-text">{project.customerName}</p><p className="mt-1 flex items-center gap-1 text-xs text-brand-muted"><MapPin size={13} />{project.address}</p></div></div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 py-3">
          <div className="min-w-0 px-2 text-center"><Layers3 size={20} className="mx-auto text-brand-emerald" /><p className="mt-1 truncate text-sm font-extrabold text-brand-text">{project.systemSizeKw ?? "—"} kW</p><p className="text-[9px] text-brand-muted">System Size</p></div>
          <div className="min-w-0 px-2 text-center"><Zap size={20} className="mx-auto text-brand-emerald" /><p className="mt-1 truncate text-sm font-extrabold text-brand-text">{project.annualGenerationUnits == null ? "—" : project.annualGenerationUnits.toLocaleString("en-IN")}</p><p className="text-[9px] text-brand-muted">Annual Units</p></div>
          <div className="min-w-0 px-2 text-center"><FileText size={20} className="mx-auto text-brand-emerald" /><p className="mt-1 break-all text-[10px] font-extrabold text-brand-text">{project.quotationReference}</p><p className="text-[9px] text-brand-muted">Quotation Ref.</p></div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500">Current milestone</span><strong className="text-right text-xs text-slate-900">{project.currentStageLabel}</strong></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${project.progressPercent}%` }} /></div>
        <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500">Project status</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${project.status === "active" ? "bg-emerald-100 text-emerald-900" : project.status === "on_hold" ? "bg-amber-100 text-amber-900" : project.status === "completed" ? "bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-700"}`}>{project.statusLabel}</span></div>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Project detail views">
          {detailTabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" role="tab" aria-selected={selectedTab === tab.id} onClick={() => setSelectedTab(tab.id)} className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-lg px-1 py-2 text-[9px] font-bold transition sm:text-[10px] ${selectedTab === tab.id ? "bg-brand-forest text-white shadow-sm" : "text-slate-700 hover:bg-white"}`}><Icon size={13} />{tab.label}</button>; })}
        </div>
        <div className="mt-4 min-h-[280px]">
          {selectedTab === "progress" && <ProjectProgressTimeline project={project} />}
          {selectedTab === "activity" && <ProjectNotesPanel entries={project.notes} />}
          {selectedTab === "notifications" && <ProjectNotificationsPanel notifications={notifications} isLoading={notificationsLoading} isError={notificationsError} onRetry={onRetryNotifications} />}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onUpdateStage(project.id)} disabled={!canChange} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-brand-text hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={15} />Update Lifecycle</button>
          <button type="button" onClick={() => onViewFullDetails(project.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-emerald px-3 py-2.5 text-xs font-bold text-white hover:bg-brand-emerald-hover">Full Details <ArrowRight size={15} /></button>
        </div>
        <section className="mt-4 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-2"><Link2 size={16} className="text-emerald-700" /><h3 className="text-xs font-extrabold text-slate-900">Customer Tracking Link</h3></div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">Issue a 90-day public status link. The bearer token is shown only once; copy and share it with the customer securely.</p>
          {trackingLink && <div className="mt-2 break-all rounded-lg bg-slate-50 p-2 text-[10px] text-slate-700"><p>{trackingLink.url}</p><p className="mt-1 text-slate-500">Expires {new Date(trackingLink.expiresAt).toLocaleString("en-IN")}</p><button type="button" onClick={onCopyTrackingLink} className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-800"><Copy size={12} />Copy link</button></div>}
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onIssueTrackingLink} disabled={trackingBusy || !canChange} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-[10px] font-bold text-white disabled:opacity-40"><Link2 size={13} />{trackingBusy ? "Working…" : trackingLink ? "Rotate Link" : "Issue Link"}</button><button type="button" onClick={onRevokeTrackingLink} disabled={trackingBusy} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-[10px] font-bold text-slate-700 disabled:opacity-40"><ShieldOff size={13} />Revoke Link</button></div>
        </section>
      </div>
    </aside>
  );
}

export default ProjectDetailsPanel;
