import { Building2, MapPin } from "lucide-react";
import AuthField from "./AuthField.jsx";

function RegistrationStepAddress({ values, errors, onChange, states }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      <AuthField
        id="houseFlatNo"
        label="House / Flat Number"
        icon={Building2}
        value={values.houseFlatNo}
        onChange={(value) => onChange("houseFlatNo", value)}
        placeholder="e.g. Flat 2B, House 12"
        autoComplete="address-line2"
        error={errors.houseFlatNo}
      />
      <AuthField
        id="addressLine1"
        label="Street / Locality"
        icon={MapPin}
        value={values.addressLine1}
        onChange={(value) => onChange("addressLine1", value)}
        placeholder="Enter street or locality"
        autoComplete="address-line1"
        error={errors.addressLine1}
      />
      <AuthField
        id="addressLine2"
        label="Landmark / Area Details"
        icon={MapPin}
        value={values.addressLine2}
        onChange={(value) => onChange("addressLine2", value)}
        placeholder="Nearby landmark (optional)"
        optional
        error={errors.addressLine2}
      />
      <AuthField
        id="city"
        label="City / Town"
        icon={MapPin}
        value={values.city}
        onChange={(value) => onChange("city", value)}
        placeholder="Enter city or town"
        autoComplete="address-level2"
        error={errors.city}
      />
      <div className="min-w-0">
        <label htmlFor="state" className="mb-1.5 flex items-center gap-1 text-sm font-bold text-brand-text">
          State / Union Territory <span className="text-red-600" aria-hidden="true">*</span>
        </label>
        <select
          id="state"
          name="state"
          value={values.state}
          onChange={(event) => onChange("state", event.target.value)}
          aria-invalid={Boolean(errors.state)}
          aria-describedby={errors.state ? "state-error" : undefined}
          className="min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-brand-text outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
        >
          <option value="">Select state / UT</option>
          {states.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
        {errors.state && <p id="state-error" className="mt-1.5 text-xs font-medium text-red-600">{errors.state}</p>}
      </div>
      <AuthField
        id="pincode"
        label="Pincode"
        icon={MapPin}
        value={values.pincode}
        onChange={(value) => onChange("pincode", value.replace(/\D/g, "").slice(0, 6))}
        placeholder="Enter 6-digit pincode"
        inputMode="numeric"
        autoComplete="postal-code"
        error={errors.pincode}
      />
    </div>
  );
}

export default RegistrationStepAddress;
