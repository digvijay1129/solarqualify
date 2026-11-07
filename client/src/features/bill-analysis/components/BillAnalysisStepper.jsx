import { Check } from "lucide-react";

function BillAnalysisStepper({ steps = [], currentStep = 1 }) {
  return (
    <nav
      aria-label="Bill analysis progress"
      className="overflow-hidden rounded-2xl border border-brand-border bg-white px-2 py-4 shadow-sm sm:px-5"
    >
      <ol className="grid min-w-0 grid-cols-4 gap-0 md:flex md:min-w-[680px] md:items-center">
        {steps.map((step, index) => {
          const isCompleted = Number(step.id) < Number(currentStep);
          const isCurrent = Number(step.id) === Number(currentStep);

          return (
            <li
              key={step.id}
              className="relative flex min-w-0 flex-col items-center gap-2 md:flex-1 md:flex-row md:gap-0"
              aria-current={isCurrent ? "step" : undefined}
            >
              {index < steps.length - 1 && (
                <span
                  className={[
                    "absolute left-1/2 right-[-50%] top-4 z-0 h-0.5 md:hidden",
                    isCompleted ? "bg-brand-emerald" : "bg-slate-300",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}

              <div
                className={[
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 md:h-10 md:w-10 md:text-sm",
                  isCompleted || isCurrent
                    ? "bg-brand-emerald text-white"
                    : "border-2 border-slate-300 bg-slate-100 text-slate-600",
                  isCurrent ? "ring-4 ring-brand-mint-soft" : "",
                ].join(" ")}
              >
                {isCompleted ? (
                  <Check size={17} strokeWidth={2.8} aria-hidden="true" />
                ) : (
                  step.id
                )}
              </div>

              <span
                className={[
                  "relative z-10 min-w-0 max-w-full px-0.5 text-center text-[10px] font-semibold leading-3 sm:text-[11px] md:whitespace-nowrap md:px-0 md:text-left md:text-sm md:leading-normal",
                  isCompleted || isCurrent
                    ? "text-brand-forest"
                    : "text-brand-muted",
                ].join(" ")}
              >
                {step.label}
              </span>

              {index < steps.length - 1 && (
                <span
                  className={[
                    "mx-2 hidden h-0.5 min-w-3 flex-1 md:block",
                    isCompleted ? "bg-brand-emerald" : "bg-slate-300",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default BillAnalysisStepper;