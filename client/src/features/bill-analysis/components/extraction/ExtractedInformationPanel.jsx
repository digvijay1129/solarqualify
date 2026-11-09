import {
  UserRound,
  FileText,
  Zap,
  Activity,
  IndianRupee,
  CalendarDays,
  CircleAlert,
  CheckCircle2,
  RefreshCw,
  Save,
  ArrowRight,
} from "lucide-react";

const fieldConfig = {
  consumerNumber: {
    label: "Consumer Number",
    placeholder: "Enter consumer number",
    icon: UserRound,
  },
  tariff: {
    label: "Tariff",
    placeholder: "Enter tariff category",
    icon: FileText,
  },
  sanctionedLoad: {
    label: "Sanctioned Load",
    placeholder: "Enter sanctioned load",
    icon: Zap,
  },
  sanctionedLoadUnit: {
    label: "Sanctioned Load Unit",
    placeholder: "kW, kVA or HP",
    icon: Zap,
  },
  monthlyUnits: {
    label: "Monthly Units Consumed",
    placeholder: "Enter monthly units",
    icon: Activity,
  },
  billAmount: {
    label: "Bill Amount (₹)",
    placeholder: "Enter bill amount",
    icon: IndianRupee,
  },
  billMonth: {
    label: "Bill Month",
    placeholder: "Enter bill month",
    icon: CalendarDays,
  },
};

function ExtractedInformationPanel({
  fields = [],
  editable = false,
  onFieldChange = () => {},
  extractionStatus = "not-started",
  validationErrors = {},
  onReupload = () => {},
  onSaveDraft = () => {},
  onConfirmDetails = () => {},
  reviewMessage = "",
  isConfirmed = false,
  extractionConfidence = null,
  confirmLabel = "Confirm & Verify",
  disabled = false,
}) {
  const isCompleted = extractionStatus === "completed";

  const statusLabel = isCompleted
    ? "Extraction Completed"
    : extractionStatus === "processing"
      ? "Processing"
      : "Awaiting Extraction";

  return (
    <section className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mint-soft text-brand-emerald">
            <Activity size={23} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-brand-text">
              Extracted Information (OCR)
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              Electricity bill details
            </p>
          </div>
        </div>

        <span
          className={[
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
            isCompleted
              ? "bg-green-100 text-green-800"
              : "bg-amber-50 text-amber-800",
          ].join(" ")}
        >
          {isCompleted ? (
            <CheckCircle2 size={14} aria-hidden="true" />
          ) : (
            <CircleAlert size={14} aria-hidden="true" />
          )}
          {statusLabel}
        </span>
      </div>

      <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 px-3 sm:px-4">
        {fields.map((field) => {
          const config = fieldConfig[field.id];

          if (!config) return null;

          const FieldIcon = config.icon;
          const fieldValue = field.value ?? "";
          const error = validationErrors[field.id];

          return (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(145px,0.9fr)_minmax(0,1.35fr)] sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FieldIcon
                  size={19}
                  className="shrink-0 text-brand-emerald"
                  aria-hidden="true"
                />

                <label
                  htmlFor={`bill-field-${field.id}`}
                  className="min-w-0 text-sm font-semibold text-brand-text"
                >
                  {config.label}
                  {field.required && (
                    <span className="ml-1 text-red-500" aria-label="Required">
                      *
                    </span>
                  )}
                </label>
              </div>

              <div className="min-w-0">
                {field.id === "sanctionedLoadUnit" ? (
                  <select
                    id={`bill-field-${field.id}`}
                    value={fieldValue}
                    disabled={!editable}
                    onChange={(event) => onFieldChange(field.id, event.target.value)}
                    aria-label={config.label}
                    aria-required={field.required}
                    aria-invalid={Boolean(error)}
                    className={[
                      "h-10 w-full min-w-0 rounded-lg border bg-white px-3 text-sm text-brand-text outline-none",
                      error ? "border-red-400" : editable ? "border-slate-200 focus:border-brand-emerald" : "cursor-default border-slate-200 bg-slate-50",
                    ].join(" ")}
                  >
                    <option value="">Select unit</option>
                    <option value="kW">kW</option>
                    <option value="kVA">kVA</option>
                    <option value="HP">HP</option>
                  </select>
                ) : (
                  <input
                    id={`bill-field-${field.id}`}
                    type="text"
                    value={fieldValue}
                    placeholder={config.placeholder}
                    readOnly={!editable}
                    onChange={(event) => onFieldChange(field.id, event.target.value)}
                    aria-label={config.label}
                    aria-required={field.required}
                    aria-invalid={Boolean(error)}
                    className={[
                      "h-10 w-full min-w-0 rounded-lg border bg-white px-3 text-sm text-brand-text outline-none placeholder:text-slate-400",
                      error ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100" : editable ? "border-slate-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10" : "cursor-default border-slate-200 bg-slate-50",
                    ].join(" ")}
                  />
                )}

                {error ? (
                  <p className="mt-1 text-[11px] text-red-600" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-brand-muted">
                    {fieldValue
                      ? "Manual entry — review required"
                      : "Awaiting bill extraction or manual entry"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
        <CircleAlert
          size={20}
          className="mt-0.5 shrink-0 text-amber-600"
          aria-hidden="true"
        />

        <div>
          <p className="text-sm font-bold text-amber-900">
            Manual verification required
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Please review the extracted information and correct it if needed
            before it is used for lead qualification or solar calculations.
            OCR values are not trusted until Sales Staff verifies them.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Extraction confidence: <strong className="text-slate-900">{extractionConfidence == null ? "Not available" : `${Math.round(extractionConfidence * 100)}%`}</strong>
        <span className="ml-1 text-[10px]">Confidence is an OCR processor signal, not a verification result.</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <button
          type="button"
          onClick={onReupload}
          disabled={disabled}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald"
        >
          <RefreshCw size={17} aria-hidden="true" />
          Re-upload
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={disabled}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald"
        >
          <Save size={17} aria-hidden="true" />
          Save Draft
        </button>

        <button
          type="button"
          onClick={onConfirmDetails}
          disabled={disabled}
          className="inline-flex min-h-11 whitespace-nowrap items-center justify-center gap-1 rounded-xl bg-brand-emerald px-2 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-emerald-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald xl:text-[13px]"
        >
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{confirmLabel}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      {reviewMessage && (
        <div
          role="status"
          className={[
            "mt-4 rounded-xl border px-4 py-3 text-sm leading-6",
            isConfirmed
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-blue-200 bg-blue-50 text-blue-900",
          ].join(" ")}
        >
          {reviewMessage}
        </div>
      )}
    </section>
  );
}

export default ExtractedInformationPanel;