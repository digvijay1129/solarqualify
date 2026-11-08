import { useState } from "react";
import {
  ArrowDownToLine, CheckCircle2, FileText, Info, MessageSquareText,
  ShieldCheck, Sun, Zap, CircleHelp, PanelsTopLeft, ClipboardCheck,
} from "lucide-react";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { annualGeneration, formatCurrency } from "../utils/homeowner-portal.js";
import HomeownerHero from "../components/HomeownerHero.jsx";
import rooftopImage from "../../../assets/images/solarqualify-homeowner-rooftop.jpg";

function HomeownerQuotationsPage() {
  const { quotations, quoteDecisions, updateQuoteDecision, setNotice } = useHomeownerPortal();
  const [selectedId, setSelectedId] = useState(quotations[0]?.id ?? null);
  const [changeMessage, setChangeMessage] = useState("");
  const [requestingChanges, setRequestingChanges] = useState(false);
  const selected = quotations.find((item) => item.id === selectedId) ?? quotations[0];

  if (!selected) return <div className="rounded-2xl bg-white p-8 text-center">No quotation records are available.</div>;

  const generation = annualGeneration(selected.systemSizeKw);
  const decision = quoteDecisions[selected.id];
  const status = decision || selected.status;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">Your solar proposals</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-[30px]">Solar Quotation</h1><p className="mt-1 text-sm text-slate-600">Review your system proposal, estimated generation and pricing information.</p></div>
        <button type="button" onClick={() => setNotice({ tone: "warning", message: "Quotation PDF download is not connected. No PDF file was generated." })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-extrabold text-slate-800 hover:bg-slate-50"><ArrowDownToLine size={16} /> Download Quotation</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Home</span><span>›</span><span>Quotations</span><span>›</span><strong className="text-slate-800">Quotation Details</strong><span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-900">{status}</span></div>
      <HomeownerHero eyebrow="SolarQualify proposal · illustrative" title="Your Rooftop Solar Quotation" description="Review the proposed system and the information still awaiting verified pricing." compact />

      <section className="grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-[1.75fr_.75fr]">
        <div className="min-w-0 space-y-4">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[[Zap, `${selected.systemSizeKw} kW`, "System Size"], [Sun, `${generation?.toLocaleString("en-IN")} units/year`, "Estimated Generation*"], [ShieldCheck, formatCurrency(selected.subsidyAmount), "Illustrative Subsidy*"], [FileText, selected.validUntil || "Not set", "Valid Till"]].map(([Icon, value, label]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><Icon size={20} /></span><p className="mt-2 break-words text-sm font-black text-slate-950">{value}</p><p className="mt-0.5 text-[10px] text-slate-500">{label}</p></div>)}
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3"><PanelsTopLeft size={21} className="text-emerald-700" /><h2 className="text-base font-black text-slate-950">Proposed System</h2></div>
              <dl className="mt-3 space-y-2.5 text-xs">{[["System Size", `${selected.systemSizeKw} kW`], ["Solar Panels", "Awaiting approved specification"], ["Inverter", "Awaiting approved specification"], ["Mounting Structure", "Awaiting site assessment"], ["Warranty", "Awaiting vendor confirmation"], ["Expected Lifespan", "Not specified"]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-900">{value}</dd></div>)}</dl>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3"><Sun size={21} className="text-emerald-700" /><h2 className="text-base font-black text-slate-950">Estimated Benefits</h2></div>
              <div className="mt-3 space-y-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-slate-500">Annual Generation*</span><strong className="text-slate-950">{generation?.toLocaleString("en-IN")} units</strong></div><div className="flex items-center justify-between gap-3"><span className="text-slate-500">Generation Assumption</span><strong className="text-slate-950">1,400 units / kW / year</strong></div><div className="flex items-center justify-between gap-3"><span className="text-slate-500">Monthly / Annual Savings</span><strong className="text-slate-950">Not estimated</strong></div><div className="rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-950">Actual energy output depends on site conditions, equipment, shading and system design. This estimate is not a performance guarantee.</div></div>
            </div>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3"><ClipboardCheck size={21} className="text-emerald-700" /><h2 className="text-base font-black text-slate-950">Pricing Breakdown</h2></div>
              <div className="mt-3 space-y-2 text-xs">
                {[["Solar PV System", "Awaiting approved rate"], ["Inverter & Accessories", "Awaiting approved rate"], ["Mounting & Accessories", "Awaiting approved rate"], ["Installation & Commissioning", "Awaiting approved rate"]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-600">{label}</span><strong className="text-right text-slate-900">{value}</strong></div>)}
                <div className="flex justify-between gap-3 rounded-lg bg-slate-100 px-3 py-2.5 font-extrabold"><span>Total Cost (Before Subsidy)</span><span>Awaiting verified input</span></div>
                <div className="flex justify-between gap-3 rounded-lg bg-amber-100 px-3 py-2.5 font-black text-slate-950"><span>Net Payable Amount</span><span>Awaiting verified input</span></div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-slate-500">Prices remain blank until approved equipment and installation rates are connected.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3"><ShieldCheck size={21} className="text-emerald-700" /><h2 className="text-base font-black text-slate-950">Subsidy / Incentive</h2></div>
              <div className="mt-3 rounded-xl bg-emerald-50 p-3"><p className="text-xl font-black text-emerald-900">{formatCurrency(selected.subsidyAmount)}</p><p className="mt-1 text-[10px] font-bold text-amber-800">{selected.subsidyLabel}</p></div>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-950"><Info size={15} className="mt-0.5 shrink-0" />This is not an eligibility decision or a verified government benefit. Check the latest official scheme and DISCOM requirements.</div>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">{selected.notes}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-28 bg-slate-100"><img src={rooftopImage} alt="Rooftop solar panels on a home" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#08243f]/70 to-transparent" /><p className="absolute bottom-3 left-4 text-lg font-black text-white">Quotation Summary</p></div>
            <div className="space-y-3 p-4 sm:p-5">
              <div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">System Size</span><strong>{selected.systemSizeKw} kW</strong></div>
              <div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">Total Cost (Before Subsidy)</span><strong>Awaiting rates</strong></div>
              <div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">Government Subsidy*</span><strong className="text-emerald-800">{formatCurrency(selected.subsidyAmount)}</strong></div>
              <div className="flex justify-between gap-3 rounded-lg bg-amber-100 px-3 py-3 text-sm font-black"><span>Net Payable Amount</span><span>Awaiting input</span></div>
              <div className="border-t border-slate-100 pt-3"><h3 className="text-sm font-black text-slate-950">Next Steps</h3><ol className="mt-3 space-y-3 text-xs"><li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-700" /><span><strong>Quotation prepared</strong><span className="block text-[10px] text-slate-500">{selected.createdAt}</span></span></li><li className="flex items-center gap-2"><span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-emerald-600 text-emerald-700">●</span><span><strong>Review & Decide</strong><span className="block text-[10px] text-slate-500">Awaiting homeowner review</span></span></li><li className="flex items-center gap-2 text-slate-500"><span className="h-[18px] w-[18px] rounded-full border-2 border-slate-300" /><span>Schedule Installation</span></li><li className="flex items-center gap-2 text-slate-500"><span className="h-[18px] w-[18px] rounded-full border-2 border-slate-300" /><span>System Installation & Commissioning</span></li></ol></div>
              <button type="button" onClick={() => { updateQuoteDecision(selected.id, "Accepted in demo session"); setNotice({ tone: "success", message: "Your acceptance was recorded in this page session only. No contract, payment or installation was created." }); }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white hover:bg-emerald-800"><CheckCircle2 size={17} /> Accept Quotation (Demo)</button>
              <button type="button" onClick={() => setRequestingChanges((value) => !value)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"><MessageSquareText size={17} /> Request Changes</button>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><CircleHelp size={18} className="text-emerald-700" /> Quote Record</h3>
            <p className="mt-2 text-xs text-slate-600">Quotation ID: <strong className="text-slate-900">{selected.id}</strong></p><p className="mt-1 text-xs text-slate-600">Project ID: <strong className="text-slate-900">{selected.projectId}</strong></p><p className="mt-1 text-xs text-slate-600">Created: <strong className="text-slate-900">{selected.createdAt}</strong></p>
          </section>
        </aside>
      </section>

      {requestingChanges && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="block text-xs font-extrabold text-slate-800">What would you like the team to review?</label><textarea value={changeMessage} onChange={(event) => setChangeMessage(event.target.value)} maxLength={500} rows={3} placeholder="Enter your request (10–500 characters)" className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-600" /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] text-slate-500">{changeMessage.length}/500 · session-only</span><button type="button" disabled={changeMessage.trim().length < 10} onClick={() => { updateQuoteDecision(selected.id, "Changes requested in demo session"); setChangeMessage(""); setRequestingChanges(false); setNotice({ tone: "success", message: "Your sample change request was kept in this page session only; it was not sent to the sales team." }); }} className="rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 disabled:opacity-40">Submit Request (Demo)</button></div></section>}

      <p className="text-[10px] leading-5 text-slate-500">*Annual generation uses the fixed 1,400 units per kW per year assumption. Pricing is not calculated until approved rates are integrated. Subsidy is based on the unverified client-brief demo rule. Payment options and PDF generation are not connected.</p>
    </div>
  );
}

export default HomeownerQuotationsPage;
