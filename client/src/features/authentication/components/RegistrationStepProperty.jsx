import { IndianRupee, Ruler } from "lucide-react";
import AuthField from "./AuthField.jsx";

function RegistrationStepProperty({ values, errors, onChange, roofTypes, ownershipOptions }) {
  return (
    <div className="space-y-5">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-bold text-brand-text">
          Property Ownership <span className="text-red-600" aria-hidden="true">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ownershipOptions.map((option) => (
            <label
              key={option.value}
              className={[
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold",
                values.ownershipStatus === option.value ? "border-brand-emerald bg-brand-mint-soft text-brand-forest" : "border-slate-300 bg-white text-brand-text",
              ].join(" ")}
            >
              <input
                type="radio"
                name="ownershipStatus"
                value={option.value}
                checked={values.ownershipStatus === option.value}
                onChange={(event) => onChange("ownershipStatus", event.target.value)}
                className="h-4 w-4 accent-green-700"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.ownershipStatus && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.ownershipStatus}</p>}
      </fieldset>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="roofType" className="mb-1.5 flex items-center gap-1 text-sm font-bold text-brand-text">
            Roof Type <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <select
            id="roofType"
            value={values.roofType}
            onChange={(event) => onChange("roofType", event.target.value)}
            aria-invalid={Boolean(errors.roofType)}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-brand-text outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
          >
            <option value="">Select roof type</option>
            {roofTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          {errors.roofType && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.roofType}</p>}
        </div>
        <AuthField
          id="roofAreaSqFt"
          label="Approximate Roof Area (sq. ft.)"
          icon={Ruler}
          value={values.roofAreaSqFt}
          onChange={(value) => onChange("roofAreaSqFt", value)}
          placeholder="Enter usable roof area"
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          error={errors.roofAreaSqFt}
        />
        <AuthField
          id="monthlyElectricityBill"
          label="Average Monthly Electricity Bill (₹)"
          icon={IndianRupee}
          value={values.monthlyElectricityBill}
          onChange={(value) => onChange("monthlyElectricityBill", value)}
          placeholder="Enter monthly bill amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          error={errors.monthlyElectricityBill}
        />
      </div>

      <p className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs leading-5 text-blue-900">
        These details help prepare a relevant solar enquiry. Roof measurements and bill details must be verified before a final recommendation or quotation.
      </p>
    </div>
  );
}

export default RegistrationStepProperty;
