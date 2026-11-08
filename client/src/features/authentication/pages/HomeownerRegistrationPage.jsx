import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNotice from "../components/AuthNotice.jsx";
import AuthShell from "../components/AuthShell.jsx";
import AuthStepper from "../components/AuthStepper.jsx";
import RegistrationStepAccount from "../components/RegistrationStepAccount.jsx";
import RegistrationStepAddress from "../components/RegistrationStepAddress.jsx";
import RegistrationStepBasic from "../components/RegistrationStepBasic.jsx";
import RegistrationStepProperty from "../components/RegistrationStepProperty.jsx";
import { registerHomeownerDemo } from "../services/authentication.service.js";
import { validateRegistrationStep } from "../utils/authentication-validation.js";
import { authenticationFixture } from "../../../mocks/fixtures/authentication.fixture.js";

const initialValues = {
  fullName: "",
  mobileNumber: "",
  email: "",
  dateOfBirth: "",
  houseFlatNo: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  ownershipStatus: "owner",
  roofType: "",
  roofAreaSqFt: "",
  monthlyElectricityBill: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
};

function HomeownerRegistrationPage() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [completed, setCompleted] = useState(false);

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
    if (completed) return;
    const nextErrors = validateRegistrationStep(step, values);
    setErrors(nextErrors);
    setNotice(null);

    if (Object.keys(nextErrors).length > 0) return;

    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    const result = await registerHomeownerDemo();
    setCompleted(true);
    setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
    setNotice({ tone: "warning", message: result.message });
  }

  let stepContent;
  if (step === 1) {
    stepContent = <RegistrationStepBasic values={values} errors={errors} onChange={handleChange} />;
  } else if (step === 2) {
    stepContent = (
      <RegistrationStepAddress
        values={values}
        errors={errors}
        onChange={handleChange}
        states={authenticationFixture.statesAndUnionTerritories}
      />
    );
  } else if (step === 3) {
    stepContent = (
      <RegistrationStepProperty
        values={values}
        errors={errors}
        onChange={handleChange}
        roofTypes={authenticationFixture.roofTypes}
        ownershipOptions={authenticationFixture.ownershipOptions}
      />
    );
  } else {
    stepContent = <RegistrationStepAccount values={values} errors={errors} onChange={handleChange} />;
  }

  const stepDefinition = authenticationFixture.registrationSteps[step - 1];

  return (
    <AuthShell
      heroTitle={<>Create Your <span className="text-green-800">Homeowner</span> Account</>}
      heroDescription="Register to get a solar quotation, track your project and follow your subsidy application — all in one place."
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
            <p className="mt-0.5 text-xs leading-5 text-slate-600 sm:text-sm">Create your SolarQualify account in a few easy steps</p>
          </div>
        </header>

        <AuthStepper steps={authenticationFixture.registrationSteps} currentStep={step} />

        <form onSubmit={handleSubmit} noValidate className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:mt-6 sm:p-5 lg:p-6">
          <div className="mb-5">
            <span className="inline-flex rounded-lg bg-brand-mint-soft px-3 py-1.5 text-sm font-extrabold text-brand-forest">
              Step {step} of 4: {stepDefinition.title}
            </span>
            <p className="mt-3 text-sm text-slate-600">{stepDefinition.description}</p>
          </div>

          {stepContent}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-green-50 px-3.5 py-3 text-xs leading-5 text-green-950">
            <Info size={17} className="mt-0.5 shrink-0 text-brand-emerald" />
            <p>Your entries remain in this page's memory while you complete the steps. They are not sent to a server or saved in browser storage in this demo.</p>
          </div>

          {notice && <div className="mt-4"><AuthNotice tone={notice.tone}>{notice.message}</AuthNotice></div>}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step === 1 ? (
              <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-emerald px-5 py-2.5 text-sm font-bold text-brand-forest hover:bg-brand-mint-soft">
                Cancel
              </Link>
            ) : (
              <button type="button" onClick={handleBack} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-emerald px-5 py-2.5 text-sm font-bold text-brand-forest hover:bg-brand-mint-soft">
                <ArrowLeft size={17} /> Back
              </button>
            )}

            {completed ? (
              <Link to="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-emerald">
                Back to Sign In <ArrowRight size={17} />
              </Link>
            ) : (
              <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-brand-forest px-6 py-3 text-sm font-extrabold text-white shadow-md hover:brightness-105">
                {step === 4 ? "Create Account (Demo)" : `Next: ${authenticationFixture.registrationSteps[step].label}`}
                {step === 4 ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
              </button>
            )}
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Already have an account? <Link to="/login" className="font-extrabold text-brand-forest hover:underline">Sign In</Link>
        </p>
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
          Demo registration only. No account, password, or personal information is persisted.
        </p>
      </div>
    </AuthShell>
  );
}

export default HomeownerRegistrationPage;
