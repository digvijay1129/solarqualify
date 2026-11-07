import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { ChartPie } from "lucide-react";

const priorityColors = {
  High: "#079447",
  Medium: "#FFB900",
  Low: "#C9CED4",
};

function PriorityDistribution({ data = [] }) {
  const total = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const chartData = data.map((item) => ({
    ...item,
    percentage:
      total > 0
        ? ((Number(item.value) / total) * 100).toFixed(1)
        : "0.0",
  }));

  // Separate visual order from legend order to match the reference.
  const pieOrder = ["High", "Low", "Medium"];
  const pieData = pieOrder
    .map((name) => chartData.find((item) => item.name === name))
    .filter(Boolean);

  const legendOrder = ["High", "Medium", "Low"];
  const legendData = legendOrder
    .map((name) => chartData.find((item) => item.name === name))
    .filter(Boolean);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:p-6">

      <div className="mb-5 flex items-center gap-3">
        <ChartPie
          size={25}
          strokeWidth={2.4}
          className="shrink-0 text-[#079447]"
          aria-hidden="true"
        />

        <h2 className="text-lg font-bold tracking-tight text-brand-text">
          Lead Priority Distribution
        </h2>
      </div>

      {pieData.length > 0 && total > 0 ? (
        <div className="flex min-h-[245px] w-full min-w-0 flex-col items-center gap-3 sm:flex-row sm:gap-2">

          <div className="relative h-[230px] w-full min-w-0 overflow-hidden sm:w-[55%] sm:flex-none">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={103}
                  paddingAngle={1}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  labelLine={false}
                  isAnimationActive={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 0.57;
                    const angle = -midAngle * (Math.PI / 180);

                    return (
                      <text
                        x={cx + radius * Math.cos(angle)}
                        y={cy + radius * Math.sin(angle)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={payload.name === "Low" ? "#344054" : "#FFFFFF"}
                        fontSize={12}
                        fontWeight={700}
                      >
                        {payload.percentage}%
                      </text>
                    );
                  }}
                >
                  {pieData.map((item) => (
                    <Cell
                      key={item.name}
                      fill={priorityColors[item.name] ?? "#98A2B3"}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("en-IN")} leads`,
                    `${name} Priority`,
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E4E7EC",
                    boxShadow: "0 8px 24px rgba(16, 24, 40, 0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[30px] font-bold tracking-tight text-brand-text">
                {total.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-medium text-brand-muted">
                Total Leads
              </span>
            </div>
          </div>

          <div className="w-full space-y-5 sm:min-w-0 sm:flex-1 sm:space-y-5">
            {legendData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span
                  className="h-4 w-4 shrink-0 rounded-[5px]"
                  style={{ backgroundColor: priorityColors[item.name] }}
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text">
                    {item.name} Priority
                  </p>

                  <p className="mt-0.5 text-sm text-brand-muted">
                    {Number(item.value).toLocaleString("en-IN")} ({item.percentage}%)
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="flex h-[245px] items-center justify-center text-sm text-brand-muted">
          No priority distribution data available.
        </div>
      )}
    </section>
  );
}

export default PriorityDistribution;