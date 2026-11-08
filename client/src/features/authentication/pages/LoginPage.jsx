import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import AuthField from "../components/AuthField.jsx";
import AuthNotice from "../components/AuthNotice.jsx";
import AuthShell from "../components/AuthShell.jsx";
import RoleSelector from "../components/RoleSelector.jsx";
import { signInDemo } from "../services/authentication.service.js";
import { validateSignIn } from "../utils/authentication-validation.js";
import { authenticationFixture } from "../../../mocks/fixtures/authentication.fixture.js";

function LoginPage() {
  const [role, setRole] = useState("homeowner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateSignIn({ role, email, password });
    setErrors(nextErrors);
    setNotice(null);

    if (Object.keys(nextErrors).length > 0) return;

    const result = await signInDemo({ role, email, password, rememberMe });
    setNotice({ tone: "warning", message: result.message });
  }

  function handleGoogleSignIn() {
    setNotice({
      tone: "info",
      message: "Google sign-in is shown as a design option only. OAuth is not configured in this frontend phase.",
    });
  }

  return (
    <AuthShell benefits={authenticationFixture.loginBenefits} compact>
      <div className="mx-auto w-full max-w-[660px]">
        <header className="text-center">
          <h2 className="text-[clamp(1.8rem,3vw,2.7rem)] font-black tracking-tight text-brand-text">Welcome to <span className="text-brand-forest">SolarQualify</span></h2>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">Rooftop Solar Management Platform</p>
        </header>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="mt-5 space-y-4 sm:mt-6 sm:space-y-[18px] lg:mt-4 lg:space-y-3">
          <RoleSelector roles={authenticationFixture.roles} value={role} onChange={(value) => { setRole(value); setNotice(null); }} />
          {role === "sales-staff" && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              Sales Staff accounts are intended to be provisioned by an administrator. Staff self-registration is not enabled.
            </p>
          )}

          <AuthField
            id="login-identity"
            compact
            label="Email Address"
            icon={Mail}
            value={email}
            onChange={(value) => { setEmail(value); setErrors((current) => ({ ...current, email: undefined })); setNotice(null); }}
            placeholder="Enter your email address"
            type="email"
            autoComplete="off"
            error={errors.email}
          />
          <AuthField
            id="login-secret"
            compact
            label="Password"
            icon={LockKeyhole}
            value={password}
            onChange={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: undefined })); setNotice(null); }}
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            error={errors.password}
            rightSlot={
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)} className="shrink-0 rounded-md p-1 text-slate-600 hover:bg-slate-100">
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-brand-text">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded accent-green-700" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-bold text-brand-forest hover:underline">Forgot password?</Link>
          </div>

          <button type="submit" className="inline-flex min-h-[58px] w-full items-center sm:min-h-[64px] lg:min-h-[54px] justify-center gap-3 rounded-xl bg-gradient-to-r from-green-600 to-brand-forest px-5 py-3 text-base font-extrabold text-white shadow-md transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:ring-offset-2">
            Sign In <ArrowRight size={22} />
          </button>

          <AuthNotice tone={notice?.tone}>{notice?.message}</AuthNotice>

          <div className="flex items-center gap-3 py-1 text-xs text-slate-500 lg:py-0">
            <span className="h-px flex-1 bg-slate-200" />
            or continue with
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={handleGoogleSignIn} className="flex min-h-[52px] w-full items-center sm:min-h-[58px] lg:min-h-[50px] justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-brand-text shadow-sm hover:bg-slate-50">
            <span aria-hidden="true" className="bg-[conic-gradient(from_-45deg,#4285F4_0_25%,#34A853_25%_50%,#FBBC05_50%_75%,#EA4335_75%_100%)] bg-clip-text text-2xl font-black text-transparent">G</span>
            Continue with Google
          </button>

          <p className="pt-1 text-center text-sm text-brand-text">
            New to SolarQualify?{" "}
            <Link to="/register" className="ml-1 font-extrabold text-brand-forest hover:underline">Create an Account</Link>
          </p>
        </form>

        <p className="mt-4 text-center text-[10px] leading-4 text-slate-500 lg:mt-2">
          Frontend demo only. Sign-in, OAuth, remember-me persistence and role authorization are not connected to a backend.
        </p>
      </div>
    </AuthShell>
  );
}

export default LoginPage;
