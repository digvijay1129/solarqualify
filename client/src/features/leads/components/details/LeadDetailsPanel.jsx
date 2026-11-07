import {
  UserRound,
  Phone,
  Mail,
  MapPin,
  X,
  IndianRupee,
  CalendarDays,
} from "lucide-react";

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

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-brand-text"
        aria-hidden="true"
      />

      <div className="min-w-0">
        <p className="break-all text-sm font-medium text-brand-text">
          {value || "Not provided"}
        </p>

        <p className="mt-0.5 text-xs text-brand-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

function LeadDetailsPanel({
  lead,
  onClose = () => {},
  onCreateQuotation = () => {},
  onScheduleVisit = () => {},
}) {
  if (!lead) {
    return (
      <aside className="rounded-2xl border border-brand-border bg-white p-8 text-center shadow-card">
        <UserRound
          size={32}
          className="mx-auto text-brand-muted"
          aria-hidden="true"
        />

        <h2 className="mt-3 text-base font-semibold text-brand-text">
          Lead Details
        </h2>

        <p className="mt-2 text-sm text-brand-muted">
          Select a customer from the table to view their details.
        </p>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Selected lead details"
      className="h-fit rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-text">
            Lead Details
          </h2>

          <p className="mt-1 text-xs text-brand-muted">
            Illustrative demo record
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close lead details"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-muted transition hover:bg-brand-background hover:text-brand-text focus-visible:outline-2 focus-visible:outline-brand-emerald"
        >
          <X size={19} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#078B37]">
          <UserRound size={30} strokeWidth={2} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h3 className="break-words text-base font-bold text-brand-text">
            {lead.name}
          </h3>

          <p className="mt-1 text-sm font-medium text-brand-muted">
            {lead.referenceId}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <DetailItem
          icon={Phone}
          label="Phone"
          value={lead.phone}
        />

        <DetailItem
          icon={Mail}
          label="Email"
          value={lead.email}
        />

        <DetailItem
          icon={MapPin}
          label="Location"
          value={lead.location}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 divide-x divide-brand-border rounded-xl border border-brand-border bg-white">
        <div className="min-w-0 p-3">
          <p className="text-xs font-medium text-brand-muted">
            Monthly Bill
          </p>

          <p className="mt-1 break-words text-lg font-bold text-brand-text">
            {currencyFormatter.format(lead.monthlyBill)}
          </p>
        </div>

        <div className="min-w-0 p-3">
          <p className="text-xs font-medium text-brand-muted">
            Recommended System
          </p>

          <p className="mt-1 text-lg font-bold text-brand-text">
            {lead.recommendedSystemKw != null
              ? `${lead.recommendedSystemKw} kW`
              : "Pending"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold text-brand-text">
            Priority
          </p>

          <span
            className={[
              "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
              priorityStyles[lead.priority] ?? "bg-gray-100 text-gray-700",
            ].join(" ")}
          >
            {lead.priority}
          </span>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-brand-text">
            Status
          </p>

          <span
            className={[
              "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
              statusStyles[lead.status] ?? "bg-gray-100 text-gray-700",
            ].join(" ")}
          >
            {lead.status}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={() => onCreateQuotation(lead)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#079447] to-[#00723A] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald"
        >
          <IndianRupee size={19} aria-hidden="true" />
          Create Quotation
        </button>

        <button
          type="button"
          onClick={() => onScheduleVisit(lead)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#C7D2E0] bg-white px-4 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-emerald hover:bg-brand-mint-soft"
        >
          <CalendarDays size={18} aria-hidden="true" />
          Schedule Site Visit
        </button>
      </div>

      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        Displayed values are for demonstration. Customer information and
        system recommendations must be confirmed using verified application data.
      </p>
    </aside>
  );
}

export default LeadDetailsPanel;