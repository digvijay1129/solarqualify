import { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import AuthField from "../components/AuthField.jsx";
import AuthNotice from "../components/AuthNotice.jsx";
import AuthShell from "../components/AuthShell.jsx";
import { requestPasswordResetDemo } from "../services/authentication.service.js";
import { isValidEmail } from "../utils/authentication-validation.js";
import { authenticationFixture } from "../../../mocks/fixtures/authentication.fixture.js";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    const result = await requestPasswordResetDemo();
    setNotice({ tone: "warning", message: result.message });
  }

  return (
    <AuthShell
      heroTitle="A Brighter Solar Journey Starts Here"
      heroDescription="Return to SolarQualify to review your solar enquiry, quotations and project progress."
      benefits={authenticationFixture.loginBenefits}
    >
      <div className="mx-auto w-full max-w-[600px]">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mint-soft text-brand-forest">
          <ShieldCheck size={30} />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-brand-text sm:text-3xl">Forgot Password?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Enter the email address associated with your SolarQualify account.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <AuthField
            id="reset-email"
            label="Email Address"
            icon={Mail}
            type="email"
            value={email}
            onChange={(value) => { setEmail(value); setError(""); setNotice(null); }}
            placeholder="Enter your email address"
            autoComplete="email"
            error={error}
          />
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-brand-forest px-5 py-3 text-sm font-extrabold text-white shadow-md hover:brightness-105">
            Continue
          </button>
          <AuthNotice tone={notice?.tone}>{notice?.message}</AuthNotice>
          <Link to="/login" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-emerald px-4 py-2.5 text-sm font-bold text-brand-forest hover:bg-brand-mint-soft">
            <ArrowLeft size={17} /> Back to Sign In
          </Link>
        </form>
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">Password-reset email delivery is not connected in this frontend demo.</p>
      </div>
    </AuthShell>
  );
}

export default ForgotPasswordPage;
