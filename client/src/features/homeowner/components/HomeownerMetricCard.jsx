import { ChevronRight } from "lucide-react";

function HomeownerMetricCard({ icon: Icon, title, value, subtitle, tone = "green", onClick }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-100",
    yellow: "bg-amber-50 text-amber-800 border-amber-100",
    blue: "bg-sky-50 text-sky-800 border-sky-100",
    purple: "bg-violet-50 text-violet-800 border-violet-100",
  };
  const content = (
    <>
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${tones[tone] ?? tones.green}`}>{Icon && <Icon size={27} />}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-600">{title}</span><span className="mt-1 block truncate text-2xl font-black text-slate-950">{value}</span>{subtitle && <span className="mt-0.5 block truncate text-[10px] text-slate-500">{subtitle}</span>}</span>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 ${tones[tone]?.split(" ")[1] ?? "text-emerald-800"}`}><ChevronRight size={18} /></span>
    </>
  );
  return onClick
    ? <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">{content}</button>
    : <div className={`flex items-center gap-3 rounded-2xl border border-slate-200 p-4 shadow-sm ${tones[tone]?.split(" ")[0] ?? "bg-white"} bg-opacity-30`}>{content}</div>;
}

export default HomeownerMetricCard;
