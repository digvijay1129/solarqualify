import { Zap, CirclePlus, FileSearch, IndianRupee, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  { to: "/leads", label: "Manage Leads", icon: CirclePlus, variant: "primary" },
  { to: "/bill-analysis", label: "Analyze Electricity Bill", icon: FileSearch, variant: "secondary" },
  { to: "/quotations", label: "Create Quotation", icon: IndianRupee, variant: "secondary" },
];

function QuickActions() {
  return (
    <section className="h-fit rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <Zap size={27} fill="#079447" className="text-[#079447]" aria-hidden="true" />
        <h2 className="text-lg font-bold tracking-tight text-brand-text">Quick Actions</h2>
      </div>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const isPrimary = action.variant === "primary";
          return (
            <Link
              key={action.to}
              to={action.to}
              className={[
                "group flex min-h-[50px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald",
                isPrimary
                  ? "border-[#078B37] bg-gradient-to-r from-[#079447] to-[#00723A] text-white shadow-sm hover:brightness-105"
                  : "border-[#CED9E6] bg-gradient-to-r from-[#F3F6F9] to-[#E9EEF4] text-brand-text hover:border-brand-emerald hover:bg-brand-mint-soft",
              ].join(" ")}
            >
              <Icon size={23} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span className="flex-1 text-left">{action.label}</span>
              <ArrowRight size={21} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default QuickActions;
