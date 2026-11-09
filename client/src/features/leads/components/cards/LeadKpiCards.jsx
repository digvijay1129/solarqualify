import {
  Users,
  Target,
  Zap,
  Hourglass,
  TrendingUp,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-IN");

const metricDefinitions = [
  { id: "totalLeads", label: "Total Leads", icon: Users, cardStyle: "border-green-100 bg-gradient-to-br from-[#F0FFF3] to-[#E5F9E9]", iconStyle: "bg-[#D7FBE0] text-[#078B37]" },
  { id: "newLeads", label: "New Leads", icon: Target, cardStyle: "border-rose-100 bg-gradient-to-br from-[#FFF5F6] to-[#FDECEF]", iconStyle: "bg-[#FFE0E5] text-[#F04455]" },
  { id: "qualifiedLeads", label: "Qualified Leads", icon: Zap, cardStyle: "border-amber-100 bg-gradient-to-br from-[#FFFBF0] to-[#FFF5E2]", iconStyle: "bg-[#FFF0C7] text-[#C68A00]" },
  { id: "inProgressLeads", label: "In Progress", icon: Hourglass, cardStyle: "border-purple-100 bg-gradient-to-br from-[#F8F4FF] to-[#F1EBFF]", iconStyle: "bg-[#E9DEFF] text-[#7133AA]" },
];

function LeadKpiCards({ summary = {}, growth = {} }) {
  return (
    <section aria-label="Lead summary metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metricDefinitions.map((metric) => {
        const Icon = metric.icon;
        const value = Number(summary[metric.id] ?? 0);
        const growthValue = growth[metric.id];

        return (
          <article key={metric.id} className={`flex min-h-[112px] min-w-0 items-center gap-2 rounded-2xl border p-3 shadow-sm sm:gap-3 sm:px-3 sm:py-3 ${metric.cardStyle}`}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${metric.iconStyle}`}><Icon size={27} strokeWidth={2.4} aria-hidden="true" /></div>
            <div className="min-w-0 flex-1"><p className="whitespace-nowrap text-[13px] font-semibold text-brand-text sm:text-sm">{metric.label}</p><p className="mt-1 text-2xl font-bold leading-tight tracking-tight text-brand-text sm:text-3xl">{numberFormatter.format(value)}</p></div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {growthValue === null || growthValue === undefined ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">No baseline</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E4F8E9] px-1.5 py-1 text-[11px] font-bold text-[#078B37]"><TrendingUp size={14} strokeWidth={2.5} aria-hidden="true" />{growthValue > 0 ? "+" : ""}{Number(growthValue).toFixed(1)}%</span>
              )}
              <span className="whitespace-nowrap text-[11px] font-medium text-brand-muted sm:text-xs">{growthValue == null ? "Comparison unavailable" : "vs prior period"}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default LeadKpiCards;
