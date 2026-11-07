import {
  Users,
  Target,
  FileText,
  House,
} from "lucide-react";

const iconComponents = {
  users: Users,
  target: Target,
  "file-text": FileText,
  house: House,
};

function DashboardKpiCards({ kpis = [] }) {
  return (
    <section
      aria-label="Dashboard key performance indicators"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((kpi) => {
        const Icon = iconComponents[kpi.icon] ?? Users;

        return (
          <article
            key={kpi.id}
            className="rounded-2xl border border-brand-border bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-brand-muted">
                  {kpi.label}
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-brand-text">
                  {Number(kpi.value).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mint-soft text-brand-emerald">
                <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default DashboardKpiCards;