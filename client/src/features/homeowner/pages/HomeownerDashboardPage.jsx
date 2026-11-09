import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, FileText, FolderOpen, Headset,
  PanelsTopLeft, CloudUpload, CalendarDays, Zap, CircleAlert,
} from "lucide-react";
import HomeownerHero from "../components/HomeownerHero.jsx";
import HomeownerMetricCard from "../components/HomeownerMetricCard.jsx";
import ProjectMilestoneTimeline from "../components/ProjectMilestoneTimeline.jsx";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { getMilestoneProgress } from "../utils/homeowner-portal.js";
import rooftopImage from "../../../assets/images/solarqualify-homeowner-rooftop.jpg";

const quickActions = [
  { label: "Submit Solar Enquiry", to: "/homeowner/lead", icon: CloudUpload },
  { label: "Track Project Status", to: "/homeowner/project", icon: PanelsTopLeft },
  { label: "View Quotations", to: "/homeowner/quotations", icon: FileText },
  { label: "View Documents", to: "/homeowner/documents", icon: FolderOpen },
];

function HomeownerDashboardPage() {
  const {
    profile, project, projects = [], quotations = [], documents = [],
    leads = [], activities = [], isLoading, isError, error, refetch,
  } = useHomeownerPortal();

  if (isLoading) {
    return <div className="space-y-4" aria-label="Loading homeowner dashboard"><div className="h-32 animate-pulse rounded-2xl bg-slate-200" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-200" />)}</div></div>;
  }

  if (isError) {
    return <section className="rounded-2xl border border-red-200 bg-white p-7"><h1 className="text-lg font-black text-slate-950">Your dashboard could not be loaded</h1><p className="mt-2 text-sm text-slate-600">{error?.message || "Please check your connection and retry."}</p><button type="button" onClick={() => refetch()} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Retry</button></section>;
  }

  const firstName = profile.fullName.trim().split(/\s+/)[0] || "Homeowner";
  const progress = project ? getMilestoneProgress(project.milestones) : 0;
  const generation = project?.annualGenerationUnits ?? null;
  const recentActivity = activities.slice(0, 5);

  return (
    <div className="space-y-5">
      <HomeownerHero
        eyebrow="SolarQualify Homeowner Portal"
        title={<>Welcome, <span className="text-emerald-800">{firstName}!</span></>}
        description="Review the enquiries, quotations and project milestones linked to your account."
        greeting
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Homeowner summary">
        <HomeownerMetricCard icon={PanelsTopLeft} title="Projects" value={projects.length} subtitle="Live projects" tone="green" />
        <HomeownerMetricCard icon={FileText} title="Quotations" value={quotations.length} subtitle="Generated quotations" tone="yellow" />
        <HomeownerMetricCard icon={FolderOpen} title="Documents" value={documents.length} subtitle="Bills and quotation records" tone="blue" />
        <HomeownerMetricCard icon={Headset} title="Enquiries" value={leads.length} subtitle="Your submitted solar leads" tone="purple" />
      </section>

      {project ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Zap size={22} /></span><div><h2 className="text-lg font-black text-slate-950">Your Solar Project</h2><p className="text-xs text-slate-500">Project record from your account</p></div></div>
            <Link to="/homeowner/project" className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 hover:underline">View Projects <ArrowRight size={15} /></Link>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[210px_1fr] sm:p-5">
            <div className="relative min-h-[150px] overflow-hidden rounded-xl bg-slate-100"><img src={rooftopImage} alt="Residential rooftop solar" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#062b42]/75 via-transparent to-transparent" /><div className="absolute bottom-3 left-3 rounded-xl bg-white/90 p-3 shadow-sm"><p className="text-lg font-black text-slate-950">{project.systemSizeKw} kW System</p><p className="text-[10px] text-slate-600">Quotation snapshot</p></div></div>
            <div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-base font-extrabold text-slate-950">{project.title}</h3><p className="mt-1 text-xs text-slate-500">{project.location}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-900">{project.statusLabel}</span></div>
              <p className="mt-2 text-[11px] text-slate-500">Project ID: <span className="font-bold text-slate-800">{project.id}</span> · Updated {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString("en-IN") : "—"}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div><p className="text-[10px] text-slate-500">System size</p><p className="text-sm font-black text-slate-950">{project.systemSizeKw} kW</p></div><div><p className="text-[10px] text-slate-500">Annual generation</p><p className="text-sm font-black text-slate-950">{generation == null ? "—" : generation.toLocaleString("en-IN")} units</p></div><div><p className="text-[10px] text-slate-500">Milestone progress</p><p className="text-sm font-black text-slate-950">{progress}%</p></div></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Generation is shown from the project quotation snapshot and is not an energy-performance guarantee.</p>
            </div>
          </div>
          <div className="border-t border-slate-100 px-4 py-4 sm:px-5"><ProjectMilestoneTimeline milestones={project.milestones} compact /></div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-emerald-200 bg-white p-7 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><PanelsTopLeft size={24} /></span><h2 className="mt-3 text-lg font-black text-slate-950">No project has been created yet</h2><p className="mt-1 text-sm text-slate-600">Projects are created by Sales Staff after a quotation has been accepted in the operational workflow.</p><Link to="/homeowner/lead" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Submit an enquiry <ArrowRight size={16} /></Link></section>
      )}

      <section className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-[1fr_.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><CalendarDays className="text-emerald-700" size={21} /><h2 className="text-base font-black text-slate-950">Recent Activity</h2></div><Link to="/homeowner/project" className="text-xs font-bold text-emerald-800 hover:underline">View Projects</Link></div>
          <div className="divide-y divide-slate-100">{recentActivity.map((item) => <div key={item.id} className="flex gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><CheckCircle2 size={18} /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{item.title}</p><p className="mt-0.5 text-[11px] text-slate-500">{item.description}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(item.date).toLocaleString("en-IN")}</p></div></div>)}{recentActivity.length === 0 && <p className="py-6 text-xs text-slate-500">No activity is recorded yet.</p>}</div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-black text-slate-950">Your Latest Enquiries</h2><span className="text-xs font-bold text-slate-500">{leads.length} total</span></div><div className="space-y-3">{leads.slice(0,4).map((lead) => <div key={lead.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-900">{lead.referenceId}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">{lead.status}</span></div><p className="mt-1 text-xs text-slate-500">{lead.location || "Address saved with enquiry"}</p></div>)}{leads.length === 0 && <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">No enquiries are linked to your account yet.</div>}</div></section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-3 flex items-center gap-2"><Zap className="text-amber-500" size={22} /><h2 className="text-lg font-black text-slate-950">Quick Actions</h2></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">{quickActions.map(({ label, to, icon: Icon }) => <Link key={label} to={to} className="flex min-h-[64px] items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-extrabold text-emerald-950 transition hover:bg-emerald-100"><Icon size={22} className="shrink-0" /><span className="min-w-0 flex-1">{label}</span><ArrowRight size={16} /></Link>)}</div></section>
      <p className="flex items-start gap-2 text-[10px] leading-5 text-slate-500"><CircleAlert size={14} className="mt-0.5 shrink-0" />Only information returned by the backend is displayed as live account data. Roof measurements, verified bill values and subsidy eligibility require their respective review workflows.</p>
    </div>
  );
}

export default HomeownerDashboardPage;
