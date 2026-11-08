import {
  Layers3,
  Wrench,
  CircleCheck,
  Clock3,
  Zap,
  Leaf,
} from "lucide-react";
import { calculatePortfolioAnnualGeneration } from "../utils/project-tracker.js";

const metricStyles = {
  green: "border-green-100 bg-gradient-to-br from-green-50 to-emerald-100/70 text-green-700",
  orange: "border-orange-100 bg-gradient-to-br from-orange-50 to-amber-100/60 text-orange-700",
  purple: "border-purple-100 bg-gradient-to-br from-purple-50 to-violet-100/70 text-violet-700",
  blue: "border-sky-100 bg-gradient-to-br from-sky-50 to-blue-100/70 text-blue-700",
};

function MetricCard({ icon: Icon, value, label, tone = "green", suffix = "" }) {
  return (
    <article className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 shadow-sm sm:p-4 ${metricStyles[tone]}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 sm:h-12 sm:w-12">
        <Icon size={25} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xl font-extrabold leading-none text-brand-text sm:text-2xl">
          {value}{suffix}
        </p>
        <p className="mt-1 text-xs font-semibold leading-4 text-brand-text sm:text-sm">{label}</p>
      </div>
    </article>
  );
}

function ProjectMetricCards({ summary, generation }) {
  const annualGeneration = calculatePortfolioAnnualGeneration(
    summary.totalCapacityKw,
    generation.unitsPerKwPerYear
  );

  const metrics = [
    { label: "Total Projects", value: summary.totalProjects.toLocaleString("en-IN"), icon: Layers3, tone: "green" },
    { label: "In Progress", value: summary.inProgress.toLocaleString("en-IN"), icon: Wrench, tone: "orange" },
    { label: "Completed", value: summary.completed.toLocaleString("en-IN"), icon: CircleCheck, tone: "green" },
    { label: "On Hold", value: summary.onHold.toLocaleString("en-IN"), icon: Clock3, tone: "purple" },
    { label: "Total Capacity", value: `${summary.totalCapacityKw} kW`, icon: Zap, tone: "blue" },
    { label: "Est. Annual Generation", value: `≈ ${annualGeneration.toLocaleString("en-IN")}`, icon: Leaf, tone: "green" },
  ];

  return (
    <section aria-label="Project portfolio metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
    </section>
  );
}

export default ProjectMetricCards;
