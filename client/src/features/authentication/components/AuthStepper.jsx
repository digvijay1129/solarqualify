import { Check } from "lucide-react";

function AuthStepper({ steps, currentStep }) {
  return (
    <ol aria-label="Registration progress" className="grid grid-cols-2 gap-2">
      {steps.map((step, index) => {
        const complete = step.id < currentStep;
        const current = step.id === currentStep;
        return (
          <li key={step.id} className="relative min-w-0 text-center">
            {index < steps.length - 1 && (
              <span className={`absolute left-[58%] right-[-45%] top-4 hidden h-0.5 sm:block ${complete ? "bg-brand-emerald" : "bg-slate-300"}`} />
            )}
            <span className={[
              "relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold sm:h-10 sm:w-10 sm:text-sm",
              complete || current ? "border-brand-emerald bg-brand-emerald text-white" : "border-slate-300 bg-slate-100 text-slate-600",
            ].join(" ")}>
              {complete ? <Check size={18} /> : step.id}
            </span>
            <span className={`mt-2 block text-[10px] font-bold leading-tight sm:text-xs ${current || complete ? "text-brand-forest" : "text-slate-600"}`}>
              {step.label}
            </span>
            {current && <span className="mx-auto mt-1 block h-0.5 w-12 rounded-full bg-brand-emerald" />}
          </li>
        );
      })}
    </ol>
  );
}

export default AuthStepper;
