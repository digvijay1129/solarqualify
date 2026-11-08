import { useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { formatProjectDate } from "../utils/project-tracker.js";

function ProjectNotesPanel({ notes = [], onAddNote = () => {} }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!draft.trim()) {
      setError("Enter a note before adding it.");
      return;
    }
    onAddNote(draft);
    setDraft("");
    setError("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-brand-text">Project Notes</p>
        <span className="text-[10px] text-brand-muted">{notes.length} notes</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={500} placeholder="Add a project note..." aria-label="New project note" className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-brand-muted">Session-only note · {draft.length}/500</span>
          <button type="submit" className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-brand-emerald px-3 py-2 text-xs font-bold text-white hover:bg-brand-emerald-hover"><Send size={14} />Add Note</button>
        </div>
        {error && <p role="alert" className="text-[10px] text-red-600">{error}</p>}
      </form>
      <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {notes.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-brand-muted">No notes have been added to this sample project.</div> : notes.map((note) => (
          <article key={note.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text"><MessageSquareText size={13} className="text-brand-emerald" />{note.author}</span>
              <time className="shrink-0 text-[9px] text-brand-muted">{formatProjectDate(note.date)}</time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">{note.text}</p>
            {note.sessionOnly && <p className="mt-2 text-[9px] font-semibold text-blue-700">Added in this page session</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

export default ProjectNotesPanel;
