import { AlertTriangle, CheckCircle2, Landmark } from "lucide-react";
import { formatINRCompact } from "../utils/pricing-calculations.js";

function GovernmentSubsidyRuleCard({ rule, onViewDetails = () => {} }) {
  const slabs = rule?.slabs ?? [];
  const verified = rule?.verificationStatus === "verified" && rule?.status === "active";
  const statusLabel = rule?.status === "not-configured" ? "NOT CONFIGURED" : `${String(rule?.verificationStatus ?? "unverified").toUpperCase()} · ${String(rule?.status ?? "draft").toUpperCase()}`;

  return (
    <section id="subsidy-rules" className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <Landmark size={30} className="shrink-0 text-brand-emerald" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-extrabold tracking-tight text-brand-text">Government Subsidy Rule</h2><span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold ${verified ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-950"}`}>{verified ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{statusLabel}</span></div>
          <p className="mt-1 text-sm text-brand-text">{rule?.ruleName || rule?.title || "No subsidy rule created"}</p>
          {rule?.version && <p className="mt-0.5 text-[11px] text-slate-500">Version {rule.version} · Effective from {rule.effectiveFrom ? new Date(rule.effectiveFrom).toLocaleDateString("en-IN") : "date not set"}</p>}
        </div>
      </div>

      {slabs.length ? <div className="mt-3 space-y-2 rounded-xl bg-green-50 p-3">
        {slabs.map((slab, index) => {
          const lower = index === 0 ? 0 : slabs[index - 1].upToKW;
          return <p key={`${slab.upToKW}-${index}`} className="flex items-center justify-between gap-3 text-sm"><span className="text-brand-text">{lower === 0 ? "Up to" : "Next"} {slab.upToKW} kW{index > 0 ? ` (above ${lower} kW)` : ""}</span><strong className="text-right text-brand-text">{formatINRCompact(slab.amountPerKW)} / kW</strong></p>;
        })}
        <p className="flex items-center justify-between gap-3 border-t border-green-200 pt-2 text-sm font-extrabold text-brand-text"><span>Maximum subsidy</span><span>{formatINRCompact(rule.maximumSubsidy)}</span></p>
      </div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">No subsidy rule version is available. Create a draft version to configure subsidy slabs.</div>}

      {!verified && <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" /><p>This rule is not verified. Unverified subsidy values are not included in SolarQualify quotation calculations.</p></div>}
      <button type="button" onClick={onViewDetails} className="mt-3 text-xs font-semibold text-brand-emerald underline-offset-2 hover:underline">View verification, status and policy limitations</button>
    </section>
  );
}

export default GovernmentSubsidyRuleCard;
