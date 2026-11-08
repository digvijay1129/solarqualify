import { X, FileText } from "lucide-react";
import { calculateAnnualGeneration, calculateIllustrativeSubsidy, formatINR } from "../utils/quotation-calculations.js";

function QuotationPreviewDialog({ open, onClose, customer, capacityKw, generation, pricing, subsidyRule }) {
  if (!open) return null;

  const annualGeneration = calculateAnnualGeneration(capacityKw, generation.unitsPerKwPerYear);
  const illustrativeSubsidy = calculateIllustrativeSubsidy(capacityKw, subsidyRule);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="quotation-preview-title" className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <FileText size={27} className="text-brand-emerald" aria-hidden="true" />
            <div>
              <h2 id="quotation-preview-title" className="text-lg font-bold text-brand-text">Quotation Preview</h2>
              <p className="mt-1 text-xs text-brand-muted">Draft preview — not issued or approved</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close quotation preview" className="rounded-lg p-2 text-brand-muted hover:bg-slate-100"><X size={19} /></button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-brand-muted">Prepared for</p>
              <p className="mt-1 text-base font-bold text-brand-text">{customer.name}</p>
              <p className="text-xs text-brand-muted">Lead {customer.referenceId} · Demo record</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Draft preview</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <PreviewMetric label="System capacity" value={`${capacityKw} kW`} />
            <PreviewMetric label="Annual generation assumption" value={`${annualGeneration.toLocaleString("en-IN")} units`} />
            <PreviewMetric label="Monthly bill (demo)" value={formatINR(customer.monthlyBill)} />
            <PreviewMetric label="Monthly units (demo)" value={`${customer.monthlyUnits} units`} />
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <PreviewLine label="Equipment and installation cost" value={pricing.status === "verified" ? "Configured" : "Awaiting verified input"} />
            <PreviewLine label="Subsidy" value={`${formatINR(illustrativeSubsidy)} (unverified demo rule)`} />
            <PreviewLine label="Net installation cost" value="Awaiting verified input" strong />
            <PreviewLine label="Estimated savings and payback" value="Awaiting verified tariff and cost inputs" />
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          This preview contains illustrative customer, generation and subsidy information. It is not a customer-ready offer. Verify source records, approved rates, subsidy policy and eligibility before issuing a quotation.
        </p>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white">Close Preview</button>
        </div>
      </section>
    </div>
  );
}

function PreviewMetric({ label, value }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-brand-muted">{label}</p><p className="mt-1 text-sm font-bold text-brand-text">{value}</p></div>;
}

function PreviewLine({ label, value, strong = false }) {
  return <div className="flex items-start justify-between gap-3"><span className={strong ? "font-bold text-brand-text" : "text-brand-muted"}>{label}</span><span className={strong ? "text-right font-bold text-brand-forest" : "max-w-[60%] text-right font-semibold text-brand-text"}>{value}</span></div>;
}

export default QuotationPreviewDialog;
