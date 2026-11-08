import { Layers3, Info, Pencil, CircleAlert } from "lucide-react";
import { formatINR } from "../utils/quotation-calculations.js";

function PricingBreakdownCard({ pricing, onConfigure = () => {} }) {
  const configured = pricing.status === "verified";

  return (
    <section id="pricing-subsidy" className="scroll-mt-24 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <Layers3 size={27} className="text-brand-emerald" aria-hidden="true" />
        <h2 className="text-lg font-bold text-brand-text">Pricing Breakdown</h2>
      </div>

      <div className="mt-4 space-y-3">
        <PriceRow label="Equipment Cost (₹)" value={configured ? formatINR(pricing.equipmentCost) : null} onConfigure={onConfigure} />
        <PriceRow label="Installation Charges (₹)" value={configured ? formatINR(pricing.installationCharges) : null} onConfigure={onConfigure} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-green-100 px-3 py-3">
        <span className="text-sm font-bold text-brand-text">Total Installation Cost</span>
        <span className="text-sm font-extrabold text-brand-forest">{configured ? formatINR(Number(pricing.equipmentCost || 0) + Number(pricing.installationCharges || 0)) : "Awaiting verified input"}</span>
      </div>

      {!configured && (
        <div className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-brand-muted">
          <CircleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <p>Approved rates and their effective dates are not configured. No price has been assumed.</p>
        </div>
      )}

      {configured && pricing.effectiveFrom && (
        <p className="mt-2 text-[11px] text-brand-muted">Approved rate effective from {pricing.effectiveFrom}{pricing.effectiveTo ? ` to ${pricing.effectiveTo}` : ""}.</p>
      )}
    </section>
  );
}

function PriceRow({ label, value, onConfigure }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0">
      <span className="flex items-center gap-2 text-xs font-semibold text-brand-text sm:text-sm">
        {label}
        <Info size={14} className="text-slate-400" aria-hidden="true" />
      </span>
      <button type="button" onClick={onConfigure} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-brand-text hover:bg-slate-50">
        {value ?? "Configure approved rate"}
        <Pencil size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export default PricingBreakdownCard;
