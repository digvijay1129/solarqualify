import { useRef, useState } from "react";
import { FileText, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatProjectDate } from "../utils/project-tracker.js";

function ProjectDocumentsPanel({ documents = [], onUpload = () => {} }) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      onUpload(file);
      setMessage(`${file.name} added to this page session. It has not been uploaded to a server.`);
      setError(false);
    } catch (uploadError) {
      setMessage(uploadError.message);
      setError(true);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-brand-text">Project Documents</p>
        <span className="text-[10px] text-brand-muted">{documents.length} entries</span>
      </div>
      <div className="space-y-2">
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-brand-muted">No document records are available for this sample project.</div>
        ) : documents.map((document) => (
          <div key={document.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><FileText size={18} /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-brand-text">{document.name}</p>
              <p className="mt-0.5 text-[10px] text-brand-muted">{document.category} · {formatProjectDate(document.date)} · {document.sizeLabel}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${document.status === "Pending" ? "bg-amber-100 text-amber-800" : document.sessionOnly ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{document.status}</span>
          </div>
        ))}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleChange} className="sr-only" aria-label="Choose project document" />
      <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand-emerald bg-white px-3 py-2 text-xs font-bold text-brand-forest hover:bg-brand-mint-soft">
        <UploadCloud size={16} /> Add Document (Demo)
      </button>
      <p className="text-[10px] leading-4 text-brand-muted">PDF, JPG and PNG up to 10 MB. New files are listed in local page state only; no server upload or secure storage is connected.</p>
      {message && <div role={error ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[10px] leading-4 ${error ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"}`}>{error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}<span>{message}</span></div>}
    </div>
  );
}

export default ProjectDocumentsPanel;
