import { FileText, Info, Layers3, Zap } from "lucide-react";

function KeyReferences({ generationUnits, maximumSubsidy }) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex items-center gap-3">
        <Info size={29} className="shrink-0 text-brand-emerald" />
        <p className="text-sm font-extrabold text-brand-text">Key References</p>
      </div>
      <div className="flex items-center gap-3 border-slate-200 sm:border-l sm:pl-4">
        <Zap size={28} className="shrink-0 text-brand-emerald" />
        <p className="text-xs leading-5 text-brand-text"><strong>Generation Assumption:</strong><br />{generationUnits.toLocaleString("en-IN")} units per kW per year</p>
      </div>
      <div className="flex items-center gap-3 border-slate-200 sm:border-l sm:pl-4">
        <Layers3 size={28} className="shrink-0 text-brand-emerald" />
        <p className="text-xs leading-5 text-brand-text"><strong>Subsidy Limit:</strong><br />Maximum {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(maximumSubsidy)}</p>
      </div>
      <div className="flex items-center gap-3 border-slate-200 sm:border-l sm:pl-4">
        <FileText size={28} className="shrink-0 text-brand-emerald" />
        <p className="text-xs leading-5 text-brand-text"><strong>Note:</strong><br />Use latest verified MNRE / DISCOM guidelines for production use.</p>
      </div>
    </section>
  );
}

export default KeyReferences;
