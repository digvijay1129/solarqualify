import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthNotice from "../components/AuthNotice.jsx";
import AuthShell from "../components/AuthShell.jsx";
import AuthStepper from "../components/AuthStepper.jsx";
import RegistrationStepAccount from "../components/RegistrationStepAccount.jsx";
import RegistrationStepBasic from "../components/RegistrationStepBasic.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateRegistrationStep } from "../utils/authentication-validation.js";
import { authenticationFixture } from "../../../mocks/fixtures/authentication.fixture.js";

const registrationSteps = [
  { id: 1, label: "Contact Details", title: "Contact Details", description: "Tell us how to identify and contact you." },
  { id: 2, label: "Create Account", title: "Secure Your Account", description: "Choose a password to finish creating your homeowner account." },
];

const initialValues = {
  fullName: "",
  mobileNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
};

function HomeownerRegistrationPage() {
  const navigate = useNavigate();
  const { registerHomeowner } = useAuth();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  function handleBack() {
    setStep((current) => Math.max(1, current - 1));
    setErrors({});
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validateRegistrationStep(step, values);
    setErrors(nextErrors);
    setNotice(null);

    if (Object.keys(nextErrors).length > 0) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      await registerHomeowner({
        name: values.fullName.trim(),
        email: values.email.trim(),
        phone: "+91 " + values.mobileNumber,
        password: values.password,
      });
      navigate("/homeowner", { replace: true });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error?.message || "Unable to create your account. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const stepDefinition = registrationSteps[step - 1];

  return (
    <AuthShell
      heroTitle={<>Create Your <span className="text-green-800">Homeowner</span> Account</>}
      heroDescription="Create your SolarQualify account to access your homeowner portal and continue with a solar enquiry."
      benefits={authenticationFixture.registrationBenefits}
      benefitLayout="list"
    >
      <div className="w-full">
        <header className="mb-5 flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-mint-soft text-brand-forest">
            <UserPlus size={29} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-brand-text sm:text-2xl">Homeowner Registration</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-600 sm:text-sm">Create your account in two simple steps</p>
          </div>
        </header>

        <AuthStepper steps={registrationSteps} currentStep={step} />

        <form onSubmit={handleSubmit} noValidate className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:mt-6 sm:p-5 lg:p-6">
          <div className="mb-5">
            <span className="inline-flex rounded-lg bg-brand-mint-soft px-3 py-1.5 text-sm font-extrabold text-brand-forest">
              Step {step} of 2: {stepDefinition.title}
            </span>
            <p className="mt-3 text-sm text-slate-600">{stepDefinition.description}</p>
          </div>

          {step === 1
            ? <RegistrationStepBasic values={values} errors={errors} onChange={handleChange} />
            : <RegistrationStepAccount values={values} errors={errors} onChange={handleChange} />}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-blue-50 px-3.5 py-3 text-xs leading-5 text-blue-950">
            <Info size={17} className="mt-0.5 shrink-0 text-blue-700" />
            <p>Account registration currently saves your name, mobile number, email and password hash. Address and roof/property details will be collected later when the solar lead-submission API is integrated.</p>
          </div>

          {notice && <div className="mt-4"><AuthNotice tone={notice.tone}>{notice.message}</AuthNotice></div>}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step === 1 ? (
              <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-emerald px-5 py-2.5 text-sm font-bold text-brand-forest hover:bg-brand-mint-soft">
                Cancel
              </Link>
            ) : (
              <button type="button" onClick={handleBack} disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-emerald px-5 py-2.5 text-sm font-bold text-brand-forest hover:bg-brand-mint-soft disabled:opacity-60">
                <ArrowLeft size={17} /> Back
              </button>
            )}

            <button type="submit" disabled={submitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-brand-forest px-6 py-3 text-sm font-extrabold text-white shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70">
              {submitting ? "Creating account…" : step === 2 ? "Create Account" : "Continue"}
              {!submitting && (step === 2 ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />)}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Already have an account? <Link to="/login" className="font-extrabold text-brand-forest hover:underline">Sign In</Link>
        </p>
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
          By creating an account, you acknowledge the terms and privacy notice displayed above.
        </p>
      </div>
    </AuthShell>
  );
}

export default HomeownerRegistrationPage;
