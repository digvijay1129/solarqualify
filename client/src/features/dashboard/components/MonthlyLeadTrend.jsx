import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartNoAxesColumnIncreasing } from "lucide-react";

function LeadValueLabel({ x, y, value }) {
  if (x == null || y == null || value == null) {
    return null;
  }

  return (
    <g>
      <rect
        x={x - 22}
        y={y - 31}
        width={44}
        height={23}
        rx={6}
        fill="#E4F9EC"
      />
      <text
        x={x}
        y={y - 15}
        textAnchor="middle"
        fill="#142D20"
        fontSize={12}
        fontWeight={700}
      >
        {value}
      </text>
    </g>
  );
}

function MonthlyLeadTrend({ data = [], periodLabel = "Selected period" }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ChartNoAxesColumnIncreasing
            size={23}
            strokeWidth={2.8}
            className="text-[#079447]"
            aria-hidden="true"
          />

          <h2 className="text-lg font-bold tracking-tight text-brand-text">
            Monthly Leads Trend
          </h2>
        </div>

        <span
          aria-label={`Displayed period: ${periodLabel}`}
          className="inline-flex h-9 items-center rounded-xl border border-brand-border bg-white px-3 text-xs font-medium text-brand-text shadow-sm"
        >
          {periodLabel}
        </span>
      </div>

      {data.length > 0 ? (
        <div className="h-[270px] w-full min-w-0 overflow-hidden sm:h-[285px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={data}
              margin={{ top: 35, right: 12, left: -8, bottom: 2 }}
            >
              <defs>
                <linearGradient
                  id="leadAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#62D98F"
                    stopOpacity={0.48}
                  />
                  <stop
                    offset="100%"
                    stopColor="#A8EDC0"
                    stopOpacity={0.10}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#E7EDF0"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                axisLine={{ stroke: "#CBD5E1" }}
                tickLine={false}
                tick={{
                  fill: "#344054",
                  fontSize: 12,
                  fontWeight: 500,
                }}
                dy={10}
              />

              <YAxis
                domain={[0, "auto"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#344054", fontSize: 12 }}
                allowDecimals={false}
                width={36}
              />

              <Tooltip
                cursor={{ stroke: "#98A2B3", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E4E7EC",
                  boxShadow: "0 8px 24px rgba(16, 24, 40, 0.10)",
                  padding: "12px 14px",
                }}
                labelStyle={{
                  color: "#101828",
                  fontWeight: 600,
                  marginBottom: 5,
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString("en-IN")} leads`,
                  "Lead count",
                ]}
              />

              <Area
                type="monotone"
                dataKey="leads"
                name="Lead count"
                stroke="#078B37"
                strokeWidth={3}
                fill="url(#leadAreaGradient)"
                dot={{
                  r: 4.5,
                  fill: "#FFFFFF",
                  stroke: "#078B37",
                  strokeWidth: 2.5,
                }}
                activeDot={{
                  r: 6,
                  fill: "#078B37",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              >
                <LabelList content={LeadValueLabel} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[285px] items-center justify-center text-sm text-brand-muted">
          No lead trend data available.
        </div>
      )}
    </section>
  );
}

export default MonthlyLeadTrend;