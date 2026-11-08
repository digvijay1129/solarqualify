import { Copy, Leaf, MapPin, Zap, CheckCircle2, ClipboardCheck, UserRound, CalendarDays, Phone, Mail, Clock3 } from "lucide-react";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { annualGeneration, getMilestoneProgress } from "../utils/homeowner-portal.js";
import ProjectMilestoneTimeline from "../components/ProjectMilestoneTimeline.jsx";
import HomeownerHero from "../components/HomeownerHero.jsx";
import rooftopImage from "../../../assets/images/solarqualify-homeowner-rooftop.jpg";

function HomeownerProjectStatusPage() {
  const { project, profile, setNotice } = useHomeownerPortal();
  const progress = getMilestoneProgress(project.milestones);
  const generation = annualGeneration(project.systemSizeKw);

  function copyProjectId() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(project.id)
        .then(() => setNotice({ tone: "success", message: "Demo project ID copied." }))
        .catch(() => setNotice({ tone: "warning", message: "Clipboard permission was unavailable. You can copy the project ID manually." }));
    } else {
      setNotice({ tone: "warning", message: "Clipboard access is unavailable. You can copy the project ID manually." });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">Project workspace</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-[30px]">Project Status & Tracking</h1><p className="mt-1 max-w-3xl text-sm text-slate-600">Track the progress of your rooftop solar project, view details and take next actions.</p></div>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900">Illustrative demo project</span>
      </div>

      <section className="grid min-w-0 grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[220px_1fr_220px] xl:p-5">
        <div className="relative min-h-[150px] overflow-hidden rounded-xl bg-slate-100">
          <img src={rooftopImage} alt="Residential rooftop solar installation" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08243f]/55 to-transparent" />
          <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-xs font-extrabold text-slate-950">{project.systemSizeKw} kW Solar System</div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-slate-950">{project.title}</h2><span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-900">In Progress</span></div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={14} /> {project.location}</span><span>Project ID: <strong className="text-slate-700">{project.id}</strong></span><button type="button" aria-label="Copy project ID" onClick={copyProjectId} className="rounded p-1 hover:bg-slate-100"><Copy size={14} /></button></div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2"><SunIcon /><div><p className="text-[10px] text-slate-500">System Size</p><p className="text-sm font-black text-slate-950">{project.systemSizeKw} kW</p></div></div>
            <div className="flex items-center gap-2"><Zap className="text-emerald-700" size={22} /><div><p className="text-[10px] text-slate-500">Annual Generation*</p><p className="text-sm font-black text-slate-950">{generation?.toLocaleString("en-IN")} units</p></div></div>
            <div className="flex items-center gap-2"><Leaf className="text-emerald-700" size={22} /><div><p className="text-[10px] text-slate-500">Savings</p><p className="text-sm font-black text-slate-950">Not estimated</p></div></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-700" size={22} /><div><p className="text-[10px] text-slate-500">Subsidy</p><p className="text-sm font-black text-slate-950">Not determined</p></div></div>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-slate-500">*Generation uses the fixed illustrative 1,400 units per kW per year assumption. Savings and subsidy eligibility have not been verified.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold text-amber-900">Current Stage</p>
          <p className="mt-1 text-lg font-black text-slate-950">{project.stage}</p>
          <p className="mt-1 text-[11px] text-amber-900">Illustrative status from sample project data</p>
          <div className="mt-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-amber-950">Overall Progress</span><strong className="text-xl font-black text-slate-950">{progress}%</strong></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays size={22} className="text-emerald-700" /><div><h2 className="text-lg font-black text-slate-950">Project Milestone Timeline</h2><p className="text-xs text-slate-500">Track each stage of your rooftop solar installation.</p></div></div><div className="text-xs font-extrabold text-slate-700">Overall Progress: {progress}%</div></div>
        <ProjectMilestoneTimeline milestones={project.milestones} />
      </section>

      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[.95fr_1.08fr_1.15fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2"><ClipboardCheck size={20} className="text-emerald-800" /><h2 className="text-sm font-black text-slate-950">Project Summary</h2></div>
          <dl className="mt-3 space-y-3 text-xs">
            {[["Homeowner", profile.fullName], ["Property Type", profile.propertyType], ["Location", `${profile.city}, ${profile.state}`], ["Roof Area", `${profile.roofAreaSqFt || "—"} sq. ft.`], ["Roof Type", profile.roofType], ["System Size", `${project.systemSizeKw} kW`]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold text-slate-900">{value || "Not provided"}</dd></div>)}
          </dl>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><UserRound size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Assigned Solar Consultant</h2></div>
            <div className="mt-3 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-900"><UserRound size={25} /></span><div><p className="text-sm font-extrabold text-slate-950">{project.consultantName}</p><p className="text-xs text-slate-500">Solar Consultant · Demo</p></div></div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2"><span className="inline-flex items-center gap-2"><Phone size={14} /> {project.consultantPhone}</span><span className="inline-flex items-center gap-2"><Mail size={14} /> {project.consultantEmail}</span></div>
            <p className="mt-3 text-[10px] leading-4 text-slate-500">Consultant contact details are not connected in this frontend demo.</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2"><CalendarDays size={18} className="text-emerald-800" /><h2 className="text-sm font-black text-slate-950">Upcoming Tasks</h2></div>
            <ul className="mt-3 space-y-3">{project.tasks.map((task) => <li key={task.id} className="flex items-start gap-2 text-xs"><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${task.completed ? "border-emerald-700 bg-emerald-700" : "border-slate-300"}`}>{task.completed && <CheckCircle2 size={13} className="text-white" />}</span><span className="min-w-0 flex-1"><span className="font-semibold text-slate-900">{task.label}</span><span className="mt-1 block text-slate-500">Due {task.dueDate}</span></span></li>)}</ul>
            <p className="mt-3 text-[10px] leading-4 text-slate-500">Tasks are illustrative; no appointment or reminder has been scheduled.</p>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Clock3 size={20} className="text-emerald-700" /><h2 className="text-sm font-black text-slate-950">Recent Updates</h2></div><button type="button" onClick={() => setNotice({ tone: "info", message: "Only sample project updates are available. Live installer updates are not connected." })} className="text-xs font-bold text-emerald-800">View All →</button></div>
          <ol className="mt-3 space-y-4 border-l-2 border-emerald-100 pl-4">{project.updates.map((update) => <li key={update.id} className="relative"><span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow" /><div className="rounded-lg bg-emerald-50/70 p-3"><p className="text-xs font-extrabold text-slate-950">{update.title}</p><p className="mt-1 text-[11px] leading-5 text-slate-600">{update.description}</p><p className="mt-1 text-[10px] text-slate-400">{String(update.date).replace("T", " · ")}</p></div></li>)}</ol>
        </section>
      </section>
    </div>
  );
}

function SunIcon() {
  return <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Zap size={17} /></span>;
}

export default HomeownerProjectStatusPage;
