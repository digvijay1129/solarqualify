import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { bytesToReadableSize, validateUploadFile } from "../utils/homeowner-portal.js";

function FileUploadField({ file, onFileChange, accept = ".pdf,.jpg,.jpeg,.png", maxSizeMB = 10, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  function choose(candidate) {
    const validation = validateUploadFile(candidate, { maxSizeMB, allowedExtensions: accept.split(",").map((item) => item.trim().replace(/^\./, "")) });
    if (validation) onFileChange(null, validation);
    else onFileChange(candidate, null);
  }
  return <div>
    <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={(event) => { choose(event.target.files?.[0]); event.target.value = ""; }} />
    <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]); }} className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}>
      <UploadCloud size={34} className="mx-auto text-emerald-700" />
      <p className="mt-2 text-sm font-bold text-slate-900">Drag and drop your electricity bill here</p>
      <p className="mt-1 text-xs text-slate-500">or choose a file from your device</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Choose File</button>
      <p className="mt-3 text-[11px] text-slate-500">PDF, JPG or PNG · Maximum {maxSizeMB} MB</p>
    </div>
    {file && <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3"><FileText size={22} className="shrink-0 text-emerald-800" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{file.name}</p><p className="text-xs text-slate-500">{bytesToReadableSize(file.size)} · Local browser session only</p></div><button type="button" onClick={() => onFileChange(null, null)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Remove selected file"><X size={17} /></button></div>}
    {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
  </div>;
}
export default FileUploadField;
