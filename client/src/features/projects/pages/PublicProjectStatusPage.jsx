import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3, Leaf, Sun } from "lucide-react";
import { getPublicCustomerProjectStatus, PROJECT_STAGES } from "../services/projects.service.js";
import { formatProjectDate } from "../utils/project-tracker.js";

function PublicProjectStatusPage() {
  const { token } = useParams();
  const query = useQuery({
    queryKey: ["public-project-status", token],
    queryFn: () => getPublicCustomerProjectStatus(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 15_000,
  });

  if (query.isPending) return <div className="mx-auto max-w-3xl space-y-4 p-6"><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="h-96 animate-pulse rounded-2xl bg-slate-200" /></div>;
  if (query.isError || !query.data) return <main className="mx-auto max-w-xl px-5 py-16"><section className="rounded-2xl border border-amber-200 bg-white p-7 text-center shadow-sm"><AlertCircle size={36} className="mx-auto text-amber-700" /><h1 className="mt-4 text-xl font-black text-slate-950">Tracking link unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-600">{query.error?.message || "This project tracking link is invalid, expired or has been revoked. Contact your solar provider for a new link."}</p></section></main>;

  const project = query.data;
  const currentIndex = PROJECT_STAGES.findIndex((stage) => stage.id === project.currentStage);
  const milestoneByStage = new Map((project.milestones ?? []).map((item) => [item.stage, item]));
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="rounded-2xl bg-gradient-to-r from-emerald-950 to-emerald-800 p-6 text-white shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><Sun size={28} /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">SolarQualify</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Your Solar Project Progress</h1></div></div><p className="mt-4 text-sm leading-6 text-emerald-50">View the latest milestone and project status shared by your solar provider.</p></header>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Project Reference</p><h2 className="mt-1 text-xl font-black text-slate-950">{project.projectReference}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${project.projectStatus === "completed" ? "bg-emerald-100 text-emerald-900" : project.projectStatus === "on_hold" ? "bg-amber-100 text-amber-900" : project.projectStatus === "cancelled" ? "bg-slate-100 text-slate-700" : "bg-blue-100 text-blue-900"}`}>{String(project.projectStatus).replaceAll("_", " ")}</span></div><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Current milestone</p><p className="mt-1 text-sm font-extrabold text-slate-950">{PROJECT_STAGES.find((stage) => stage.id === project.currentStage)?.label ?? project.currentStage}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Last updated</p><p className="mt-1 text-sm font-extrabold text-slate-950">{formatProjectDate(project.lastUpdatedAt)}</p></div></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><Leaf size={20} className="text-emerald-700" /><h2 className="text-lg font-black text-slate-950">Installation Milestones</h2></div><ol className="mt-5 space-y-0">{PROJECT_STAGES.map((stage,index)=>{const milestone=milestoneByStage.get(stage.id);const status=milestone?.status ?? "pending";const complete=["completed","skipped"].includes(status);const current=stage.id===project.currentStage;return <li key={stage.id} className="relative flex min-h-14 items-start gap-3">{index<PROJECT_STAGES.length-1&&<span className={`absolute left-[13px] top-7 h-[calc(100%-5px)] w-0.5 ${complete?"bg-emerald-600":"bg-slate-200"}`} />}<span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${complete?"border-emerald-700 bg-emerald-700 text-white":current?"border-emerald-700 bg-white text-emerald-700 ring-4 ring-emerald-50":"border-slate-300 bg-white text-slate-400"}`}>{complete?<CheckCircle2 size={15}/>:<Clock3 size={14}/>}</span><div className={`-mt-0.5 min-w-0 flex-1 rounded-lg px-3 py-2 ${current?"bg-emerald-50":""}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className={`text-sm ${current?"font-extrabold text-emerald-950":complete?"font-semibold text-slate-900":"text-slate-600"}`}>{stage.label}</p><span className="text-[10px] font-semibold capitalize text-slate-500">{status.replaceAll("_"," ")}</span></div>{milestone?.note&&<p className="mt-1 text-xs leading-5 text-slate-600">{milestone.note}</p>{milestone?.completedAt&&<p className="mt-1 text-[10px] text-slate-500">Completed {formatProjectDate(milestone.completedAt)}</p>}</div></li>;})}</ol></section>
      <footer className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-950">This page shows the latest project information shared by the installer. Dates and milestones are updated by the SolarQualify team. Contact your provider if you have questions about appointments, documents or project timelines.</footer>
    </div>
  </main>;
}

export default PublicProjectStatusPage;
