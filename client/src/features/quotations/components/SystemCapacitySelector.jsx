import { CheckCircle2, Info, Sun } from "lucide-react";
import { calculateAnnualGeneration } from "../utils/quotation-calculations.js";

function SystemCapacitySelector({ options = [], selectedCapacity, onChange, unitsPerKwPerYear = 1400 }) {
  return (
    <section id="system-details" className="scroll-mt-24 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sun size={26} className="text-brand-emerald" aria-hidden="true" />
          <h2 className="text-lg font-bold text-brand-text">Select System Capacity</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-brand-forest">
          <Info size={15} aria-hidden="true" />
          Generation assumption: {unitsPerKwPerYear.toLocaleString("en-IN")} units per kW annually
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const selected = selectedCapacity === option.capacityKw;
          const generation = calculateAnnualGeneration(option.capacityKw, unitsPerKwPerYear);
          return (
            <button
              key={option.capacityKw}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.capacityKw)}
              className={[
                "relative flex min-h-[126px] flex-col items-center justify-center rounded-xl border-2 px-3 py-4 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald",
                selected ? "border-brand-emerald bg-green-50 shadow-sm" : "border-slate-200 bg-white hover:border-brand-emerald/60 hover:bg-brand-background",
              ].join(" ")}
            >
              {option.recommended && (
                <span className="absolute right-0 top-0 rounded-bl-lg rounded-tr-lg bg-brand-emerald px-2 py-1 text-[10px] font-bold text-white">★ Recommended</span>
              )}
              <span className="flex w-full items-center justify-start gap-3">
                <span className={[
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  selected ? "border-brand-emerald bg-brand-emerald text-white" : "border-slate-400 bg-white",
                ].join(" ")}>
                  {selected && <CheckCircle2 size={14} aria-hidden="true" />}
                </span>
                <span className="text-xl font-extrabold text-brand-text">{option.capacityKw} kW</span>
              </span>
              <Sun size={31} className="mt-2 text-brand-emerald" aria-hidden="true" />
              <span className="mt-2 text-sm font-semibold text-brand-text">≈ {generation.toLocaleString("en-IN")} units / year</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default SystemCapacitySelector;
