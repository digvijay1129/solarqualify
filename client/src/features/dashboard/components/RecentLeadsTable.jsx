import { useState } from "react";
import { Link } from "react-router-dom";

import {
  Users,
  ArrowRight,
  Eye,
  MoreHorizontal,
  Copy,
  X,
  Check,
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const priorityStyles = {
  High: "bg-[#C8F7D1] text-[#075C27]",
  Medium: "bg-[#FFF0B5] text-[#855900]",
  Low: "bg-[#FFEBA8] text-[#855900]",
};

const statusStyles = {
  Qualified: "bg-[#C8F7D1] text-[#075C27]",
  "In Progress": "bg-[#E2E8F0] text-[#26364A]",
  New: "bg-[#DCEEFF] text-[#14548A]",
};

const avatarStyles = [
  "bg-[#DFEAF7] text-[#344D67]",
  "bg-[#F5E4E2] text-[#714A4A]",
  "bg-[#E5EDF7] text-[#344D67]",
];

function RecentLeadsTable({ leads = [] }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [copiedLeadId, setCopiedLeadId] = useState(null);
  const [copyError, setCopyError] = useState("");

  async function handleCopyLeadId(leadId) {
    try {
      await navigator.clipboard.writeText(leadId);
      setCopiedLeadId(leadId);
      setCopyError("");
      setOpenMenuId(null);
    } catch {
      setCopyError("Clipboard access is unavailable in this browser.");
    }
  }

  return (
    <>
      <section className="overflow-visible rounded-2xl border border-brand-border bg-white shadow-card">

        <div className="flex flex-col gap-3 border-b border-brand-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Users
              size={24}
              strokeWidth={2.2}
              className="text-[#079447]"
              aria-hidden="true"
            />

            <h2 className="text-lg font-bold tracking-tight text-brand-text">
              Recent Leads
            </h2>
          </div>

          <Link
            to="/leads"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#078B37] transition-colors hover:text-[#005D2D]"
          >
            View All Leads
            <ArrowRight size={18} />
          </Link>
        </div>

        {leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[790px] border-collapse text-left">
              <thead>
                <tr className="border-b border-brand-border bg-[#F1F3F5]">
                  <th className="px-4 py-3 text-xs font-bold text-brand-text sm:px-5">
                    Customer Name
                  </th>

                  <th className="px-4 py-3 text-xs font-bold text-brand-text">
                    Monthly Electricity Bill
                  </th>

                  <th className="px-4 py-3 text-xs font-bold text-brand-text">
                    Recommended System
                  </th>

                  <th className="px-4 py-3 text-xs font-bold text-brand-text">
                    Lead Priority
                  </th>

                  <th className="px-4 py-3 text-xs font-bold text-brand-text">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-bold text-brand-text">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-border">
                {leads.map((lead, index) => {
                  const initials = lead.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={lead.id}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              avatarStyles[index % avatarStyles.length],
                            ].join(" ")}
                          >
                            <span className="text-sm font-bold">
                              {initials}
                            </span>
                          </div>

                          <span className="text-sm font-semibold text-brand-text">
                            {lead.name}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-brand-text">
                        {currencyFormatter.format(lead.monthlyBill)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-brand-text">
                        {lead.displaySystemLabel ??
                          (lead.recommendedSystemKw != null
                            ? `${lead.recommendedSystemKw} kW`
                            : "Pending")}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={[
                            "inline-flex min-w-[65px] justify-center rounded-full px-3 py-1 text-xs font-semibold",
                            priorityStyles[lead.priority] ??
                              "bg-gray-100 text-gray-700",
                          ].join(" ")}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={[
                            "inline-flex justify-center rounded-full px-3 py-1 text-xs font-semibold",
                            statusStyles[lead.status] ??
                              "bg-gray-100 text-gray-700",
                          ].join(" ")}
                        >
                          {lead.status ?? "Pending"}
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            aria-label={`View ${lead.name} details`}
                            className="flex h-8 w-9 items-center justify-center rounded-lg border border-[#D4DDE7] text-brand-text transition-colors hover:bg-brand-mint-soft hover:text-brand-emerald focus-visible:outline-2 focus-visible:outline-brand-emerald"
                          >
                            <Eye size={19} />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === lead.id ? null : lead.id
                                )
                              }
                              aria-label={`More actions for ${lead.name}`}
                              aria-expanded={openMenuId === lead.id}
                              className="flex h-8 w-9 items-center justify-center rounded-lg border border-[#D4DDE7] text-brand-text transition-colors hover:bg-brand-background focus-visible:outline-2 focus-visible:outline-brand-emerald"
                            >
                              <MoreHorizontal size={19} />
                            </button>

                            {openMenuId === lead.id && (
                              <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-brand-border bg-white p-1.5 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-brand-text hover:bg-brand-background"
                                >
                                  <Eye size={15} />
                                  View details
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyLeadId(lead.id)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-brand-text hover:bg-brand-background"
                                >
                                  <Copy size={15} />
                                  Copy lead ID
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-brand-muted">
            No recent leads available.
          </div>
        )}

        <div className="border-t border-brand-border px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-brand-muted">
              Illustrative demonstration records. Low priority does not mean rejected.
            </p>

            {copiedLeadId && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-emerald">
                <Check size={14} />
                Lead ID copied
              </span>
            )}

            {copyError && (
              <span role="status" className="text-xs text-red-600">
                {copyError}
              </span>
            )}
          </div>
        </div>

      </section>

      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLead(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-detail-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="lead-detail-title"
                  className="text-lg font-bold text-brand-text"
                >
                  Lead Details
                </h2>

                <p className="mt-1 text-sm text-brand-muted">
                  Illustrative demo record
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                aria-label="Close lead details"
                className="rounded-lg p-2 text-brand-muted hover:bg-brand-background"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs text-brand-muted">Customer Name</p>
                <p className="mt-1 text-sm font-semibold text-brand-text">
                  {selectedLead.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-brand-muted">Lead ID</p>
                <p className="mt-1 text-sm font-medium text-brand-text">
                  {selectedLead.id}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-brand-muted">Monthly Bill</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {currencyFormatter.format(selectedLead.monthlyBill)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-brand-muted">Monthly Units</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {Number(selectedLead.monthlyUnits).toLocaleString("en-IN")}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-brand-muted">Ownership</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {selectedLead.ownership}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-brand-muted">Priority</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {selectedLead.priority}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-brand-muted">System Label</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {selectedLead.displaySystemLabel ?? "Pending"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-brand-muted">Status</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {selectedLead.status ?? "Pending"}
                  </p>
                </div>
              </div>

              <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Display values are for demonstration. System sizing and lead
                status must be confirmed using verified application data.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default RecentLeadsTable;