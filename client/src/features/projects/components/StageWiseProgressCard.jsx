import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { sumStageCounts } from "../utils/project-tracker.js";

function StageWiseProgressCard({ stageCounts = [] }) {
  const total = sumStageCounts(stageCounts);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const circles = stageCounts.map((stage) => {
    const fraction = total > 0 ? Math.max(0, Number(stage.count) || 0) / total : 0;
    const length = fraction * circumference;
    const circle = {
      ...stage,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -accumulated,
    };
    accumulated += length;
    return circle;
  });

  return (
    <section className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <ChartNoAxesColumnIncreasing size={22} className="text-brand-emerald" aria-hidden="true" />
        <h2 className="text-lg font-bold text-brand-text">Stage-wise Progress</h2>
      </div>

      <div className="grid grid-cols-[minmax(130px,.9fr)_minmax(0,1.1fr)] items-center gap-2 sm:gap-3">
        <div className="relative mx-auto aspect-square w-full max-w-[190px]">
          <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90" role="img" aria-label={`Donut chart showing ${total} projects on the current API result page across ${stageCounts.length} milestones`}>
            <circle cx="66" cy="66" r={radius} fill="none" stroke="#E8EEF0" strokeWidth="17" />
            {circles.map((stage) => (
              <circle
                key={stage.stageId}
                cx="66"
                cy="66"
                r={radius}
                fill="none"
                stroke={stage.color}
                strokeWidth="17"
                strokeDasharray={stage.dashArray}
                strokeDashoffset={stage.dashOffset}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold leading-none text-brand-text sm:text-3xl">{total}</span>
            <span className="mt-1 text-xs font-semibold text-brand-text">Projects</span>
          </div>
        </div>

        <ul className="min-w-0 space-y-2">
          {stageCounts.map((stage) => (
            <li key={stage.stageId} className="flex min-w-0 items-center gap-2 text-[10px] sm:text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="min-w-0 flex-1 leading-4 text-brand-text">{stage.label}</span>
              <span className="font-bold tabular-nums text-brand-text">{stage.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-brand-muted">Milestone distribution for the current page of live project results.</p>
    </section>
  );
}

export default StageWiseProgressCard;
