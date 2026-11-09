import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, FileText, RefreshCw, ShieldCheck, Sun, UserRound, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../authentication/context/AuthContext.jsx";
import { claimLead } from "../../leads/services/leads.service.js";
import {
  createFormalQuotation,
  downloadSavedQuotationPdf,
  getQuotationBuilderData,
  getQuotationLeadContext,
  getSavedLeadQuotations,
} from "../services/quotation-builder.service.js";
import QuotationBuilderHero from "../components/QuotationBuilderHero.jsx";

const currency = (value) => value == null
  ? "Not available"
  : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

function unwrapStatus(value) {
  return String(value ?? "").toLowerCase().replaceAll("_", "-");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = globalThis.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  globalThis.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function QuotationBuilderLoading() {
  return <div className="space-y-5" aria-label="Loading live quotation builder"><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /><div className="h-20 animate-pulse rounded-2xl bg-slate-200" /><div className="h-96 animate-pulse rounded-2xl bg-slate-200" /></div>;
}

function QuotationBuilderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [confirmedLeadId, setConfirmedLeadId] = useState("");
  const [notice, setNotice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const builderQuery = useQuery({
    queryKey: ["quotation-builder", "live"],
    queryFn: getQuotationBuilderData,
    staleTime: 30_000,
  });

  const leads = builderQuery.data?.leads ?? [];
  useEffect(() => {
    if (!selectedLeadId && leads.length) {
      const firstQualified = leads.find((lead) => unwrapStatus(lead.status) === "qualified");
      setSelectedLeadId((firstQualified ?? leads[0]).id);
    }
  }, [leads, selectedLeadId]);

  const leadContextQuery = useQuery({
    queryKey: ["quotation-builder", "lead", selectedLeadId],
    queryFn: () => getQuotationLeadContext(selectedLeadId),
    enabled: Boolean(selectedLeadId),
    staleTime: 10_000,
  });

  const hasConfirmedAccess = Boolean(selectedLeadId && selectedLeadId === confirmedLeadId);
  const quotationsQuery = useQuery({
    queryKey: ["quotation-builder", "history", selectedLeadId],
    queryFn: () => getSavedLeadQuotations(selectedLeadId),
    enabled: hasConfirmedAccess,
    staleTime: 0,
  });

  const claimMutation = useMutation({
    mutationFn: () => claimLead(selectedLeadId, user.id),
    onSuccess: async () => {
      setConfirmedLeadId(selectedLeadId);
      setNotice({ tone: "success", message: "Lead assignment confirmed. You can now retrieve its saved quotations and generate a quotation." });
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      await queryClient.invalidateQueries({ queryKey: ["quotation-builder", "lead", selectedLeadId] });
      await queryClient.invalidateQueries({ queryKey: ["quotation-builder", "history", selectedLeadId] });
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "The lead could not be assigned to your account." }),
  });

  const rules = builderQuery.data?.rules;
  const activeRules = rules?.activeRules;
  const ruleConflicts = rules?.conflicts ?? {};
  const ruleReady = Boolean(
    activeRules?.pricing?.id &&
    activeRules?.generation?.id &&
    !ruleConflicts.pricing &&
    !ruleConflicts.generation &&
    !ruleConflicts.subsidies
  );

  const lead = leadContextQuery.data?.lead;
  const qualification = leadContextQuery.data?.qualification;
  const isQualified = unwrapStatus(lead?.status) === "qualified";
  const hasScore = Number.isFinite(qualification?.leadScore);
  const canGenerate = Boolean(hasConfirmedAccess && isQualified && hasScore && ruleReady);

  const generateMutation = useMutation({
    mutationFn: () => createFormalQuotation(selectedLeadId, activeRules, rules.referenceDate),
    onSuccess: async (quotation) => {
      setNotice({ tone: "success", message: `Quotation ${quotation?.quotationNumber ?? ""} was generated and saved successfully.` });
      await queryClient.invalidateQueries({ queryKey: ["quotation-builder", "history", selectedLeadId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "The backend could not generate this quotation." }),
  });

  const sortedQuotations = useMemo(
    () => [...(quotationsQuery.data ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [quotationsQuery.data]
  );

  function handleLeadChange(leadId) {
    setSelectedLeadId(leadId);
    setConfirmedLeadId("");
    setNotice(null);
  }

  async function downloadPdf(quotation) {
    if (downloadingId) return;
    setDownloadingId(quotation.id);
    setNotice(null);
    try {
      const blob = await downloadSavedQuotationPdf(quotation.id);
      downloadBlob(blob, `${quotation.quotationNumber || quotation.id}.pdf`);
      setNotice({ tone: "success", message: `PDF download started for ${quotation.quotationNumber || "the saved quotation"}.` });
    } catch (error) {
      setNotice({ tone: "error", message: error?.message || "The quotation PDF could not be downloaded." });
    } finally {
      setDownloadingId(null);
    }
  }

  if (builderQuery.isPending) return <QuotationBuilderLoading />;
  if (builderQuery.isError) {
    return <section className="rounded-2xl border border-red-200 bg-white p-8"><h2 className="text-lg font-bold text-slate-950">Quotation Builder could not be loaded</h2><p className="mt-2 text-sm text-slate-600">{builderQuery.error?.message}</p><button type="button" onClick={() => builderQuery.refetch()} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Retry</button></section>;
  }

  return (
    <div className="min-w-0 space-y-5">
      <QuotationBuilderHero />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="block min-w-0 flex-1"><span className="mb-1.5 block text-sm font-bold text-slate-900">Select a qualified customer lead</span><select value={selectedLeadId} onChange={(event) => handleLeadChange(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"><option value="">Choose a lead</option>{leads.map((item) => <option key={item.id} value={item.id}>{item.referenceId} · {item.name} · {item.status}</option>)}</select></label>
          <button type="button" onClick={() => builderQuery.refetch()} disabled={builderQuery.isFetching} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={builderQuery.isFetching ? "animate-spin" : ""} />Refresh Leads & Rules</button>
        </div>
        {leadContextQuery.isPending && selectedLeadId && <p className="mt-3 text-xs text-slate-500">Loading authorized lead details…</p>}
        {leadContextQuery.isError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{leadContextQuery.error?.message || "Lead details could not be loaded."}</p>}

        {lead && <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-2"><UserRound className="text-emerald-700" size={19} /><div><p className="text-[10px] text-slate-500">Customer</p><p className="text-sm font-bold text-slate-900">{lead.name}</p></div></div>
          <div><p className="text-[10px] text-slate-500">Lead reference / status</p><p className="text-sm font-bold text-slate-900">{lead.referenceId} · {lead.status}</p></div>
          <div><p className="text-[10px] text-slate-500">Monthly consumption</p><p className="text-sm font-bold text-slate-900">{lead.monthlyUnits == null ? "Not provided" : `${lead.monthlyUnits.toLocaleString("en-IN")} units`}</p></div>
          <div><p className="text-[10px] text-slate-500">Monthly electricity bill</p><p className="text-sm font-bold text-slate-900">{currency(lead.monthlyBill)}</p></div>
        </div>}

        {selectedLeadId && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-600">Quotation generation is restricted to a lead assigned to your Sales Staff account.</p>
          <button type="button" onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending || hasConfirmedAccess} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-extrabold text-white disabled:opacity-50"><ShieldCheck size={15} />{claimMutation.isPending ? "Confirming…" : hasConfirmedAccess ? "Lead assignment confirmed" : "Claim / Confirm lead"}</button>
        </div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">Quotation readiness</h2><p className="mt-1 text-xs text-slate-500">The backend calculates recommended capacity and prices from saved, effective-dated rule snapshots.</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold ${canGenerate ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>{canGenerate ? "Ready to generate" : "Requirements pending"}</span></div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ReadinessItem label="Lead qualification" ready={isQualified && hasScore} detail={isQualified && hasScore ? `Score ${qualification.leadScore}/100` : "Lead must be qualified and scored"} />
          <ReadinessItem label="Pricing & generation" ready={Boolean(activeRules?.pricing?.id && activeRules?.generation?.id && !ruleConflicts.pricing && !ruleConflicts.generation)} detail={activeRules?.pricing && activeRules?.generation ? `Pricing v${activeRules.pricing.version} · Generation v${activeRules.generation.version}` : "One active rule of each type is required"} />
          <ReadinessItem label="Subsidy rule" ready={!ruleConflicts.subsidies} detail={ruleConflicts.subsidies ? "Multiple verified active rules; resolve overlap" : activeRules?.subsidies ? `Verified v${activeRules.subsidies.version}` : "No verified active subsidy; quotation uses ₹0"} />
        </div>
        {qualification && <p className="mt-3 text-[11px] leading-5 text-slate-500">Qualification scoring version: {qualification.scoringVersion || qualification.qualificationScoringVersion || "Not reported"}. A low score is not an automatic rejection; the backend only requires a saved qualification result.</p>}
        {(!isQualified || !hasScore) && lead && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">This lead is not yet ready. Use Lead Management to review bill data, confirm the lead and complete qualification before generating a quotation.</p>}
        {(ruleConflicts.pricing || ruleConflicts.generation || ruleConflicts.subsidies) && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">Overlapping active rules were detected. Resolve the overlap in Pricing & Subsidy before creating a quotation.</p>}
        <button type="button" onClick={() => navigate("/pricing")} className="mt-3 text-xs font-bold text-emerald-800 underline underline-offset-2">Open Pricing & Subsidy rule management</button>
        <button type="button" onClick={() => navigate("/leads")} className="ml-4 mt-3 text-xs font-bold text-emerald-800 underline underline-offset-2">Open Lead Management</button>
        <button type="button" onClick={() => generateMutation.mutate()} disabled={!canGenerate || generateMutation.isPending} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{generateMutation.isPending ? "Calculating & saving quotation…" : <><Sun size={18} />Generate & Save Formal Quotation</>}</button>
      </section>

      {generateMutation.data && <QuotationResultCard quotation={generateMutation.data} />}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">Saved Quotations</h2><p className="mt-1 text-xs text-slate-500">Saved quotation snapshots for the selected lead. PDF files are generated by the backend.</p></div><button type="button" onClick={() => quotationsQuery.refetch()} disabled={!hasConfirmedAccess || quotationsQuery.isFetching} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold disabled:opacity-40"><RefreshCw size={14} />Refresh</button></div>
        {!hasConfirmedAccess ? <p className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">Confirm the lead assignment to retrieve its saved quotation history.</p>
          : quotationsQuery.isPending ? <p className="mt-4 text-xs text-slate-500">Loading saved quotations…</p>
          : quotationsQuery.isError ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-800">{quotationsQuery.error?.message || "Quotation history could not be loaded."}</p>
          : sortedQuotations.length ? <div className="mt-4 space-y-3">{sortedQuotations.map((quotation) => <QuotationHistoryRow key={quotation.id} quotation={quotation} onDownload={() => downloadPdf(quotation)} downloading={downloadingId === quotation.id} />)}</div>
          : <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center"><FileText className="mx-auto text-slate-400" size={28} /><p className="mt-2 text-sm font-bold text-slate-900">No saved quotations yet</p><p className="mt-1 text-xs text-slate-500">Generate a formal quotation after the selected lead meets the backend requirements.</p></div>}
      </section>

      {notice && <div role={notice.tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{notice.message}</div>}
      <p className="text-[11px] leading-5 text-slate-500">The server computes system capacity, annual generation, cost, subsidy, savings and payback using the selected effective rules, verified bill consumption where available, and lead-form consumption as fallback. The screen does not invent a customer-selected capacity or rewrite historical quotations.</p>
    </div>
  );
}

function ReadinessItem({ label, ready, detail }) {
  return <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-900">{label}</p>{ready ? <CheckCircle2 size={17} className="text-emerald-700" /> : <AlertCircle size={17} className="text-amber-600" />}</div><p className="mt-2 text-[11px] leading-5 text-slate-600">{detail}</p></div>;
}

function QuotationResultCard({ quotation }) {
  const rows = [
    ["System capacity", `${quotation.systemCapacityKW} kW`],
    ["Estimated annual generation", `${Number(quotation.estimatedAnnualGeneration).toLocaleString("en-IN")} units`],
    ["Annual consumption", quotation.annualConsumptionUnits == null ? "Not available" : `${Number(quotation.annualConsumptionUnits).toLocaleString("en-IN")} units`],
    ["Consumption coverage", quotation.consumptionCoveragePercent == null ? "Not available" : `${quotation.consumptionCoveragePercent}%`],
    ["Equipment cost", currency(quotation.equipmentCost)],
    ["Installation charges", currency(quotation.installationCharges)],
    ["Gross installation cost", currency(quotation.totalInstallationCost)],
    ["Subsidy estimate", currency(quotation.applicableSubsidy)],
    ["Net installation cost", currency(quotation.netInstallationCost)],
    ["Estimated annual savings", currency(quotation.estimatedAnnualSavings)],
    ["Estimated payback", quotation.estimatedPaybackYears == null ? "Not available" : `${quotation.estimatedPaybackYears} years`],
  ];
  return <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">Saved formal quotation</p><h2 className="mt-1 text-xl font-black text-slate-950">{quotation.quotationNumber || "Quotation generated"}</h2></div><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900">{quotation.quotationStatus}</span></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{rows.map(([label,value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-600">{label}</span><strong className="text-right text-xs text-slate-950">{value}</strong></div>)}</div><div className="mt-4"><p className="text-xs font-bold text-slate-900">Calculation explanation</p><ul className="mt-2 space-y-2">{(quotation.calculationReasons ?? []).map((reason) => <li key={reason.code} className="border-l-2 border-emerald-200 pl-3"><p className="text-xs font-bold text-slate-900">{reason.label}</p><p className="mt-0.5 text-[11px] leading-5 text-slate-600">{reason.detail}</p></li>)}</ul></div></section>;
}

function QuotationHistoryRow({ quotation, onDownload, downloading }) {
  return <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div className="min-w-0"><p className="break-all text-sm font-extrabold text-slate-950">{quotation.quotationNumber || quotation.id}</p><p className="mt-1 text-[11px] text-slate-500">{quotation.quotationStatus} · {new Date(quotation.createdAt).toLocaleString("en-IN")}</p><p className="mt-1 text-xs font-semibold text-slate-700">{quotation.systemCapacityKW} kW · {currency(quotation.netInstallationCost)}</p></div><button type="button" onClick={onDownload} disabled={downloading || quotation.quotationStatus === "draft"} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-700 px-3 text-xs font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"><Download size={15} />{downloading ? "Preparing…" : "Download PDF"}</button></article>;
}

export default QuotationBuilderPage;
