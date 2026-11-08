import { useMemo } from "react";
import { FileText, Sun, Zap, Layers3, Percent, IndianRupee, PiggyBank, Clock } from "lucide-react";
import { calculateAnnualGeneration, formatINR } from "../utils/quotation-calculations.js";

function QuotationSummaryCard({ capacityKw, generation, pricing, subsidyRule, economics }) {
  const annualGeneration = useMemo(
    () => calculateAnnualGeneration(capacityKw, generation.unitsPerKwPerYear),
    [capacityKw, generation.unitsPerKwPerYear]
  );
  const pricingVerified = pricing.status === "verified";
  const totalCost = pricingVerified
    ? Number(pricing.equipmentCost || 0) + Number(pricing.installationCharges || 0)
    : null;

  const rows = [
    { label: "Total Installation Cost", value: totalCost === null ? null : formatINR(totalCost), icon: Layers3 },
    { label: "Applicable Subsidy", value: subsidyRule.status === "verified" ? "Eligibility calculation pending" : null, icon: Percent },
    { label: "Net Installation Cost", value: null, icon: IndianRupee, highlight: true },
    { label: "Estimated Savings", value: economics.estimatedSavings === null ? null : formatINR(economics.estimatedSavings), icon: PiggyBank, info: true },
    { label: "Payback Period", value: economics.paybackYears === null ? null : `${economics.paybackYears} years`, icon: Clock, info: true },
  ];

  return (
    <section id="quotation-summary" className="scroll-mt-24 h-full rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="-mx-4 -mt-4 flex items-center gap-3 rounded-t-2xl bg-gradient-to-r from-green-50 to-green-100/80 px-4 py-4 sm:-mx-5 sm:-mt-5 sm:px-5">
        <FileText size={27} className="text-brand-emerald" aria-hidden="true" />
        <h2 className="text-lg font-bold text-brand-text">Quotation Summary</h2>
      </div>

      <div className="mt-4 space-y-0">
        <SummaryRow label="Selected Capacity" value={`${capacityKw} kW`} icon={Sun} />
        <SummaryRow label="Annual Generation" value={`${annualGeneration.toLocaleString("en-IN")} units`} icon={Zap} />
        {rows.map((row) => (
          <SummaryRow key={row.label} {...row} value={row.value ?? "Awaiting verified input"} />
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold text-brand-text">Quotation readiness</p>
        <p className="mt-1 text-[11px] leading-5 text-brand-muted">
          Approved pricing, subsidy eligibility and tariff inputs are required before a final net cost, savings or payback can be calculated.
        </p>
      </div>
    </section>
  );
}

function SummaryRow({ label, value, icon: Icon, highlight = false, info = false }) {
  return (
    <div className={[
      "flex min-w-0 items-center justify-between gap-2 border-b border-slate-100 px-2 py-3",
      highlight ? "my-1 rounded-lg border-0 bg-green-100" : "",
    ].join(" ")}>
      <div className="flex min-w-0 items-center gap-2">
        <Icon size={21} className="shrink-0 text-brand-emerald" aria-hidden="true" />
        <span className="text-xs font-semibold text-brand-text sm:text-sm">{label}</span>
        {info && <span title="Requires verified inputs" className="text-xs text-slate-400">ⓘ</span>}
      </div>
      <span className={[
        "max-w-[56%] text-right text-xs font-bold sm:text-sm",
        value === "Awaiting verified input" ? "rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600 sm:text-xs" : "text-brand-text",
      ].join(" ")}>{value}</span>
    </div>
  );
}

export default QuotationSummaryCard;
