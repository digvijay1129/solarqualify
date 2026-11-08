import { CalendarDays, Info, Pencil, Settings2 } from "lucide-react";
import { calculateDraftGrossCost, formatINRCompact, getRateDisplayState } from "../utils/pricing-calculations.js";

function PricingDateField({ label, value, onChange, required = false, error, optional = false }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-brand-text">
        {label}{required ? " *" : ""}{optional ? <span className="font-normal text-brand-muted"> (optional)</span> : ""}
      </span>
      <span className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-brand-border bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-emerald/20">
        <CalendarDays size={17} className="shrink-0 text-brand-emerald" />
        <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-w-0 bg-transparent text-sm text-brand-text outline-none" />
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function SystemPricingConfiguration({
  rates,
  activeVersion = "v2.0",
  effectiveFrom,
  effectiveTo,
  dateErrors = {},
  onEffectiveFromChange,
  onEffectiveToChange,
  onConfigureRate,
}) {
  return (
    <section id="pricing-configuration" className="min-w-0 scroll-mt-5 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-4 flex min-w-0 items-start gap-3">
        <Settings2 size={30} className="shrink-0 text-brand-emerald" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-brand-text">System Pricing Configuration</h2>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">Version: {activeVersion} (Active)</span>
          </div>
          <p className="mt-0.5 text-xs text-brand-muted">Set approved equipment cost and installation charges for each system size.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[610px] table-fixed border-collapse text-sm xl:min-w-0">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[29%]" />
            <col className="w-[31%]" />
            <col className="w-[26%]" />
          </colgroup>
          <thead className="bg-slate-50 text-left text-xs font-bold text-brand-text">
            <tr>
              <th className="px-3 py-2.5">System Size</th>
              <th className="px-3 py-2.5">Equipment Cost (₹)</th>
              <th className="px-3 py-2.5">Installation Charges (₹)</th>
              <th className="px-3 py-2.5 text-right">Total Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => {
              const gross = calculateDraftGrossCost(rate);
              const state = getRateDisplayState(rate);
              return (
                <tr key={rate.id} className="border-t border-slate-100">
                  <th scope="row" className="bg-green-50 px-3 py-2.5 text-center font-extrabold text-brand-text">{rate.systemSizeKw} kW</th>
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => onConfigureRate(rate)} className="flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-left text-xs font-medium text-brand-muted shadow-sm hover:border-brand-emerald hover:text-brand-emerald">
                      <span className="truncate">{rate.equipmentCost ? formatINRCompact(Number(rate.equipmentCost)) : "Configure approved rate"}</span>
                      <Pencil size={15} className="shrink-0" />
                    </button>
                    {state === "draft" && <span className="mt-1 block text-[10px] font-semibold text-amber-700">Draft · approval pending</span>}
                  </td>
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => onConfigureRate(rate)} className="flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-left text-xs font-medium text-brand-muted shadow-sm hover:border-brand-emerald hover:text-brand-emerald">
                      <span className="truncate">{rate.installationCost ? formatINRCompact(Number(rate.installationCost)) : "Configure approved rate"}</span>
                      <Pencil size={15} className="shrink-0" />
                    </button>
                    {state === "draft" && <span className="mt-1 block text-[10px] font-semibold text-amber-700">Draft · approval pending</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-brand-text">
                    {gross === null ? "—" : <span title="Draft amount; not approved">{formatINRCompact(gross)}*</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <PricingDateField label="Effective From" value={effectiveFrom} onChange={onEffectiveFromChange} required error={dateErrors.effectiveFrom} />
        <PricingDateField label="Effective To" value={effectiveTo} onChange={onEffectiveToChange} optional error={dateErrors.effectiveTo} />
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-950">
        <Info size={17} className="mt-0.5 shrink-0 text-amber-700" />
        <p>Changing these draft rates will not modify previously generated quotations. Entries made in this frontend are session-only and are not approved or persisted.</p>
      </div>
    </section>
  );
}

export default SystemPricingConfiguration;
