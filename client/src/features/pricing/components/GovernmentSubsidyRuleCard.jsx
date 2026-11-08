import { AlertTriangle, CheckCircle2, Landmark } from "lucide-react";
import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";
import { formatINRCompact } from "../utils/pricing-calculations.js";

function GovernmentSubsidyRuleCard({ rule, onViewDetails }) {
  return (
    <section id="subsidy-rules" className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <Landmark size={30} className="shrink-0 text-brand-emerald" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Government Subsidy Rule</h2>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-extrabold text-amber-900">
              <AlertTriangle size={14} /> UNVERIFIED DEMO RULE
            </span>
          </div>
          <p className="mt-1 text-sm text-brand-text">Subsidy slab (Residential Rooftop Solar)</p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1 space-y-2 rounded-xl bg-green-50 p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-text">
            <CheckCircle2 size={18} className="shrink-0 fill-green-700 text-white" />
            <span>{formatINRCompact(rule.firstTwoKwPerKw)} per kW for the first 2 kW</span>
          </p>
          <p className="flex items-center gap-2 text-sm font-bold text-brand-text">
            <CheckCircle2 size={18} className="shrink-0 fill-green-700 text-white" />
            <span>{formatINRCompact(rule.thirdKw)} for the third kW</span>
          </p>
          <p className="flex items-center gap-2 text-sm font-bold text-brand-text">
            <CheckCircle2 size={18} className="shrink-0 fill-green-700 text-white" />
            <span>Maximum subsidy: {formatINRCompact(rule.maximumSubsidy)}</span>
          </p>
        </div>
        <div className="hidden h-24 w-32 shrink-0 rounded-xl bg-cover bg-center sm:block" style={{ backgroundImage: `url(${heroImage})` }} role="img" aria-label="Illustrative rooftop solar panels" />
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
        <p>This is a demo rule based on the client brief. Please confirm the latest official MNRE / DISCOM policy before production use.</p>
      </div>
      <button type="button" onClick={onViewDetails} className="mt-3 text-xs font-semibold text-brand-emerald underline-offset-2 hover:underline">
        View rule status and limitations
      </button>
    </section>
  );
}

export default GovernmentSubsidyRuleCard;
