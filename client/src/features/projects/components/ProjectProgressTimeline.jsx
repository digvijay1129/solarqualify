import { Check, Circle, Clock3 } from "lucide-react";
import { PROJECT_STAGES } from "../services/projects.service.js";
import { formatProjectDate } from "../utils/project-tracker.js";

function ProjectProgressTimeline({ project }) {
  const milestoneByStage = new Map((project.milestones ?? []).map((item) => [item.stage, item]));
  return (
    <ol className="space-y-0" aria-label={`Persisted milestone timeline for ${project.id}`}>
      {PROJECT_STAGES.map((stage, index) => {
        const milestone = milestoneByStage.get(stage.id);
        const status = milestone?.status ?? "pending";
        const isComplete = ["completed", "skipped"].includes(status);
        const isCurrent = project.currentStageId === stage.id;
        const date = milestone?.completedAt ?? milestone?.updatedAt ?? milestone?.createdAt;
        return <li key={stage.id} className="relative flex min-h-[48px] items-start gap-3">
          {index < PROJECT_STAGES.length - 1 && <span className={`absolute left-[11px] top-6 h-[calc(100%-5px)] w-0.5 ${isComplete ? "bg-brand-emerald" : "bg-slate-200"}`} aria-hidden="true" />}
          <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${isComplete ? "border-brand-emerald bg-brand-emerald text-white" : isCurrent ? "border-brand-emerald bg-white text-brand-emerald ring-4 ring-brand-mint-soft" : "border-slate-300 bg-white text-slate-400"}`}>{isComplete ? <Check size={14} strokeWidth={3} /> : isCurrent ? <Clock3 size={13} /> : <Circle size={11} />}</span>
          <div className={`-mt-0.5 flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1 ${isCurrent ? "bg-brand-mint-soft" : ""}`}>
            <div className="min-w-0"><p className={`text-xs leading-5 ${isCurrent ? "font-extrabold text-brand-forest" : isComplete ? "font-semibold text-brand-text" : "font-medium text-slate-600"}`}>{stage.label}</p><span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold capitalize text-slate-600">{status.replaceAll("_", " ")}</span>{milestone?.note && <p className="mt-1 text-[10px] leading-4 text-slate-500">{milestone.note}</p>}</div>
            <span className="shrink-0 text-[10px] font-medium tabular-nums text-brand-muted">{formatProjectDate(date)}</span>
          </div>
        </li>;
      })}
    </ol>
  );
}

export default ProjectProgressTimeline;
