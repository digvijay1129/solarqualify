import { useEffect, useMemo, useState } from "react";
import { X, Pencil, AlertCircle } from "lucide-react";
import { PROJECT_STAGES } from "../services/projects.service.js";

function UpdateProjectStageDialog({ open, project, onClose = () => {}, onSubmit = () => {}, busy = false }) {
  const [mode, setMode] = useState("milestone");
  const [milestoneStatus, setMilestoneStatus] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const milestone = useMemo(() => project?.milestones?.find((item) => item.stage === project.currentStageId), [project]);
  const milestoneOptions = milestone?.status === "pending"
    ? [{ value: "in_progress", label: "Mark as in progress" }, { value: "skipped", label: "Skip milestone" }]
    : milestone?.status === "in_progress"
      ? [{ value: "completed", label: "Mark as completed" }, { value: "skipped", label: "Skip milestone" }]
      : [];

  const projectStatusOptions = project?.status === "active"
    ? [{ value: "on_hold", label: "Put project on hold" }, { value: "cancelled", label: "Cancel project" }]
    : project?.status === "on_hold"
      ? [{ value: "active", label: "Resume project" }, { value: "cancelled", label: "Cancel project" }]
      : [];

  useEffect(() => {
    if (open && project) {
      setMode(project.status === "on_hold" ? "project-status" : "milestone");
      setMilestoneStatus(milestoneOptions[0]?.value ?? "");
      setProjectStatus(projectStatusOptions[0]?.value ?? "");
      setNote("");
      setError("");
    }
  }, [open, project?.id, project?.status, milestone?.status]);

  if (!open || !project) return null;

  function handleSubmit(event) {
    event.preventDefault();
    if (mode === "milestone" && !milestoneStatus) {
      setError("There is no further milestone transition available. Choose a project status action instead.");
      return;
    }
    if (mode === "project-status" && !projectStatus) {
      setError("Select a valid project status transition.");
      return;
    }
    if (mode === "project-status" && ["on_hold", "cancelled"].includes(projectStatus) && !note.trim()) {
      setError("A note is required when putting a project on hold or cancelling it.");
      return;
    }
    const payload = mode === "milestone"
      ? { stage: project.currentStageId, milestoneStatus, note: note.trim() }
      : { projectStatus, note: note.trim() };
    onSubmit({ projectId: project.id, payload });
  }

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="update-stage-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint-soft text-brand-emerald"><Pencil size={20} /></div><div><h2 id="update-stage-title" className="text-lg font-bold text-brand-text">Update Project Lifecycle</h2><p className="mt-0.5 text-xs text-brand-muted">{project.id} · {project.customerName}</p></div></div><button type="button" onClick={onClose} disabled={busy} aria-label="Close update dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={19} /></button></div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold text-slate-500">Current milestone</p><p className="mt-1 text-sm font-extrabold text-slate-900">{PROJECT_STAGES.find((stage) => stage.id === project.currentStageId)?.label ?? project.currentStageLabel}</p><p className="mt-1 text-[10px] text-slate-500">Milestones must be updated in order. The API validates all transitions.</p></div>
        <fieldset className="grid grid-cols-2 gap-2"><label className={`rounded-lg border p-3 text-xs font-bold ${mode === "milestone" ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-slate-200"}`}><input type="radio" name="lifecycle-mode" className="mr-2 accent-emerald-700" checked={mode === "milestone"} onChange={() => setMode("milestone")} />Milestone</label><label className={`rounded-lg border p-3 text-xs font-bold ${mode === "project-status" ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-slate-200"}`}><input type="radio" name="lifecycle-mode" className="mr-2 accent-emerald-700" checked={mode === "project-status"} onChange={() => setMode("project-status")} />Project status</label></fieldset>
        {mode === "milestone" ? <label className="block"><span className="mb-1.5 block text-xs font-semibold text-brand-text">Milestone action *</span><select value={milestoneStatus} onChange={(event) => setMilestoneStatus(event.target.value)} disabled={!milestoneOptions.length} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">{milestoneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{!milestoneOptions.length && <p className="mt-1 text-[10px] text-amber-800">This milestone is already terminal. You cannot reopen it through the current API.</p>}</label>
          : <label className="block"><span className="mb-1.5 block text-xs font-semibold text-brand-text">Project status action *</span><select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">{projectStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-brand-text">Audit note {mode === "project-status" && ["on_hold", "cancelled"].includes(projectStatus) ? "(required)" : "(optional)"}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={3} placeholder="Add context for this lifecycle change…" className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-emerald" /></label>
        {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><AlertCircle size={15} />{error}</p>}
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-[10px] leading-5 text-blue-900">Changes are saved by the backend and create an audit event plus simulated in-app notifications for the homeowner and Sales Staff.</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy} className="min-h-10 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-text disabled:opacity-40">Cancel</button><button type="submit" disabled={busy} className="min-h-10 rounded-xl bg-brand-emerald px-4 py-2 text-sm font-bold text-white hover:bg-brand-emerald-hover disabled:opacity-50">{busy ? "Saving…" : "Save Lifecycle Update"}</button></div>
      </form>
    </section>
  </div>;
}

export default UpdateProjectStageDialog;
