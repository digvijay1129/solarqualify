import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import AuthField from "./AuthField.jsx";

function RegistrationStepAccount({ values, errors, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-bold text-brand-text">Account summary</p>
        <p className="mt-1 text-sm text-brand-muted">{values.fullName || "Homeowner"} · {values.email || "Email address"}</p>
        <p className="mt-1 text-xs text-brand-muted">The demo will validate the form only. No account will be created until the backend is connected.</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          id="password"
          label="Create Password"
          icon={LockKeyhole}
          value={values.password}
          onChange={(value) => onChange("password", value)}
          placeholder="At least 8 characters"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          error={errors.password}
          rightSlot={
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)} className="shrink-0 rounded-md p-1 text-slate-600 hover:bg-slate-100">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <AuthField
          id="confirmPassword"
          label="Confirm Password"
          icon={LockKeyhole}
          value={values.confirmPassword}
          onChange={(value) => onChange("confirmPassword", value)}
          placeholder="Re-enter your password"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          error={errors.confirmPassword}
          rightSlot={
            <button type="button" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} onClick={() => setShowConfirmPassword((current) => !current)} className="shrink-0 rounded-md p-1 text-slate-600 hover:bg-slate-100">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-sm leading-5 text-brand-text">
        <input
          type="checkbox"
          checked={values.termsAccepted}
          onChange={(event) => onChange("termsAccepted", event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-green-700"
        />
        <span>I acknowledge the terms and privacy notice for this demo registration.</span>
      </label>
      {errors.termsAccepted && <p className="-mt-2 text-xs font-medium text-red-600">{errors.termsAccepted}</p>}

      <div className="flex items-start gap-2 rounded-xl bg-green-50 px-3.5 py-3 text-xs leading-5 text-green-950">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-emerald" />
        <p>Do not use a real password in this frontend prototype. The password is held in component memory only and is not sent or saved.</p>
      </div>
    </div>
  );
}

export default RegistrationStepAccount;
