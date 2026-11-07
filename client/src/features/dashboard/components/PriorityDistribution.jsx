import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const priorityColors = {
  High: "var(--color-status-danger)",
  Medium: "var(--color-status-warning)",
  Low: "var(--color-status-info)",
};

function PriorityDistribution({ data = [] }) {
  const total = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-brand-text">
          Lead Priority Distribution
        </h2>

        <p className="mt-1 text-sm text-brand-muted">
          Illustrative breakdown by qualification priority
        </p>
      </div>

      {data.length > 0 && total > 0 ? (
        <>
          <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={94}
                  paddingAngle={4}
                  stroke="none"
                >
                  {data.map((item) => (
                    <Cell
                      key={item.name}
                      fill={
                        priorityColors[item.name] ??
                        "var(--color-brand-muted)"
                      }
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("en-IN")} leads`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--color-brand-border)",
                    boxShadow: "0 8px 24px rgba(16, 24, 40, 0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-brand-text">
                {total.toLocaleString("en-IN")}
              </span>
              <span className="mt-1 text-xs text-brand-muted">
                Total Leads
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {data.map((item) => {
              const percentage = (Number(item.value) / total) * 100;

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          priorityColors[item.name] ??
                          "var(--color-brand-muted)",
                      }}
                    />

                    <span className="text-sm text-brand-muted">
                      {item.name} Priority
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-semibold text-brand-text">
                      {Number(item.value).toLocaleString("en-IN")}
                    </span>
                    <span className="ml-2 text-xs text-brand-muted">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex h-72 items-center justify-center text-sm text-brand-muted">
          No priority distribution data available.
        </div>
      )}
    </section>
  );
}

export default PriorityDistribution;