import { useMemo, useState } from "react";
import { Download, FileCheck2, FileText, FolderOpen, Search, Info } from "lucide-react";
import HomeownerHero from "../components/HomeownerHero.jsx";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { downloadHomeownerBill, downloadHomeownerQuotationPdf } from "../services/homeowner-files.service.js";

function HomeownerDocumentsPage() {
  const { documents = [], isLoading, isError, error, refetch, setNotice } = useHomeownerPortal();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Documents");
  const [downloadingId, setDownloadingId] = useState(null);

  const filtered = useMemo(() => documents.filter((item) => {
    const matchesCategory = category === "All Documents" || item.category === category;
    const haystack = `${item.name ?? ""} ${item.category ?? ""}`.toLowerCase();
    return matchesCategory && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  }), [documents, category, query]);

  async function downloadDocument(documentRecord) {
    if (downloadingId) return;
    setDownloadingId(documentRecord.id);
    try {
      const blob = documentRecord.category === "Bills"
        ? await downloadHomeownerBill(documentRecord.leadId)
        : await downloadHomeownerQuotationPdf(documentRecord.quotationId);
      const url = URL.createObjectURL(blob);
      const anchor = globalThis.document.createElement("a");
      anchor.href = url;
      anchor.download = documentRecord.name;
      globalThis.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice({ tone: "success", message: "Document download started." });
    } catch (downloadError) {
      setNotice({ tone: "error", message: downloadError?.message || "Document could not be downloaded." });
    } finally {
      setDownloadingId(null);
    }
  }

  if (isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />;
  if (isError) return <section className="rounded-2xl border border-red-200 bg-white p-6"><p className="text-sm text-red-800">{error?.message || "Documents could not be loaded."}</p><button type="button" onClick={() => refetch()} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Retry</button></section>;

  return (
    <div className="space-y-5">
      <HomeownerHero eyebrow="Your files" title="Document Management" description="View bill metadata and generated quotation records associated with your SolarQualify account." />
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents…" className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Document category" className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>All Documents</option><option>Bills</option><option>Quotations</option></select>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2 border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><FolderOpen size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Account Documents ({filtered.length})</h2></div><span className="text-[10px] text-slate-500">{documents.length} records</span></div>
        {filtered.length ? <div className="mt-2 divide-y divide-slate-100">{filtered.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">{item.category === "Bills" ? <FileText size={20} /> : <FileCheck2 size={20} />}</span><div className="min-w-0"><p className="break-all text-xs font-extrabold text-slate-950">{item.name}</p><p className="mt-1 text-[10px] text-slate-500">{item.category} · {item.uploadedAt || "Date unavailable"} · {item.sizeLabel}</p><p className="mt-1 text-[10px] text-slate-500">{item.status}</p></div></div><button type="button" disabled={downloadingId === item.id} onClick={() => downloadDocument(item)} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Download size={14} />{downloadingId === item.id ? "Preparing…" : "Download"}</button></article>)}</div> : <div className="py-10 text-center"><p className="text-sm font-bold text-slate-900">No documents found</p><p className="mt-1 text-xs text-slate-500">Bills appear after upload and quotations after Sales Staff generate them.</p></div>}
      </section>
      <p className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-950"><Info size={15} className="mt-0.5 shrink-0" />Only electricity bills and quotation PDFs are currently exposed by the backend document APIs. General project document upload and contract storage are not part of this phase.</p>
    </div>
  );
}

export default HomeownerDocumentsPage;
