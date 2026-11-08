import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, CircleHelp, FileText, FolderOpen,
  Headset, Leaf, PanelsTopLeft, Zap, CloudUpload, UserRound,
  ChevronRight, CalendarDays,Sun,
} from "lucide-react";
import HomeownerHero from "../components/HomeownerHero.jsx";
import HomeownerMetricCard from "../components/HomeownerMetricCard.jsx";
import ProjectMilestoneTimeline from "../components/ProjectMilestoneTimeline.jsx";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { annualGeneration, getMilestoneProgress } from "../utils/homeowner-portal.js";
import rooftopImage from "../../../assets/images/solarqualify-homeowner-rooftop.jpg";

const quickActions = [
  { label: "Upload Electricity Bill", to: "/homeowner/lead", icon: CloudUpload, tone: "green" },
  { label: "Request New Quotation", to: "/homeowner/lead", icon: FileText, tone: "yellow" },
  { label: "Track Project Status", to: "/homeowner/project", icon: PanelsTopLeft, tone: "teal" },
  { label: "View Documents", to: "/homeowner/documents", icon: FolderOpen, tone: "blue" },
  { label: "Contact Support", to: "/homeowner/profile-support", icon: Headset, tone: "purple" },
];

const actionTones = {
  green: "bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  yellow: "bg-amber-50 text-amber-950 hover:bg-amber-100",
  teal: "bg-teal-50 text-teal-950 hover:bg-teal-100",
  blue: "bg-sky-50 text-sky-950 hover:bg-sky-100",
  purple: "bg-violet-50 text-violet-950 hover:bg-violet-100",
};

function HomeownerDashboardPage() {
  const { profile, project, quotations, documents, activities, leadSubmissions, supportRequests } = useHomeownerPortal();
  const progress = getMilestoneProgress(project.milestones);
  const generation = annualGeneration(project.systemSizeKw);
  const firstName = profile.fullName.trim().split(/\s+/)[0] || "Homeowner";
  const recentActivity = [
    ...project.updates.map((item) => ({ ...item, date: String(item.date).slice(0, 10) })),
    ...activities,
    ...leadSubmissions.map((item) => ({ id: item.id, title: "New solar inquiry saved", description: "Your inquiry is saved in this demo session.", date: String(item.submittedAt).slice(0, 10) })),
  ].slice(0, 4);

  return (
    <div className="space-y-5">
      <HomeownerHero
        eyebrow="SolarQualify Homeowner Portal"
        title={<>Good Afternoon, <span className="text-emerald-800">{firstName}!</span> 👋</>}
        description="Welcome to your SolarQualify Homeowner Portal. Track your solar journey, manage quotations and access all your project details in one place."
        greeting
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Homeowner summary">
        <HomeownerMetricCard icon={PanelsTopLeft} title="Active Projects" value="1" subtitle="Illustrative project" tone="green" />
        <HomeownerMetricCard icon={FileText} title="Quotations" value={quotations.length} subtitle="Demo quotation records" tone="yellow" />
        <HomeownerMetricCard icon={FolderOpen} title="Documents" value={documents.length} subtitle="Metadata and local uploads" tone="blue" />
        <HomeownerMetricCard icon={Headset} title="Support" value={supportRequests.length ? `${supportRequests.length} Requests` : "No Open Ticket"} subtitle="Created in this session" tone="purple" />
      </section>

      <section className="grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-[1.2fr_.8fr]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Sun size={23} /></span>
              <h2 className="text-lg font-black text-slate-950">Your Solar Project</h2>
            </div>
            <Link to="/homeowner/project" className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 hover:underline">View Project <ArrowRight size={15} /></Link>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[210px_1fr] sm:p-5">
            <div className="relative min-h-[150px] overflow-hidden rounded-xl bg-slate-100">
              <img src={rooftopImage} alt="Residential rooftop solar installation" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062b42]/75 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 rounded-xl border border-white/40 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
                <Zap size={21} className="text-emerald-800" />
                <p className="mt-1 text-lg font-black text-slate-950">{project.systemSizeKw} kW System</p>
                <p className="text-[10px] font-medium text-slate-600">Illustrative configuration</p>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="text-base font-extrabold text-slate-950">{project.title}</h3><p className="mt-1 text-xs text-slate-500">{project.location}</p></div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-900">{project.stage}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Project ID: <span className="font-bold text-slate-800">{project.id}</span> <span className="mx-1">·</span> Estimated completion: <span className="font-bold text-slate-800">Not confirmed</span></p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><p className="text-[10px] text-slate-500">System size</p><p className="text-sm font-black text-slate-950">{project.systemSizeKw} kW</p></div>
                <div><p className="text-[10px] text-slate-500">Annual generation*</p><p className="text-sm font-black text-slate-950">{generation?.toLocaleString("en-IN")} units</p></div>
                <div><p className="text-[10px] text-slate-500">Milestone progress</p><p className="text-sm font-black text-slate-950">{progress}%</p></div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">*Uses the fixed illustrative 1,400 units per kW per year assumption. Actual generation is not guaranteed.</p>
            </div>
          </div>
          <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
            <ProjectMilestoneTimeline milestones={project.milestones} compact />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2"><CalendarDays className="text-emerald-700" size={21} /><h2 className="text-base font-black text-slate-950">Recent Activity</h2></div>
            <Link to="/homeowner/project" className="text-xs font-bold text-emerald-800 hover:underline">View All <ArrowRight className="ml-1 inline" size={13} /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((item, index) => {
              const Icon = index === 0 ? CheckCircle2 : index === 1 ? FileText : index === 2 ? CloudUpload : UserRound;
              return <div key={item.id} className="flex gap-3 py-3.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${index % 2 === 0 ? "bg-emerald-50 text-emerald-800" : "bg-sky-50 text-sky-800"}`}><Icon size={18} /></span>
                <div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-950">{item.title}</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{item.description}</p><p className="mt-1 text-[10px] text-slate-400">{item.date}</p></div>
              </div>;
            })}
            {recentActivity.length === 0 && <p className="py-6 text-xs text-slate-500">No activity is available in this demo.</p>}
          </div>
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center gap-2"><Zap className="text-amber-500" size={22} /><h2 className="text-lg font-black text-slate-950">Quick Actions</h2></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {quickActions.map(({ label, to, icon: Icon, tone }) => <Link key={label} to={to} className={`flex min-h-[64px] items-center gap-3 rounded-xl px-3 py-3 text-xs font-extrabold transition ${actionTones[tone]}`}><Icon size={22} className="shrink-0" /><span className="min-w-0 flex-1">{label}</span><ChevronRight size={16} className="shrink-0" /></Link>)}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Leaf size={23} /></span><div><p className="text-xs font-extrabold text-slate-950">Your Solar Impact</p><p className="text-[10px] text-slate-500">Illustrative project estimates</p></div></div>
        <div className="flex items-center gap-3 border-slate-100 sm:border-l sm:pl-4"><Zap className="text-emerald-700" size={24} /><div><p className="text-sm font-black text-slate-950">{generation?.toLocaleString("en-IN")} units / year</p><p className="text-[10px] text-slate-500">Generation assumption</p></div></div>
        <div className="flex items-center gap-3 border-slate-100 sm:border-l sm:pl-4"><PanelsTopLeft className="text-emerald-700" size={24} /><div><p className="text-sm font-black text-slate-950">{project.systemSizeKw} kW</p><p className="text-[10px] text-slate-500">Illustrative system size</p></div></div>
        <div className="flex items-center gap-3 border-slate-100 sm:border-l sm:pl-4"><CircleHelp className="text-emerald-700" size={24} /><div><p className="text-sm font-black text-slate-950">Not guaranteed</p><p className="text-[10px] text-slate-500">Site conditions affect actual output</p></div></div>
      </section>
    </div>
  );
}


export default HomeownerDashboardPage;
