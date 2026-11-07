import { ArrowUpRight } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const priorityStyles = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-blue-50 text-blue-700",
};

function RecentLeadsTable({ leads = [] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card">

      <div className="flex flex-col gap-3 border-b border-brand-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-brand-text">
            Recent Leads
          </h2>

          <p className="mt-1 text-sm text-brand-muted">
            Illustrative customer records
          </p>
        </div>

        <span className="inline-flex items-center gap-2 self-start rounded-lg bg-brand-mint-soft px-3 py-2 text-xs font-semibold text-brand-forest">
          Demo Records
          <ArrowUpRight size={14} />
        </span>
      </div>

      {leads.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-brand-border bg-brand-background">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Lead
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Monthly Bill
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Monthly Units
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Ownership
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Priority
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Suggested System
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="transition-colors hover:bg-brand-background/70"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="text-sm font-semibold text-brand-text">
                      {lead.name}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {lead.id}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-brand-text">
                    {currencyFormatter.format(lead.monthlyBill)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-brand-muted">
                    {Number(lead.monthlyUnits).toLocaleString("en-IN")} units
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-brand-muted">
                    {lead.ownership}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        priorityStyles[lead.priority] ??
                          "bg-gray-100 text-gray-700",
                      ].join(" ")}
                    >
                      {lead.priority}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-brand-text">
                    {lead.recommendedSystemKw != null
                      ? `${lead.recommendedSystemKw} kW`
                      : "Assessment pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-10 text-center text-sm text-brand-muted">
          No recent leads available.
        </div>
      )}

      <div className="border-t border-brand-border px-6 py-3">
        <p className="text-xs text-brand-muted">
          Sample data for frontend demonstration. Low priority does not mean rejected.
        </p>
      </div>

    </section>
  );
}

export default RecentLeadsTable;