import { CheckCircle2, ClipboardCheck, FileUp, House, UserRound, Zap, TrendingUp } from "lucide-react";

const icons = [UserRound, House, Zap, FileUp, ClipboardCheck];

function InquiryJourney({ steps, currentStep }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><TrendingUp size={21} /></span><div><h2 className="text-base font-black text-slate-950">Your Inquiry Journey</h2><p className="mt-0.5 text-xs text-slate-500">Five steps to submit your solar request.</p></div></div>
      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => {
          const Icon = icons[index] ?? ClipboardCheck;
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <li key={step.id} className="relative flex items-start gap-3">
              {index < steps.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-16px)] w-px bg-slate-200" />}
              <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done || active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{done ? <CheckCircle2 size={18} /> : <Icon size={18} />}</span>
              <span className="min-w-0 pt-0.5"><span className={`block text-sm font-extrabold ${active ? "text-emerald-800" : "text-slate-950"}`}>{step.label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{step.description}</span></span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default InquiryJourney;
