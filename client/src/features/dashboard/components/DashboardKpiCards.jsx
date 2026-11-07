import {
  Users,
  Target,
  FileText,
  House,
  TrendingUp,
} from "lucide-react";

const iconComponents = {
  users: Users,
  target: Target,
  "file-text": FileText,
  house: House,
};

const themeStyles = {
  green: {
    card: "border-[#D8F1DE] bg-gradient-to-br from-[#F2FFF3] to-[#E3F9E8]",
    icon: "bg-[#D9F8DF] text-[#078B37]",
    sparkline: "#36CE73",
  },
  pink: {
    card: "border-[#F6E0E4] bg-gradient-to-br from-[#FFF6F7] to-[#FCECEF]",
    icon: "bg-[#FFE0E3] text-[#F04452]",
    sparkline: "#FF929B",
  },
  yellow: {
    card: "border-[#F5EACB] bg-gradient-to-br from-[#FFFDF4] to-[#FFF6E4]",
    icon: "bg-[#FFF0C5] text-[#B77900]",
    sparkline: "#F2B323",
  },
  purple: {
    card: "border-[#E9E0FA] bg-gradient-to-br from-[#FBF8FF] to-[#F1EBFF]",
    icon: "bg-[#EBDDFF] text-[#7839C8]",
    sparkline: "#9670FF",
  },
};

function buildSparklinePath(values = []) {
  if (!Array.isArray(values) || values.length < 2) {
    return "";
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * 150,
    y: 25 - ((value - minimum) / range) * 17,
  }));

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const distance = next.x - current.x;

    path += ` C ${
      current.x + distance / 3
    } ${current.y}, ${
      next.x - distance / 3
    } ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function DashboardKpiCards({ kpis = [] }) {
  return (
    <section
      aria-label="Dashboard key performance indicators"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((kpi) => {
        const Icon = iconComponents[kpi.icon] ?? Users;
        const theme = themeStyles[kpi.theme] ?? themeStyles.green;
        const sparklinePath = buildSparklinePath(kpi.sparkline);

        return (
          <article
            key={kpi.id}
            className={[
              "relative min-h-[126px] overflow-hidden rounded-2xl border px-4 pb-7 pt-3 shadow-sm transition-shadow duration-200 hover:shadow-md",
              theme.card,
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                  theme.icon,
                ].join(" ")}
              >
                <Icon size={25} strokeWidth={2.2} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5 text-brand-text">
                  {kpi.label}
                </p>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-[29px] font-bold leading-9 tracking-tight text-brand-text">
                    {Number(kpi.value).toLocaleString("en-IN")}
                  </p>

                  {kpi.growth != null && (
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-[#078B37]">
                        <TrendingUp size={13} strokeWidth={2.5} />
                        +{Number(kpi.growth).toFixed(1)}%
                      </span>

                      <span className="mt-1 whitespace-nowrap text-[10px] text-brand-muted">
                        vs last 30 days
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {sparklinePath && (
              <svg
                viewBox="0 0 150 32"
                preserveAspectRatio="none"
                className="absolute bottom-1 left-4 h-6 w-[calc(100%-2rem)]"
                aria-hidden="true"
              >
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={theme.sparkline}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </article>
        );
      })}
    </section>
  );
}

export default DashboardKpiCards;