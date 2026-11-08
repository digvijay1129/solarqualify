import { Check, Circle, Clock3 } from "lucide-react";

function MilestoneNode({ milestone, index, total, compact }) {
  const complete = milestone.status === "completed";
  const active = milestone.status === "in-progress";
  return (
    <li className={`relative min-w-0 ${compact ? "flex-1" : "flex-1"}`}>
      {index < total - 1 && <span className={`absolute left-[calc(50%+18px)] top-[17px] hidden h-[3px] w-[calc(100%-36px)] rounded-full md:block ${complete ? "bg-emerald-500" : "bg-slate-200"}`} />}
      <div className={`relative z-10 flex flex-col items-center text-center ${compact ? "gap-1" : "gap-2"}`}>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm ${complete ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-amber-400 bg-amber-50 text-amber-700 ring-4 ring-amber-100" : "border-slate-300 bg-white text-slate-400"}`}>
          {complete ? <Check size={17} /> : active ? <Clock3 size={16} /> : <Circle size={14} />}
        </span>
        <span className={`text-center font-extrabold ${compact ? "text-[10px] sm:text-[11px]" : "text-xs sm:text-sm"} ${active ? "text-emerald-900" : "text-slate-900"}`}>{milestone.label}</span>
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${complete ? "bg-emerald-100 text-emerald-800" : active ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>
          {complete ? "Completed" : active ? "In Progress" : "Upcoming"}
        </span>
        {!compact && <span className="text-[10px] leading-4 text-slate-500">{milestone.date || "Date pending"}</span>}
      </div>
    </li>
  );
}

function ProjectMilestoneTimeline({ milestones = [], compact = false }) {
  return (
    <>
      <ol className={`hidden min-w-0 items-start md:flex ${compact ? "gap-1" : "gap-2"}`} aria-label="Project milestone timeline">
        {milestones.map((milestone, index) => <MilestoneNode key={milestone.id} milestone={milestone} index={index} total={milestones.length} compact={compact} />)}
      </ol>
      <ol className="space-y-3 md:hidden" aria-label="Project milestone timeline">
        {milestones.map((milestone, index) => {
          const complete = milestone.status === "completed";
          const active = milestone.status === "in-progress";
          return (
            <li key={milestone.id} className="relative flex gap-3">
              {index < milestones.length - 1 && <span className={`absolute left-4 top-8 h-[calc(100%-8px)] w-0.5 ${complete ? "bg-emerald-500" : "bg-slate-200"}`} />}
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${complete ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-300 bg-white text-slate-400"}`}>
                {complete ? <Check size={15} /> : active ? <Clock3 size={14} /> : <Circle size={12} />}
              </span>
              <span className="min-w-0 flex-1 pb-3">
                <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold text-slate-950">{milestone.label}</span><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${complete ? "bg-emerald-100 text-emerald-800" : active ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>{complete ? "Completed" : active ? "In Progress" : "Upcoming"}</span></span>
                <span className="mt-1 block text-[11px] text-slate-500">{milestone.description}</span>
                {!compact && <span className="mt-1 block text-[10px] text-slate-400">{milestone.date || "Date pending"}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

export default ProjectMilestoneTimeline;
