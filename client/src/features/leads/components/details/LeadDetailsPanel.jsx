import {
  UserRound, Phone, Mail, MapPin, X, IndianRupee,
  BadgeCheck, Target, AlertCircle, RefreshCw, UserCheck,
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
});

const priorityStyles = {
  High: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-yellow-100 text-yellow-800",
};

const statusStyles = {
  Qualified: "bg-green-100 text-green-800",
  "In Progress": "bg-slate-100 text-slate-700",
  New: "bg-blue-100 text-blue-800",
  Converted: "bg-purple-100 text-purple-800",
  Lost: "bg-red-100 text-red-800",
};

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-brand-text" aria-hidden="true" />
      <div className="min-w-0"><p className="break-all text-sm font-medium text-brand-text">{value || "Not provided"}</p><p className="mt-0.5 text-xs text-brand-muted">{label}</p></div>
    </div>
  );
}

function LeadDetailsPanel({
  lead,
  qualification,
  qualificationLoading = false,
  detailLoading = false,
  detailError = null,
  onRetryDetails = () => {},
  onClose = () => {},
  onClaim = () => {},
  onQualify = () => {},
  claiming = false,
  qualifying = false,
  canQualify = false,
  actionNotice = null,
}) {
  if (!lead) {
    return <aside className="rounded-2xl border border-brand-border bg-white p-8 text-center shadow-card"><UserRound size={32} className="mx-auto text-brand-muted" aria-hidden="true" /><h2 className="mt-3 text-base font-semibold text-brand-text">Lead Details</h2><p className="mt-2 text-sm text-brand-muted">Select a customer from the table to view the live lead record.</p></aside>;
  }

  const hasScore = qualification?.evaluatedAt && Number.isFinite(qualification.leadScore);
  const reasons = qualification?.reasons ?? [];
  const dataGaps = qualification?.dataGaps ?? [];

  return (
    <aside aria-label="Selected lead details" className="h-fit rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-brand-text">Lead Details</h2><p className="mt-1 text-xs text-brand-muted">Live database record</p></div><button type="button" onClick={onClose} aria-label="Close lead details" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-background hover:text-brand-text"><X size={19} aria-hidden="true" /></button></div>

      <div className="mt-5 flex items-center gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#078B37]"><UserRound size={30} strokeWidth={2} aria-hidden="true" /></div><div className="min-w-0"><h3 className="break-words text-base font-bold text-brand-text">{lead.name}</h3><p className="mt-1 text-sm font-medium text-brand-muted">{lead.referenceId}</p></div></div>

      {detailLoading && <p className="mt-3 text-[11px] text-slate-500">Refreshing full lead details…</p>}
      {detailError && <div role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900"><p>Full lead details could not be refreshed. The list record is shown.</p><button type="button" onClick={onRetryDetails} className="mt-1 font-bold underline">Retry details</button></div>}
      <div className="mt-5 space-y-4"><DetailItem icon={Phone} label="Phone" value={lead.phone} /><DetailItem icon={Mail} label="Email" value={lead.email} /><DetailItem icon={MapPin} label="Property address" value={lead.location} /><DetailItem icon={BadgeCheck} label="Property type and ownership" value={[lead.propertyType, lead.ownership].filter(Boolean).join(" · ")} /><DetailItem icon={IndianRupee} label="Created" value={lead.createdAt ? new Date(lead.createdAt).toLocaleString("en-IN") : "Not recorded"} /></div>

      <div className="mt-5 grid grid-cols-2 divide-x divide-brand-border rounded-xl border border-brand-border bg-white">
        <div className="min-w-0 p-3"><p className="text-xs font-medium text-brand-muted">Monthly Bill</p><p className="mt-1 break-words text-lg font-bold text-brand-text">{lead.monthlyBill == null ? "Not provided" : currencyFormatter.format(lead.monthlyBill)}</p></div>
        <div className="min-w-0 p-3"><p className="text-xs font-medium text-brand-muted">Monthly Units</p><p className="mt-1 text-lg font-bold text-brand-text">{lead.monthlyUnits == null ? "Not provided" : `${lead.monthlyUnits} units`}</p></div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div><p className="mb-2 text-xs font-semibold text-brand-text">Priority</p><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${priorityStyles[lead.priority] ?? "bg-gray-100 text-gray-700"}`}>{lead.priority}</span></div>
        <div><p className="mb-2 text-xs font-semibold text-brand-text">Status</p><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[lead.status] ?? "bg-gray-100 text-gray-700"}`}>{lead.status}</span></div>
      </div>

      <section className="mt-5 rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-black text-slate-950"><Target size={17} className="text-emerald-700" /> Qualification score</h3>{hasScore && <span className="text-xl font-black text-emerald-800">{qualification.leadScore}/100</span>}</div>
        {qualificationLoading ? <p className="mt-3 text-xs text-slate-500">Loading qualification result…</p> : hasScore ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${qualification.leadScore}%` }} /></div>
            <p className="mt-2 text-[10px] text-slate-500">Model {qualification.scoringVersion || "version not reported"} · Evaluated {new Date(qualification.evaluatedAt).toLocaleString("en-IN")}</p>
            {reasons.length > 0 && <div className="mt-3 space-y-2">{reasons.map((reason, index) => <div key={reason.code || index} className="border-l-2 border-emerald-100 pl-2"><p className="text-[11px] font-bold text-slate-900">{reason.label || reason.code} {reason.points != null ? `· ${reason.points}/${reason.maxPoints}` : ""}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-600">{reason.detail}</p></div>)}</div>}
            {dataGaps.length > 0 && <div className="mt-3 rounded-lg bg-amber-50 p-3"><p className="flex items-center gap-1 text-[11px] font-extrabold text-amber-950"><AlertCircle size={14} /> Data gaps to review</p><ul className="mt-1 list-disc space-y-1 pl-4 text-[10px] leading-4 text-amber-900">{dataGaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></div>}
          </>
        ) : <p className="mt-2 text-xs leading-5 text-slate-600">This lead has not been scored yet. Claim or confirm assignment to your Sales Staff account before calculating its score.</p>}
        <button type="button" disabled={qualifying || !canQualify} onClick={onQualify} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={14} className={qualifying ? "animate-spin" : ""} />{qualifying ? "Calculating…" : !canQualify ? "Confirm assignment to score" : hasScore ? "Recalculate score" : "Calculate qualification score"}</button>
      </section>

      <div className="mt-4 space-y-2">
        <button type="button" onClick={onClaim} disabled={claiming} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"><UserCheck size={17} />{claiming ? "Assigning…" : "Assign / Confirm to me"}</button>
        {actionNotice && <p role="status" className={`rounded-lg p-2.5 text-xs leading-5 ${actionNotice.tone === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>{actionNotice.message}</p>}
      </div>

      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Lead score is an explainable follow-up indicator only. A low score does not automatically reject a lead or establish solar, subsidy or regulatory eligibility.</p>
    </aside>
  );
}

export default LeadDetailsPanel;
