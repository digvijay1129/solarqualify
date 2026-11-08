import { X } from "lucide-react";

function PricingInformationDialog({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="pricing-information-title" className="w-full max-w-lg rounded-2xl border border-brand-border bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="pricing-information-title" className="text-lg font-extrabold text-brand-text">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-brand-muted">{subtitle}</p>}
          </div>
          <button type="button" aria-label="Close details" onClick={onClose} className="rounded-lg p-1.5 text-brand-muted hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="mt-4 text-sm leading-6 text-brand-text">{children}</div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800">Close</button>
        </div>
      </section>
    </div>
  );
}

export default PricingInformationDialog;
