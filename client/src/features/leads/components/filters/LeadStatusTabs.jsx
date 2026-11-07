import {
  Users,
  UserPlus,
  BadgeCheck,
  Clock3,
  CheckCircle2,
  CircleX,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-IN");

const statusIcons = {
  all: Users,
  new: UserPlus,
  qualified: BadgeCheck,
  "in-progress": Clock3,
  converted: CheckCircle2,
  lost: CircleX,
};

function LeadStatusTabs({
  statuses = [],
  statusCounts = {},
  activeStatus = "all",
  onStatusChange = () => {},
}) {
  return (
    <nav
      aria-label="Filter leads by status"
      className="min-w-0 overflow-x-auto pb-1"
    >
      <div
        role="tablist"
        aria-label="Lead statuses"
        className="flex min-w-max items-center gap-2.5"
      >
        {statuses.map((status) => {
          const Icon = statusIcons[status.id] ?? Users;
          const isActive = activeStatus === status.id;
          const count = Number(statusCounts[status.id] ?? 0);

          return (
            <button
              key={status.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onStatusChange(status.id)}
              className={[
                "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald",
                isActive
                  ? "border-[#078B37] bg-gradient-to-r from-[#079447] to-[#00723A] text-white shadow-sm"
                  : "border-brand-border bg-white text-brand-text hover:border-brand-emerald hover:bg-brand-mint-soft",
              ].join(" ")}
            >
              <Icon size={19} strokeWidth={2} aria-hidden="true" />

              <span className="whitespace-nowrap">
                {status.label} ({numberFormatter.format(count)})
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default LeadStatusTabs;