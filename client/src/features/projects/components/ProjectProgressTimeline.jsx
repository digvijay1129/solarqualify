import { Check, Circle } from "lucide-react";
import { projectStages } from "../../../mocks/fixtures/project-tracker.fixture.js";
import { formatProjectDate, getProjectStageState } from "../utils/project-tracker.js";

function ProjectProgressTimeline({ project }) {
  const timelineByStage = new Map((project.timeline ?? []).map((item) => [item.stageId, item.date]));

  return (
    <ol className="space-y-0" aria-label={`Progress timeline for ${project.id}`}>
      {projectStages.map((stage, index) => {
        const state = getProjectStageState(project, stage.id);
        const isComplete = state === "completed";
        const isCurrent = state === "current";
        const date = timelineByStage.get(stage.id);

        return (
          <li key={stage.id} className="relative flex min-h-[43px] items-start gap-3">
            {index < projectStages.length - 1 && <span className={`absolute left-[11px] top-6 h-[calc(100%-5px)] w-0.5 ${isComplete ? "bg-brand-emerald" : "bg-slate-200"}`} aria-hidden="true" />}
            <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${isComplete ? "border-brand-emerald bg-brand-emerald text-white" : isCurrent ? "border-brand-emerald bg-white text-brand-emerald ring-4 ring-brand-mint-soft" : "border-slate-300 bg-white text-slate-400"}`}>
              {isComplete ? <Check size={14} strokeWidth={3} /> : isCurrent ? <span className="h-2 w-2 rounded-full bg-brand-emerald" /> : <Circle size={11} />}
            </span>
            <div className={`-mt-0.5 flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1 ${isCurrent ? "bg-brand-mint-soft" : ""}`}>
              <div className="min-w-0">
                <p className={`text-xs leading-5 ${isCurrent ? "font-extrabold text-brand-forest" : isComplete ? "font-semibold text-brand-text" : "font-medium text-slate-600"}`}>{stage.label}</p>
                {isCurrent && <span className="mt-0.5 inline-flex rounded-full bg-green-200 px-2 py-0.5 text-[9px] font-bold text-green-900">Current Stage</span>}
              </div>
              <span className="shrink-0 text-[10px] font-medium tabular-nums text-brand-muted">{formatProjectDate(date)}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default ProjectProgressTimeline;
