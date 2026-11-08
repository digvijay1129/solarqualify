import { Calculator } from "lucide-react";
import { calculateSubsidy, formatINRCompact } from "../utils/pricing-calculations.js";

function SubsidyCalculatorCard({ rule, selectedCapacityKw, onCapacityChange }) {
  const amount = calculateSubsidy(selectedCapacityKw, rule);
  return (
    <section className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <Calculator size={30} className="shrink-0 text-brand-emerald" />
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Subsidy Calculator</h2>
          <p className="text-xs text-brand-muted">Estimate illustrative subsidy for a given system size.</p>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,190px)]">
        <label className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-sm font-bold text-brand-text">System Capacity</span>
          <select value={selectedCapacityKw} onChange={(event) => onCapacityChange(Number(event.target.value))} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-brand-text outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20">
            {[1, 2, 3].map((capacity) => <option key={capacity} value={capacity}>{capacity} kW</option>)}
          </select>
        </label>
        <div className="rounded-xl bg-green-100 px-3 py-2 text-center">
          <p className="text-xs font-bold text-brand-text">Applicable Subsidy*</p>
          <p className="text-2xl font-extrabold tracking-tight text-green-800">{formatINRCompact(amount)}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-brand-muted">*Illustrative result under an unverified demo rule. Not an eligibility decision.</p>
    </section>
  );
}

export default SubsidyCalculatorCard;
