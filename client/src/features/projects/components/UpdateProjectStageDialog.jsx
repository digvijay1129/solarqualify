import { useEffect, useState } from "react";
import { X, Pencil, AlertCircle } from "lucide-react";
import { projectStages } from "../../../mocks/fixtures/project-tracker.fixture.js";

function UpdateProjectStageDialog({ open, project, onClose = () => {}, onSubmit = () => {} }) {
  const [stageId, setStageId] = useState(project?.currentStageId ?? "");
  const [eventDate, setEventDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && project) {
      setStageId(project.currentStageId);
      setEventDate("");
      setNote("");
      setError("");
    }
  }, [open, project]);

  if (!open || !project) return null;

  function handleSubmit(event) {
    event.preventDefault();
    if (!stageId) {
      setError("Select a project stage.");
      return;
    }
    if (!eventDate) {
      setError("Select the date for this stage update.");
      return;
    }
    onSubmit({ projectId: project.id, stageId, eventDate, note });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="update-stage-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint-soft text-brand-emerald"><Pencil size={20} /></div><div><h2 id="update-stage-title" className="text-lg font-bold text-brand-text">Update Project Stage</h2><p className="mt-0.5 text-xs text-brand-muted">{project.id} · {project.customerName}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close update stage dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-brand-text">New project stage *</span><select value={stageId} onChange={(event) => setStageId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10">{projectStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-brand-text">Stage date *</span><input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-brand-text">Update note (optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Add context for this stage update..." className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10" /></label>
          {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><AlertCircle size={15} />{error}</p>}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900">Demo behavior: stage changes and notes are retained in page memory only. No project API or audit service is connected.</div>
          <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-text">Cancel</button><button type="submit" className="min-h-10 rounded-xl bg-brand-emerald px-4 py-2 text-sm font-bold text-white hover:bg-brand-emerald-hover">Update Stage</button></div>
        </form>
      </section>
    </div>
  );
}

export default UpdateProjectStageDialog;
