import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function MonthlyLeadTrend({ data = [] }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-brand-text">
          Monthly Lead Trend
        </h2>

        <p className="mt-1 text-sm text-brand-muted">
          Illustrative lead volume over the last six months
        </p>
      </div>

      {data.length > 0 ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
            >
              <CartesianGrid
                stroke="var(--color-brand-border)"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-brand-muted)", fontSize: 12 }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-brand-muted)", fontSize: 12 }}
                allowDecimals={false}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--color-brand-border)",
                  boxShadow: "0 8px 24px rgba(16, 24, 40, 0.08)",
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString("en-IN")} leads`,
                  "Lead count",
                ]}
              />

              <Line
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="var(--color-brand-emerald)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "var(--color-brand-emerald)",
                  strokeWidth: 2,
                  stroke: "#FFFFFF",
                }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center text-sm text-brand-muted">
          No lead trend data available.
        </div>
      )}
    </section>
  );
}

export default MonthlyLeadTrend;