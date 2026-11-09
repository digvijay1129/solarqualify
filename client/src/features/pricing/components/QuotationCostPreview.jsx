import { ChartNoAxesColumnIncreasing } from "lucide-react";
import heroImage from "../../../assets/images/solarqualify-hero-rooftop.jpg";
import { calculateAnnualGeneration, calculateApprovedGrossCost, calculateSubsidy, calculateNetInstallationCost, formatINRCompact } from "../utils/pricing-calculations.js";

function QuotationCostPreview({ capacityKw, generation, rates, subsidyRule }) {
  const rate = rates.find((item) => item.systemSizeKw === capacityKw);
  const rateIsActive = rate?.approvalStatus === "active" || rate?.approvalStatus === "approved";
  const equipmentCost = rateIsActive && Number.isFinite(Number(rate.equipmentCost)) ? Number(rate.equipmentCost) : null;
  const installationCost = rateIsActive && Number.isFinite(Number(rate.installationCost)) ? Number(rate.installationCost) : null;
  const grossCost = calculateApprovedGrossCost(rate);
  const hasSubsidyRule = Boolean(subsidyRule?.slabs?.length);
  const subsidyVerified = Boolean(
    hasSubsidyRule &&
    subsidyRule?.status === "active" &&
    subsidyRule?.verificationStatus === "verified"
  );
  const canCalculateNetCost = Boolean(rateIsActive && (!hasSubsidyRule || subsidyVerified));
  const subsidy = !hasSubsidyRule
    ? 0
    : subsidyVerified
      ? calculateSubsidy(capacityKw, subsidyRule)
      : null;
  const netCost = calculateNetInstallationCost(
    grossCost,
    subsidy,
    canCalculateNetCost
  );
  const annualGeneration = generation?.unitsPerKWPerYear == null ? null : calculateAnnualGeneration(capacityKw, generation.unitsPerKWPerYear);

  const rows = [
    { label: "Selected System Size", value: `${capacityKw} kW`, strong: true },
    { label: generation?.unitsPerKWPerYear == null ? "Annual Generation" : `Annual Generation (${generation.unitsPerKWPerYear.toLocaleString("en-IN")} units per kW)`, value: annualGeneration == null ? "Awaiting active generation rule" : `${annualGeneration.toLocaleString("en-IN")} units/year`, pending: annualGeneration == null },
    { label: "Equipment / Module Cost", value: equipmentCost === null ? "Awaiting active pricing rule" : formatINRCompact(equipmentCost), pending: equipmentCost === null },
    { label: "Installation Charges", value: installationCost === null ? "Awaiting active pricing rule" : formatINRCompact(installationCost), pending: installationCost === null },
    { label: "Total Installation Cost", value: grossCost === null ? "Awaiting active pricing rule" : formatINRCompact(grossCost), highlight: true, pending: grossCost === null },
    { label: "Applicable Subsidy Estimate", value: !hasSubsidyRule ? "No verified active rule · ₹0" : subsidyVerified ? formatINRCompact(subsidy) : "Awaiting verified active rule", pending: hasSubsidyRule && !subsidyVerified },
    { label: "Net Installation Cost", value: netCost === null ? "Awaiting verified pricing and subsidy rules" : formatINRCompact(netCost), highlight: true, pending: netCost === null },
  ];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center gap-3"><ChartNoAxesColumnIncreasing size={30} className="shrink-0 text-brand-emerald" /><div className="min-w-0"><h2 className="text-lg font-extrabold tracking-tight text-brand-text">Quotation Cost Preview</h2><p className="text-xs text-brand-muted">Illustrative preview based on the currently active rule snapshots, not an issued quotation.</p></div></div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]"><div className="min-w-0 space-y-0.5">{rows.map((row) => <div key={row.label} className={`flex min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs sm:text-sm ${row.highlight ? "bg-green-100 font-extrabold text-brand-text" : row.strong ? "font-bold text-brand-text" : "text-brand-text"}`}><span className="min-w-0">{row.label}</span><span className={`shrink-0 text-right ${row.pending ? "rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-950" : "font-semibold"}`}>{row.value}</span></div>)}</div><div className="hidden min-h-[210px] rounded-xl bg-cover bg-center sm:block" style={{ backgroundImage: `linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.15)), url(${heroImage})` }} role="img" aria-label="Illustrative rooftop solar installation" /></div>
      <p className="mt-3 text-[10px] leading-4 text-brand-muted">The backend quotation calculator uses effective-dated active pricing and generation rules, and only a verified active subsidy rule. Previously issued quotations retain immutable snapshots.</p>
    </section>
  );
}

export default QuotationCostPreview;
