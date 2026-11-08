import { ChartNoAxesColumnIncreasing } from "lucide-react";
import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";
import { calculateAnnualGeneration, calculateApprovedGrossCost, calculateSubsidy, calculateNetInstallationCost, formatINRCompact } from "../utils/pricing-calculations.js";

function QuotationCostPreview({ capacityKw, generation, rates, subsidyRule }) {
  const rate = rates.find((item) => item.systemSizeKw === capacityKw);
  const equipmentCost = rate?.approvalStatus === "approved" && Number.isFinite(Number(rate.equipmentCost)) ? Number(rate.equipmentCost) : null;
  const installationCost = rate?.approvalStatus === "approved" && Number.isFinite(Number(rate.installationCost)) ? Number(rate.installationCost) : null;
  const grossCost = calculateApprovedGrossCost(rate);
  const subsidy = calculateSubsidy(capacityKw, subsidyRule);
  const isVerified = Boolean(rate?.approvalStatus === "approved" && subsidyRule.verificationStatus === "verified");
  const netCost = calculateNetInstallationCost(grossCost, subsidy, isVerified);
  const annualGeneration = calculateAnnualGeneration(capacityKw, generation.unitsPerKwPerYear);

  const rows = [
    { label: "Selected System Size", value: `${capacityKw} kW`, strong: true },
    { label: `Annual Generation (${generation.unitsPerKwPerYear.toLocaleString("en-IN")} units per kW)`, value: `${annualGeneration?.toLocaleString("en-IN")} units/year` },
    { label: "Equipment Cost", value: equipmentCost === null ? "Awaiting approved rate" : formatINRCompact(equipmentCost), pending: equipmentCost === null },
    { label: "Installation Charges", value: installationCost === null ? "Awaiting approved rate" : formatINRCompact(installationCost), pending: installationCost === null },
    { label: "Total Installation Cost", value: grossCost === null ? "Awaiting verified input" : formatINRCompact(grossCost), highlight: true },
    { label: "Applicable Subsidy", value: formatINRCompact(subsidy) },
    { label: "Net Installation Cost", value: netCost === null ? "Awaiting verified input" : formatINRCompact(netCost), highlight: true },
  ];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <ChartNoAxesColumnIncreasing size={30} className="shrink-0 text-brand-emerald" />
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Quotation Cost Preview (Illustrative)</h2>
          <p className="text-xs text-brand-muted">See the cost breakup using configured rates and subsidy rules.</p>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <div className="min-w-0 space-y-0.5">
          {rows.map((row) => (
            <div key={row.label} className={`flex min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs sm:text-sm ${row.highlight ? "bg-green-100 font-extrabold text-brand-text" : row.strong ? "font-bold text-brand-text" : "text-brand-text"}`}>
              <span className="min-w-0">{row.label}</span>
              <span className={`shrink-0 text-right ${row.pending ? "rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-950" : "font-semibold"}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="hidden min-h-[210px] rounded-xl bg-cover bg-center sm:block" style={{ backgroundImage: `linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.15)), url(${heroImage})` }} role="img" aria-label="Illustrative rooftop solar installation" />
      </div>
      <p className="mt-3 text-[10px] leading-4 text-brand-muted">Prices and net cost are not official until an administrator approves rates and the subsidy rule is verified. Previously issued quotations are not recalculated by this preview.</p>
    </section>
  );
}

export default QuotationCostPreview;
