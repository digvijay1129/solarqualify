import { ArrowLeft, Save, Eye, FileDown } from "lucide-react";

function QuotationActionBar({ onBack, onSaveDraft, onPreview, onGeneratePdf }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-3 shadow-card sm:p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center xl:gap-3">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-text hover:bg-slate-50 xl:justify-self-start">
          <ArrowLeft size={18} aria-hidden="true" /> Back
        </button>
        <button type="button" onClick={onSaveDraft} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-text hover:bg-slate-50">
          <Save size={19} aria-hidden="true" /> Save Draft
        </button>
        <button type="button" onClick={onPreview} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-text hover:bg-slate-50">
          <Eye size={20} aria-hidden="true" /> Preview Quotation
        </button>
        <button type="button" onClick={onGeneratePdf} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-emerald px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-emerald-hover">
          <FileDown size={19} aria-hidden="true" /> Generate PDF Quotation
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] leading-5 text-brand-muted">
        PDF generation will be connected to the authenticated backend and PDFKit. No quotation PDF is generated in this frontend-only phase.
      </p>
    </section>
  );
}

export default QuotationActionBar;
