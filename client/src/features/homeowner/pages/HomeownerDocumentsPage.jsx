import { useMemo, useRef, useState } from "react";
import { FileText, FolderOpen, Search, UploadCloud, Trash2, Download, Info, FileCheck2 } from "lucide-react";
import HomeownerHero from "../components/HomeownerHero.jsx";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { DOCUMENT_CATEGORIES, MAX_DOCUMENT_SIZE_MB, bytesToReadableSize, filterDocuments, validateUploadFile } from "../utils/homeowner-portal.js";

const categoryIcons = { Quotations: FileText, Bills: FileText, Contracts: FileCheck2, Permits: FileCheck2, Invoices: FileText, "Project Files": FolderOpen };

function HomeownerDocumentsPage() {
  const { documents, addDocument, removeDocument, setNotice } = useHomeownerPortal();
  const [category, setCategory] = useState("All Documents");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");
  const [dateRange, setDateRange] = useState("All Dates");
  const [uploadCategory, setUploadCategory] = useState("Project Files");
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const filtered = useMemo(
    () => filterDocuments(documents, { category, query, status, dateRange }),
    [documents, category, query, status, dateRange],
  );

  function uploadFile(file) {
    const error = validateUploadFile(file, { maxSizeMB: MAX_DOCUMENT_SIZE_MB });
    if (error) { setFileError(error); return; }
    const record = {
      id: `local-${Date.now()}`,
      name: file.name,
      category: uploadCategory,
      status: "Local session metadata",
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeLabel: bytesToReadableSize(file.size),
      fileAttached: false,
      description: "File metadata only; file contents are not stored or uploaded in this demo.",
    };
    addDocument(record);
    setFileError("");
    setNotice({ tone: "success", message: `${file.name} was added to this page session as metadata only. It was not uploaded to a server.` });
  }

  const categories = DOCUMENT_CATEGORIES.slice(1);
  const totalCategoryCount = (item) => documents.filter((doc) => doc.category === item).length;

  return (
    <div className="space-y-5">
      <HomeownerHero eyebrow="Your files" title="Document Management" description="View, download and manage your solar project documents in one place. Secure server upload is not connected." />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Document categories">
        {categories.map((item) => {
          const Icon = categoryIcons[item] ?? FolderOpen;
          const selected = category === item;
          return (
            <button key={item} type="button" onClick={() => setCategory(selected ? "All Documents" : item)} className={`flex min-h-[88px] items-center gap-3 rounded-xl border px-3 py-3 text-left shadow-sm transition ${selected ? "border-[#082b49] bg-[#082b49] text-white ring-2 ring-amber-300" : "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-800"}`}><Icon size={22} /></span>
              <span className="min-w-0"><span className="block text-xs font-extrabold">{item}</span><span className={`mt-1 block text-[10px] ${selected ? "text-slate-200" : "text-slate-500"}`}>{totalCategoryCount(item)} Documents</span></span>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents by name or keyword..." className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Document type" className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>All Documents</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Date filter" className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>All Dates</option><option>Last 30 Days</option><option>This Year</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Document status" className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>All Status</option><option>Demo record</option><option>Local session metadata</option></select>
          <button type="button" onClick={() => { setQuery(""); setCategory("All Documents"); setStatus("All Status"); setDateRange("All Dates"); }} className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">Reset</button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-emerald-50 to-sky-50 px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><FileText size={19} /></span><div><h2 className="text-sm font-black text-slate-950">{category === "All Documents" ? "All Documents" : category} ({filtered.length})</h2><p className="text-[10px] text-slate-500">Sample records do not contain real downloadable files.</p></div></div><span className="text-[10px] font-semibold text-slate-500">{documents.length} total records</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-700"><tr><th className="px-4 py-3 font-extrabold">Document Name</th><th className="px-4 py-3 font-extrabold">Type</th><th className="px-4 py-3 font-extrabold">Uploaded Date</th><th className="px-4 py-3 font-extrabold">Status</th><th className="px-4 py-3 text-right font-extrabold">Actions</th></tr></thead>
              <tbody>{filtered.map((document) => <tr key={document.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><FileText size={20} /></span><span className="min-w-0"><span className="block break-all font-extrabold text-slate-950">{document.name}</span><span className="text-[10px] text-slate-500">{document.sizeLabel || "No file attached"}</span></span></div></td>
                <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-800">{document.category}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{document.uploadedAt}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${document.status === "Demo record" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>{document.status}</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" disabled={!document.fileAttached} title="No attached file is available" onClick={() => setNotice({ tone: "warning", message: "No attached file is available for download in this demo." })} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><Download size={13} /> Download</button>{document.id.startsWith("local-") && <button type="button" onClick={() => removeDocument(document.id)} aria-label={`Remove ${document.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={14} /></button>}</div></td>
              </tr>)}</tbody>
            </table>
            {filtered.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No documents match these filters.</div>}
          </div>
        </div>
      </section>

      <section
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); uploadFile(event.dataTransfer.files?.[0]); }}
        className={`rounded-2xl border-2 border-dashed p-5 shadow-sm transition sm:p-6 ${dragging ? "border-emerald-600 bg-emerald-50" : "border-emerald-200 bg-white"}`}
      >
        <input ref={inputRef} type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => { if (event.target.files?.[0]) uploadFile(event.target.files[0]); event.target.value = ""; }} />
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><UploadCloud size={25} /></span>
          <div><h2 className="text-base font-black text-slate-950">Upload a Document</h2><p className="mt-1 text-xs text-slate-600">Drag and drop files here, or choose a file to add its metadata to this session.</p><p className="mt-1 text-[10px] text-slate-500">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG · Maximum file size {MAX_DOCUMENT_SIZE_MB} MB</p></div>
          <div className="flex flex-wrap items-center justify-center gap-2"><select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"><option>Project Files</option><option>Bills</option><option>Quotations</option><option>Contracts</option><option>Permits</option><option>Invoices</option></select><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-400 px-4 text-xs font-extrabold text-slate-950 hover:bg-amber-300"><UploadCloud size={16} /> Upload Document</button></div>
        </div>
        {fileError && <p role="alert" className="mt-3 text-center text-xs font-semibold text-red-600">{fileError}</p>}
        <p className="mt-4 flex items-start justify-center gap-2 text-[10px] leading-5 text-amber-900"><Info size={14} className="mt-0.5 shrink-0" /> File metadata only is kept in this browser page session. Secure server storage is not connected; do not upload identity or sensitive personal records.</p>
      </section>
    </div>
  );
}

export default HomeownerDocumentsPage;
