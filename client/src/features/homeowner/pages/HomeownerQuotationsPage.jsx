import { useEffect, useState } from "react";
import {
  ArrowDownToLine, CheckCircle2, FileText, Info, ShieldCheck,
  Sun, Zap, ClipboardCheck, CircleHelp, LoaderCircle,
} from "lucide-react";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { formatCurrency, formatNumber } from "../utils/homeowner-portal.js";
import HomeownerHero from "../components/HomeownerHero.jsx";
import { downloadHomeownerQuotationPdf } from "../services/homeowner-files.service.js";

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleDateString("en-IN");
}

function HomeownerQuotationsPage() {
  const { quotations = [], isLoading, isError, error, refetch, setNotice } = useHomeownerPortal();
  const [selectedId, setSelectedId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!selectedId && quotations.length) setSelectedId(quotations[0].id);
  }, [quotations, selectedId]);

  const selected = quotations.find((item) => item.id === selectedId) ?? quotations[0] ?? null;

  async function handleDownload() {
    if (!selected || downloading) return;
    setDownloading(true);
    try {
      const blob = await downloadHomeownerQuotationPdf(selected.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${selected.quotationNumber || "SolarQualify-Quotation"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setNotice({ tone: "success", message: "Quotation PDF download started." });
    } catch (downloadError) {
      setNotice({ tone: "error", message: downloadError?.message || "Quotation PDF could not be downloaded." });
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) return <div className="space-y-4" aria-label="Loading quotations"><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /></div>;
  if (isError) return <section className="rounded-2xl border border-red-200 bg-white p-6"><h1 className="text-lg font-black text-slate-950">Quotations could not be loaded</h1><p className="mt-2 text-sm text-red-800">{error?.message || "Please retry."}</p><button type="button" onClick={() => refetch()} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Retry</button></section>;

  return (
    <div className="space-y-5">
      <HomeownerHero eyebrow="Your solar proposals" title="Solar Quotations" description="Review quotations generated for your leads. Values and rule snapshots are shown as returned by the SolarQualify backend." compact />
      {quotations.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><FileText size={24} /></span><h2 className="mt-3 text-lg font-black text-slate-950">No quotations available</h2><p className="mt-1 text-sm text-slate-600">A quotation will appear here after Sales Staff qualify your lead and generate a quotation using active pricing and generation rules.</p></section>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="px-2 py-2 text-sm font-black text-slate-950">Your quotations ({quotations.length})</h2>
            <div className="space-y-2">{quotations.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === item.id ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}><p className="break-all text-xs font-extrabold text-slate-950">{item.quotationNumber || item.title}</p><p className="mt-1 text-[10px] text-slate-500">{formatDate(item.createdAt)}</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">{item.status}</span></button>)}</div>
          </aside>

          {selected && <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Quotation detail</p><h2 className="mt-1 break-all text-xl font-black text-slate-950">{selected.quotationNumber || "Solar quotation"}</h2><p className="mt-1 text-xs text-slate-500">Generated {formatDate(selected.createdAt)}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900">{selected.status}</span></div>
            <button type="button" disabled={downloading} onClick={handleDownload} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60"><ArrowDownToLine size={16} />{downloading ? "Preparing PDF…" : "Download Quotation PDF"}</button>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[[Zap, `${selected.systemSizeKw ?? "—"} kW`, "System capacity"], [Sun, `${formatNumber(selected.annualGenerationUnits)} units`, "Estimated annual generation"], [ShieldCheck, formatCurrency(selected.subsidyAmount), "Applicable subsidy"], [FileText, formatCurrency(selected.netInstallationCost), "Net installation cost"]].map(([Icon, value, label]) => <article key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-800"><Icon size={18} /></span><p className="mt-2 break-words text-sm font-black text-slate-950">{value}</p><p className="mt-1 text-[10px] text-slate-500">{label}</p></article>)}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-100 p-4"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><ClipboardCheck size={17} className="text-emerald-700" /> Pricing breakdown</h3><dl className="mt-3 space-y-2 text-xs">{[["Equipment cost",selected.equipmentCost],["Installation charges",selected.installationCost],["Total installation cost",selected.totalInstallationCost],["Applicable subsidy",selected.subsidyAmount],["Net installation cost",selected.netInstallationCost]].map(([label,value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-950">{formatCurrency(value)}</dd></div>)}</dl></section>
              <section className="rounded-xl border border-slate-100 p-4"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><CircleHelp size={17} className="text-emerald-700" /> Calculation snapshots</h3><dl className="mt-3 space-y-2 text-xs">{[["Calculation version",selected.calculationVersion],["Pricing rule",selected.pricingSnapshot?.ruleName],["Pricing version",selected.pricingSnapshot?.version],["Generation rule",selected.generationSnapshot?.ruleName],["Generation rate",selected.generationSnapshot?.unitsPerKWPerYear ? `${selected.generationSnapshot.unitsPerKWPerYear} units/kW/year` : null],["Subsidy verification",selected.subsidySnapshot?.verificationStatus ?? "No verified subsidy rule applied"]].map(([label,value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-950">{value ?? "Not available"}</dd></div>)}</dl></section>
            </div>

            {selected.calculationReasons?.length > 0 && <section className="rounded-xl border border-slate-100 p-4"><h3 className="text-sm font-black text-slate-950">Calculation explanation</h3><div className="mt-3 space-y-3">{selected.calculationReasons.map((reason,index) => <div key={reason.code || index} className="border-l-2 border-emerald-200 pl-3"><p className="text-xs font-bold text-slate-950">{reason.label || reason.code}</p><p className="mt-1 text-xs leading-5 text-slate-600">{reason.detail || reason.formula || "No additional detail supplied."}</p></div>)}</div></section>}

            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950"><Info size={16} className="mt-0.5 shrink-0" /><p>Subsidy values are calculated only from the configured rule snapshot. A verified rule does not establish individual government eligibility. There is no homeowner acceptance or change-request endpoint yet; this page is read-only.</p></div>
          </section>}
        </div>
      )}
    </div>
  );
}

export default HomeownerQuotationsPage;
