import { useState } from "react";
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Info,
  Send, UserRound, House, Zap, FileUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import HomeownerHero from "../components/HomeownerHero.jsx";
import HomeownerStepper from "../components/HomeownerStepper.jsx";
import InquiryJourney from "../components/InquiryJourney.jsx";
import FileUploadField from "../components/FileUploadField.jsx";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { LEAD_STEPS, validateLeadStep, MAX_BILL_SIZE_MB } from "../utils/homeowner-portal.js";

const emptyValues = {
  fullName: "", mobileNumber: "", email: "", preferredContact: "phone",
  addressLine1: "", addressLine2: "", city: "", state: "Maharashtra", pincode: "",
  propertyType: "Independent House", ownershipStatus: "owner", roofType: "",
  roofAreaSqFt: "", monthlyElectricityBill: "", monthlyUnits: "", sanctionedLoadKw: "",
};

function Field({ label, value, onChange, error, type = "text", placeholder, required = false, ...props }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-extrabold text-slate-800">{label}{required && <span className="ml-1 text-red-600">*</span>}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${error ? "border-red-400" : "border-slate-300"}`} {...props} />
      {error && <span role="alert" className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, error, required = false }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-extrabold text-slate-800">{label}{required && <span className="ml-1 text-red-600">*</span>}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${error ? "border-red-400" : "border-slate-300"}`}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <span role="alert" className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}

function HomeownerLeadSubmissionPage() {
  const { profile, submitLead, setNotice } = useHomeownerPortal();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(() => ({
    ...emptyValues,
    fullName: profile.fullName,
    mobileNumber: profile.mobileNumber,
    email: profile.email,
    city: profile.city,
    state: profile.state,
    addressLine1: profile.addressLine1,
    pincode: profile.pincode,
  }));
  const [billFile, setBillFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [busy, setBusy] = useState(false);
  const stepDefinition = LEAD_STEPS[step - 1];

  function change(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function next() {
    const nextErrors = validateLeadStep(step, values, billFile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStep((current) => Math.min(5, current + 1));
  }

  function back() {
    setStep((current) => Math.max(1, current - 1));
    setErrors({});
  }

  function handleFileChange(file, error) {
    setBillFile(file);
    setFileError(error || "");
    setErrors((current) => ({ ...current, billFile: undefined }));
  }

  function handleSubmit() {
    if (busy || submitted) return;
    setBusy(true);
    const record = {
      ...values,
      billFileName: billFile?.name ?? null,
      billFileSize: billFile?.size ?? null,
      source: "homeowner-portal-demo",
    };
    const id = submitLead(record);
    setSubmitted({ id });
    setNotice({ tone: "success", message: "Your inquiry was added to this page session only. It has not been sent to a server or assigned to a sales team." });
    setBusy(false);
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><CheckCircle2 size={34} /></span>
        <h1 className="mt-5 text-2xl font-black text-slate-950">Inquiry saved in this demo</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your sample inquiry reference is <strong>{submitted.id}</strong>. No personal information or bill file was uploaded to a server.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/homeowner" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Go to Dashboard</Link>
          <button type="button" onClick={() => { setSubmitted(null); setStep(1); setValues(emptyValues); setBillFile(null); }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700">Submit another demo inquiry</button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <HomeownerHero eyebrow="New homeowner inquiry" title="Submit a Solar Installation Inquiry" description="Tell us about your home, roof and energy usage. We’ll review the information and demonstrate the solar qualification journey." />
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-5 shadow-sm sm:px-5">
        <HomeownerStepper steps={LEAD_STEPS} currentStep={step} />
      </div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[1.48fr_.72fr]">
        <form onSubmit={(event) => { event.preventDefault(); if (step < 5) next(); else handleSubmit(); }} noValidate className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">{step === 1 ? <UserRound /> : step === 2 ? <House /> : step === 3 ? <Zap /> : step === 4 ? <FileUp /> : <ClipboardCheck />}</span>
            <div className="min-w-0"><span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-950">Step {step} of 5: {stepDefinition.label}</span><p className="mt-1 text-sm text-slate-500">{stepDefinition.description}</p></div>
          </div>

          {step === 1 && (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" required value={values.fullName} onChange={(value) => change("fullName", value)} error={errors.fullName} placeholder="Enter your full name" />
              <Field label="Mobile Number" required value={values.mobileNumber} onChange={(value) => change("mobileNumber", value)} error={errors.mobileNumber} placeholder="10-digit mobile number" inputMode="numeric" />
              <Field label="Email Address" required value={values.email} onChange={(value) => change("email", value)} error={errors.email} placeholder="Enter your email" type="email" />
              <fieldset className="min-w-0"><legend className="mb-2 text-xs font-extrabold text-slate-800">Preferred Contact Method *</legend><div className="flex flex-wrap gap-4">{["phone", "email", "whatsapp"].map((method) => <label key={method} className="inline-flex items-center gap-1.5 text-xs text-slate-700"><input type="radio" name="preferredContact" checked={values.preferredContact === method} onChange={() => change("preferredContact", method)} className="accent-emerald-700" />{method[0].toUpperCase() + method.slice(1)}</label>)}</div>{errors.preferredContact && <p className="mt-1 text-xs text-red-600">{errors.preferredContact}</p>}</fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Address Line 1" required value={values.addressLine1} onChange={(value) => change("addressLine1", value)} error={errors.addressLine1} placeholder="House / flat number and street" /></div>
              <div className="sm:col-span-2"><Field label="Address Line 2" value={values.addressLine2} onChange={(value) => change("addressLine2", value)} placeholder="Landmark or area (optional)" /></div>
              <Field label="City" required value={values.city} onChange={(value) => change("city", value)} error={errors.city} placeholder="Enter city" />
              <Field label="State" required value={values.state} onChange={(value) => change("state", value)} error={errors.state} placeholder="Enter state" />
              <Field label="PIN Code" required value={values.pincode} onChange={(value) => change("pincode", value)} error={errors.pincode} placeholder="6-digit PIN code" inputMode="numeric" />
            </div>
          )}

          {step === 3 && (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Property Type" required value={values.propertyType} onChange={(value) => change("propertyType", value)} options={[{ value: "Independent House", label: "Independent House" }, { value: "Apartment", label: "Apartment" }, { value: "Villa", label: "Villa" }, { value: "Commercial", label: "Commercial Property" }]} error={errors.propertyType} />
              <SelectField label="Ownership" required value={values.ownershipStatus} onChange={(value) => change("ownershipStatus", value)} options={[{ value: "owner", label: "Owner" }, { value: "tenant", label: "Tenant" }]} error={errors.ownershipStatus} />
              <SelectField label="Roof Type" required value={values.roofType} onChange={(value) => change("roofType", value)} options={[{ value: "RCC Flat Roof", label: "RCC Flat Roof" }, { value: "Tiled Roof", label: "Tiled Roof" }, { value: "Metal Sheet", label: "Metal Sheet" }, { value: "Other", label: "Other" }]} error={errors.roofType} />
              <Field label="Approx. Roof Area (sq. ft.)" required value={values.roofAreaSqFt} onChange={(value) => change("roofAreaSqFt", value)} error={errors.roofAreaSqFt} placeholder="e.g. 900" inputMode="decimal" />
              <Field label="Monthly Electricity Bill (₹)" required value={values.monthlyElectricityBill} onChange={(value) => change("monthlyElectricityBill", value)} error={errors.monthlyElectricityBill} placeholder="e.g. 3200" inputMode="decimal" />
              <Field label="Monthly Units Consumed" required value={values.monthlyUnits} onChange={(value) => change("monthlyUnits", value)} error={errors.monthlyUnits} placeholder="e.g. 340" inputMode="numeric" />
              <Field label="Sanctioned Load (kW)" value={values.sanctionedLoadKw} onChange={(value) => change("sanctionedLoadKw", value)} placeholder="Optional" inputMode="decimal" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-950"><p className="font-extrabold">Upload a recent electricity bill</p><p className="mt-1">The bill may be processed by the backend OCR workflow in a later phase. This frontend demo holds the selected file only in the current browser page; OCR is not performed here.</p></div>
              <FileUploadField file={billFile} onFileChange={handleFileChange} maxSizeMB={MAX_BILL_SIZE_MB} error={fileError || errors.billFile} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><h3 className="font-extrabold text-emerald-950">Review your inquiry details</h3><p className="mt-1 text-xs text-emerald-900">Check these details before adding the inquiry to this local demo session.</p></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[["Contact", values.fullName], ["Mobile", values.mobileNumber], ["Email", values.email], ["Preferred Contact", values.preferredContact], ["Address", `${values.addressLine1}, ${values.city}, ${values.state} ${values.pincode}`], ["Property", `${values.propertyType} · ${values.ownershipStatus}`], ["Roof", `${values.roofType} · ${values.roofAreaSqFt} sq. ft.`], ["Energy Use", `₹${values.monthlyElectricityBill} / month · ${values.monthlyUnits} units`], ["Electricity Bill", billFile?.name ?? "Not attached"]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-slate-900">{value || "—"}</p></div>)}</div>
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><Info size={16} className="mt-0.5 shrink-0 text-emerald-700" /><p>Demo only. The file and form values are not transmitted, stored permanently, or used to make an eligibility decision.</p></div>
          <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">
            <button type="button" onClick={step === 1 ? () => navigate("/homeowner") : back} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">{step === 1 ? "Cancel" : <><ArrowLeft size={16} /> Back</>}</button>
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 px-5 text-sm font-extrabold text-slate-950 shadow-sm hover:brightness-105 disabled:opacity-60">{step === 5 ? <><Send size={16} /> Submit Demo Inquiry</> : <>Next: {LEAD_STEPS[step].label} <ArrowRight size={16} /></>}</button>
          </div>
        </form>
        <div className="space-y-4">
          <InquiryJourney steps={LEAD_STEPS} currentStep={step} />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-sm"><p className="font-extrabold text-slate-900">What happens next?</p><p className="mt-1">In a production workflow, a sales team would review the request, confirm the bill details and arrange the next steps. Those external services are not connected here.</p></div>
        </div>
      </div>
    </div>
  );
}

export default HomeownerLeadSubmissionPage;
