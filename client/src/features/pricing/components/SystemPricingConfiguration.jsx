import { CalendarDays, Info, Settings2 } from "lucide-react";
import { formatINRCompact } from "../utils/pricing-calculations.js";

function SystemPricingConfiguration({ rates = [], activeRule = null, conflict = false, onCreateVersion = () => {} }) {
  return (
    <section id="pricing-configuration" className="min-w-0 scroll-mt-5 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-4 flex min-w-0 items-start gap-3">
        <Settings2 size={30} className="shrink-0 text-brand-emerald" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-brand-text">System Pricing Configuration</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${activeRule ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>{activeRule ? `Active v${activeRule.version}` : "No effective active rule"}</span>
          </div>
          <p className="mt-0.5 text-xs text-brand-muted">Rates are read from the active, effective-dated pricing rule. Pricing is stored as price per kW plus fixed installation charges.</p>
        </div>
      </div>

      {conflict && <div role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">More than one active pricing rule is effective today. The quotation calculation API requires exactly one applicable rule; deactivate or correct the overlapping version before generating quotations.</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Rule name</p><p className="mt-1 break-words text-sm font-extrabold text-slate-950">{activeRule?.ruleName ?? "Not configured"}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Price per kW</p><p className="mt-1 text-sm font-extrabold text-slate-950">{activeRule ? formatINRCompact(activeRule.pricePerKW) : "Awaiting active rule"}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Installation charges</p><p className="mt-1 text-sm font-extrabold text-slate-950">{activeRule ? formatINRCompact(activeRule.installationCharges) : "Awaiting active rule"}</p></div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[550px] table-fixed border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-brand-text"><tr><th className="px-3 py-3">System Size</th><th className="px-3 py-3">Equipment / Module Cost</th><th className="px-3 py-3">Installation Charges</th><th className="px-3 py-3 text-right">Illustrative Gross Cost</th></tr></thead>
          <tbody>{rates.map((rate) => <tr key={rate.id} className="border-t border-slate-100"><th scope="row" className="bg-green-50 px-3 py-3 text-center font-extrabold text-brand-text">{rate.systemSizeKw} kW</th><td className="px-3 py-3 text-xs text-brand-text">{rate.equipmentCost == null ? "Not configured" : formatINRCompact(rate.equipmentCost)}</td><td className="px-3 py-3 text-xs text-brand-text">{rate.installationCost == null ? "Not configured" : formatINRCompact(rate.installationCost)}</td><td className="px-3 py-3 text-right text-xs font-extrabold text-brand-text">{rate.equipmentCost == null ? "—" : formatINRCompact(rate.equipmentCost + rate.installationCost)}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
        <div className="flex items-start gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-brand-emerald" /><span>Effective period: <strong className="text-slate-900">{activeRule?.effectiveFrom ? new Date(activeRule.effectiveFrom).toLocaleDateString("en-IN") : "Not set"}</strong> to <strong className="text-slate-900">{activeRule?.effectiveTo ? new Date(activeRule.effectiveTo).toLocaleDateString("en-IN") : "No end date"}</strong></span></div>
        <button type="button" onClick={onCreateVersion} className="min-h-9 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800">Create pricing version</button>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-950"><Info size={17} className="mt-0.5 shrink-0 text-amber-700" /><p>Historical quotation snapshots are immutable. Changing or activating a new rule affects only calculations created for its effective period; it does not rewrite previously issued quotations.</p></div>
    </section>
  );
}

export default SystemPricingConfiguration;
