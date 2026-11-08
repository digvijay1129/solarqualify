import { Sun } from "lucide-react";

function SolarQualifyBrand({ compact = false }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-brand-forest shadow-sm ring-1 ring-brand-emerald/10">
        <Sun size={29} strokeWidth={2.2} />
        <span className="absolute bottom-2 left-2 right-2 h-3 rounded-sm border-2 border-brand-forest bg-brand-mint-soft" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-extrabold tracking-tight text-brand-forest sm:text-2xl">SolarQualify</span>
        {!compact && <span className="block text-xs font-medium text-brand-text/75">Rooftop Solar Solutions</span>}
      </span>
    </div>
  );
}

export default SolarQualifyBrand;
