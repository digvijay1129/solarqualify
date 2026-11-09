import { Layers3, Wrench, CircleCheck, Clock3, Zap, Leaf } from "lucide-react";

const metricStyles = {
  green: "border-green-100 bg-gradient-to-br from-green-50 to-emerald-100/70",
  orange: "border-orange-100 bg-gradient-to-br from-orange-50 to-amber-100/60",
  purple: "border-purple-100 bg-gradient-to-br from-purple-50 to-violet-100/70",
  blue: "border-sky-100 bg-gradient-to-br from-sky-50 to-blue-100/70",
};

function MetricCard({ icon: Icon, value, label, tone = "green" }) {
  return <article className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 shadow-sm sm:p-4 ${metricStyles[tone]}`}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80"><Icon size={24} className="text-brand-emerald" aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-xl font-extrabold leading-none text-brand-text sm:text-2xl">{value}</p><p className="mt-1 text-xs font-semibold leading-4 text-brand-text sm:text-sm">{label}</p></div></article>;
}

function ProjectMetricCards({ projects = [], totalItems = 0 }) {
  const active = projects.filter((project) => project.status === "active").length;
  const completed = projects.filter((project) => project.status === "completed").length;
  const onHold = projects.filter((project) => project.status === "on_hold").length;
  const capacity = projects.reduce((sum, project) => sum + (Number(project.systemSizeKw) || 0), 0);
  const generation = projects.reduce((sum, project) => sum + (Number(project.annualGenerationUnits) || 0), 0);
  const metrics = [
    { label: "Matching Projects", value: totalItems.toLocaleString("en-IN"), icon: Layers3, tone: "green" },
    { label: "Active on This Page", value: active.toLocaleString("en-IN"), icon: Wrench, tone: "orange" },
    { label: "Completed on This Page", value: completed.toLocaleString("en-IN"), icon: CircleCheck, tone: "green" },
    { label: "On Hold on This Page", value: onHold.toLocaleString("en-IN"), icon: Clock3, tone: "purple" },
    { label: "Capacity on This Page", value: `${capacity.toLocaleString("en-IN")} kW`, icon: Zap, tone: "blue" },
    { label: "Annual Generation on This Page", value: generation.toLocaleString("en-IN"), icon: Leaf, tone: "green" },
  ];
  return <section aria-label="Live project metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>;
}

export default ProjectMetricCards;
