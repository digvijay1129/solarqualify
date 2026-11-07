import { Users, Eye, MoreHorizontal, MapPin } from "lucide-react";
import LeadPagination from "./LeadPagination.jsx";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const priorityStyles = {
  High: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-yellow-100 text-yellow-800",
};

const statusStyles = {
  Qualified: "bg-green-100 text-green-800",
  "In Progress": "bg-slate-100 text-slate-700",
  New: "bg-blue-100 text-blue-800",
  Converted: "bg-purple-100 text-purple-800",
  Lost: "bg-red-100 text-red-800",
};

function LeadsTable({
  leads = [],
  selectedLeadId = null,
  onSelectLead = () => {},
  pagination = null,
  currentPage = 1,
  pageSize = 5,
  onPageChange = () => {},
  onPageSizeChange = () => {},
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-5 py-4">
        <div className="flex items-center gap-3">
          <Users
            size={23}
            strokeWidth={2.3}
            className="text-[#079447]"
            aria-hidden="true"
          />

          <h2 className="text-lg font-bold text-brand-text">
            Lead Records
          </h2>
        </div>

        <span className="rounded-lg bg-brand-mint-soft px-3 py-2 text-xs font-semibold text-brand-forest">
          {leads.length} Sample Records
        </span>
      </div>

      {leads.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] table-fixed border-collapse text-left">
            <colgroup>
  <col style={{ width: "8%" }} />
  <col style={{ width: "20%" }} />
  <col style={{ width: "17%" }} />
  <col style={{ width: "11%" }} />
  <col style={{ width: "11%" }} />
  <col style={{ width: "8%" }} />
  <col style={{ width: "12%" }} />
  <col style={{ width: "13%" }} />
</colgroup>
            <thead>
              <tr className="border-b border-brand-border bg-[#F4F6F8]">
                <th className="px-3 py-4 text-xs font-bold text-brand-text">
                  Lead ID
                </th>

                <th className="px-3 py-4 text-xs font-bold text-brand-text">
                  Customer Name
                </th>

                <th className="px-3 py-4 text-xs font-bold text-brand-text">
                  Location
                </th>

                <th className="px-3 py-4 text-xs font-bold text-brand-text">
                  Monthly Bill
                </th>

                <th className="px-3 py-4 text-xs font-bold text-brand-text">
                  System (kW)
                </th>

                <th className="px-3 py-4 text-xs font-bold text-brand-text">
                  Priority
                </th>

                <th className="px-3 py-4 text-xs font-bold text-brand-text">
                  Status
                </th>

                <th className="px-4 py-4 text-center text-xs font-bold text-brand-text">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border">
              {leads.map((lead) => {
                const isSelected = selectedLeadId === lead.id;

                return (
                  <tr
                    key={lead.id}
                    className={[
                      "transition-colors hover:bg-brand-background/80",
                      isSelected ? "bg-brand-mint-soft/70" : "bg-white",
                    ].join(" ")}
                  >
                    <td className="whitespace-nowrap px-2.5 py-4">
                      <span className="text-sm font-semibold text-[#087A32]">
                        {lead.referenceId}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-4">
                      <button
                        type="button"
                        onClick={() => onSelectLead(lead)}
                        className="block max-w-full truncate text-left text-sm font-semibold text-brand-text hover:text-brand-emerald focus-visible:outline-2 focus-visible:outline-brand-emerald"
                      >
                        {lead.name}
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-4">
                      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-brand-muted">
                        <MapPin size={15} aria-hidden="true" />
                        <span className="truncate">{lead.location || "Not provided"}</span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-4 text-sm font-semibold text-brand-text">
                      {currencyFormatter.format(lead.monthlyBill)}
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-4 text-sm font-semibold text-brand-text">
                      {lead.recommendedSystemKw != null
                        ? `${lead.recommendedSystemKw} kW`
                        : "Pending"}
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-4">
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

                    <td className="whitespace-nowrap px-2.5 py-4">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          statusStyles[lead.status] ??
                            "bg-gray-100 text-gray-700",
                        ].join(" ")}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectLead(lead)}
                          aria-label={`View details for ${lead.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-text transition hover:border-brand-emerald hover:bg-brand-mint-soft"
                        >
                          <Eye size={17} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectLead(lead)}
                          aria-label={`More options for ${lead.name}`}
                          title="Open lead details"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-text transition hover:border-brand-emerald hover:bg-brand-mint-soft"
                        >
                          <MoreHorizontal size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
          <Users size={30} className="text-brand-muted" aria-hidden="true" />

          <h3 className="mt-3 text-sm font-semibold text-brand-text">
            No matching leads found
          </h3>

          <p className="mt-1 text-sm text-brand-muted">
            Try changing your search or filter selection.
          </p>
        </div>
      )}

      {pagination && (
        <LeadPagination
          page={currentPage}
          pageSize={pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      <div className="border-t border-brand-border px-5 py-3">
        <p className="text-xs leading-5 text-brand-muted">
          Demonstration records only. Missing customer information is not
          inferred or automatically populated.
        </p>
      </div>
    </section>
  );
}

export default LeadsTable;