import { useState } from "react";
import { UserRound, Zap, IndianRupee, MapPin, Pencil, X, ExternalLink } from "lucide-react";
import { formatINR } from "../utils/quotation-calculations.js";

function CustomerConsumptionCard({ customer, onOpenLeads = () => {} }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <UserRound size={25} className="text-brand-emerald" aria-hidden="true" />
          <h2 className="text-lg font-bold text-brand-text">Customer & Consumption Details</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.25fr_0.8fr_0.8fr_0.85fr_auto] xl:items-center xl:gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-mint-soft text-brand-emerald">
              <UserRound size={25} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-brand-text">{customer.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-mint px-2 py-0.5 text-xs font-semibold text-brand-forest">
                  {customer.referenceId}
                </span>
                <span className="text-[10px] text-brand-muted">Demo</span>
              </div>
            </div>
          </div>

          <Metric icon={Zap} label="Monthly Units" value={`${customer.monthlyUnits.toLocaleString("en-IN")} Units`} />
          <Metric icon={IndianRupee} label="Monthly Bill" value={formatINR(customer.monthlyBill)} />
          <Metric icon={MapPin} label="Source" value={customer.source} />

          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-brand-text hover:bg-slate-50"
          >
            <Pencil size={16} aria-hidden="true" /> Edit
          </button>
        </div>

        <p className="mt-3 text-[11px] text-brand-muted">
          Illustrative customer context from demo lead {customer.leadId}; confirm the lead and bill record before issuing a quotation.
        </p>
      </section>

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDetails(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="customer-dialog-title" className="text-lg font-bold text-brand-text">Customer source record</h3>
                <p className="mt-1 text-xs text-brand-muted">Read-only demo lead context</p>
              </div>
              <button type="button" onClick={() => setShowDetails(false)} aria-label="Close customer details" className="rounded-lg p-2 text-brand-muted hover:bg-slate-100"><X size={18} /></button>
            </div>
            <dl className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <Detail label="Customer" value={customer.name} />
              <Detail label="Lead reference" value={`${customer.referenceId} (Demo)`} />
              <Detail label="Monthly consumption" value={`${customer.monthlyUnits} units`} />
              <Detail label="Monthly bill" value={formatINR(customer.monthlyBill)} />
              <Detail label="Source" value={customer.source} />
            </dl>
            <p className="mt-4 text-xs leading-5 text-brand-muted">This quotation preview does not edit the lead record. Update customer information in Lead Management.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setShowDetails(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-text">Close</button>
              <button type="button" onClick={onOpenLeads} className="inline-flex items-center gap-2 rounded-lg bg-brand-emerald px-4 py-2 text-sm font-semibold text-white">Open Leads <ExternalLink size={14} /></button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-l-0 border-slate-200 sm:border-l sm:pl-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-mint-soft text-brand-emerald"><Icon size={19} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-[11px] text-brand-muted">{label}</p>
        <p className="truncate text-sm font-bold text-brand-text">{value}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="flex justify-between gap-3"><dt className="text-brand-muted">{label}</dt><dd className="text-right font-semibold text-brand-text">{value}</dd></div>;
}

export default CustomerConsumptionCard;
