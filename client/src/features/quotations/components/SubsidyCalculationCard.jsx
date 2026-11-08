import { useState } from "react";
import { Percent, AlertTriangle, CircleAlert, X } from "lucide-react";
import { calculateIllustrativeSubsidy, formatINR } from "../utils/quotation-calculations.js";

function SubsidyCalculationCard({ rule, selectedCapacity }) {
  const [showRuleDetails, setShowRuleDetails] = useState(false);
  const estimatedAmount = calculateIllustrativeSubsidy(selectedCapacity, rule);

  return (
    <>
      <section className="rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-center gap-3">
          <Percent size={27} className="text-brand-emerald" aria-hidden="true" />
          <h2 className="text-lg font-bold text-brand-text">Subsidy Calculation</h2>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-xs font-extrabold uppercase text-amber-950">Unverified demo rule</p>
            <p className="mt-1 text-[11px] leading-4 text-amber-900">Illustrative only. Confirm the official policy, current effective dates and customer eligibility before use.</p>
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-brand-text sm:text-sm">
          <RuleLine>₹{rule.firstTwoKwPerKw.toLocaleString("en-IN")} per kW for the first 2 kW</RuleLine>
          <RuleLine>₹{rule.thirdKw.toLocaleString("en-IN")} for the third kW</RuleLine>
          <RuleLine>Maximum subsidy: {formatINR(rule.maximumAmount)}</RuleLine>
          <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] font-medium text-brand-muted">
            Illustrative amount for {selectedCapacity} kW: <strong className="text-brand-text">{formatINR(estimatedAmount)}</strong>
          </div>
        </div>

        <button type="button" onClick={() => setShowRuleDetails(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald hover:underline">
          <CircleAlert size={14} aria-hidden="true" /> View rule status and limitations
        </button>
      </section>

      {showRuleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRuleDetails(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="subsidy-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 id="subsidy-dialog-title" className="text-lg font-bold text-brand-text">Subsidy rule status</h3>
              <button type="button" onClick={() => setShowRuleDetails(false)} aria-label="Close subsidy rule details" className="rounded-lg p-2 text-brand-muted hover:bg-slate-100"><X size={18} /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-brand-muted">This rule is provided for the project demonstration only. No official source, verified effective date or eligibility determination is connected to this frontend package.</p>
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Status: <strong>Unverified demo rule</strong><br />Source note: {rule.source}</p>
            <div className="mt-5 flex justify-end"><button type="button" onClick={() => setShowRuleDetails(false)} className="rounded-lg bg-brand-emerald px-4 py-2 text-sm font-semibold text-white">Close</button></div>
          </section>
        </div>
      )}
    </>
  );
}

function RuleLine({ children }) {
  return <div className="flex items-start gap-2"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-emerald" /><span>{children}</span></div>;
}

export default SubsidyCalculationCard;
