function HomeownerStepper({ steps, currentStep }) {
  return (
    <ol className="grid min-w-0 grid-cols-5 gap-1" aria-label="Inquiry steps">
      {steps.map((step, index) => {
        const completed = step.id < currentStep;
        const active = step.id === currentStep;
        return (
          <li key={step.id} className="relative min-w-0 text-center">
            {index > 0 && <span className={`absolute right-1/2 top-[17px] h-[3px] w-full rounded-full ${completed || active ? "bg-emerald-600" : "bg-slate-200"}`} />}
            <span className={`relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-extrabold shadow-sm ${completed || active ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-slate-50 text-slate-600"}`}>{completed ? "✓" : step.id}</span>
            <span className={`mt-2 block text-[9px] font-bold leading-4 sm:text-xs ${active ? "text-emerald-800" : "text-slate-500"}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default HomeownerStepper;
