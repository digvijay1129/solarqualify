import { useState } from "react";
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Info,
  Send, UserRound, House, Zap, FileUp, RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import HomeownerHero from "../components/HomeownerHero.jsx";
import HomeownerStepper from "../components/HomeownerStepper.jsx";
import InquiryJourney from "../components/InquiryJourney.jsx";
import FileUploadField from "../components/FileUploadField.jsx";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";
import { useAuth } from "../../authentication/context/AuthContext.jsx";
import {
  LEAD_STEPS, validateLeadStep, MAX_BILL_SIZE_MB,
} from "../utils/homeowner-portal.js";
import {
  createHomeownerLead, uploadHomeownerBill, analyzeHomeownerBill,
} from "../services/homeowner-portal.service.js";

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
  const { profile, setNotice, refetch } = useHomeownerPortal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(() => ({
    ...emptyValues,
    fullName: user?.name ?? profile.fullName,
    mobileNumber: profile.mobileNumber || String(user?.phone ?? "").replace(/^\+91\s*/, ""),
    email: user?.email ?? profile.email,
    city: profile.city,
    state: profile.state || "Maharashtra",
    addressLine1: profile.addressLine1,
    pincode: profile.pincode,
  }));
  const [billFile, setBillFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [uploading, setUploading] = useState(false);
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

  async function uploadAndAnalyze(leadId) {
    if (!billFile || uploading) return;
    setUploading(true);
    setFileError("");
    try {
      const bill = await uploadHomeownerBill(leadId, billFile);
      setSubmission((current) => ({ ...current, bill, billUploaded: true, analysis: null, analysisError: null }));
      try {
        const analysis = await analyzeHomeownerBill(leadId);
        setSubmission((current) => ({ ...current, analysis, analysisError: null }));
      } catch (analysisError) {
        setSubmission((current) => ({ ...current, analysisError: analysisError?.message || "Bill uploaded; OCR analysis could not be completed." }));
      }
      await refetch();
    } catch (uploadError) {
      setFileError(uploadError?.message || "Bill upload failed. Your lead is saved; retry the bill upload below.");
      setSubmission((current) => ({ ...current, billUploaded: false }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (busy || submission) return;
    if (!consent) {
      setErrors({ consent: "Consent is required before submitting your enquiry." });
      return;
    }
    setBusy(true);
    setErrors({});
    setNotice(null);

    try {
      const propertyAddress = [
        values.addressLine1.trim(), values.addressLine2.trim(),
        values.city.trim(), values.state.trim(), values.pincode.trim(),
      ].filter(Boolean).join(", ");

      const lead = await createHomeownerLead({
        customerName: values.fullName.trim(),
        email: values.email.trim(),
        phone: "+91 " + values.mobileNumber.replace(/\D/g, ""),
        propertyAddress,
        propertyType: values.propertyType === "Commercial" ? "commercial" : "residential",
        ownership: values.ownershipStatus,
        pincode: values.pincode.trim(),
        roofType: values.roofType,
        roofAreaSqFt: Number(values.roofAreaSqFt),
        sanctionedLoad: values.sanctionedLoadKw.trim() ? Number(values.sanctionedLoadKw) : null,
        monthlyElectricityBill: Number(values.monthlyElectricityBill),
        monthlyUnits: Number(values.monthlyUnits),
        consent: true,
      });

      setSubmission({ lead, billUploaded: false, bill: null, analysis: null, analysisError: null });
      if (billFile) await uploadAndAnalyze(lead.id);
      await refetch();
      setNotice({ tone: "success", message: `Your enquiry ${lead.referenceId} was submitted to SolarQualify.` });
    } catch (submitError) {
      setNotice({ tone: "error", message: submitError?.message || "Your enquiry could not be submitted. Please review the details and try again." });
    } finally {
      setBusy(false);
    }
  }

  async function retryAnalysis() {
    if (!submission?.lead?.id) return;
    setUploading(true);
    try {
      const analysis = await analyzeHomeownerBill(submission.lead.id);
      setSubmission((current) => ({ ...current, analysis, analysisError: null }));
      await refetch();
    } catch (error) {
      setSubmission((current) => ({ ...current, analysisError: error?.message || "OCR analysis could not be completed." }));
    } finally {
      setUploading(false);
    }
  }

  if (submission) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><CheckCircle2 size={34} /></span>
        <h1 className="mt-5 text-center text-2xl font-black text-slate-950">Your enquiry was submitted</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">Your lead has been saved to your SolarQualify account.</p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><p className="text-xs text-slate-500">Lead reference</p><p className="mt-1 font-black text-emerald-900">{submission.lead.referenceId}</p><p className="mt-2 text-xs text-slate-600">Status: {submission.lead.status || "New"} · Priority: {submission.lead.priority || "Not evaluated"}</p></div>
        {billFile && <div className="mt-4 rounded-xl border border-slate-200 p-4"><p className="text-sm font-extrabold text-slate-900">Electricity bill</p>{submission.billUploaded ? <><p className="mt-1 text-xs text-emerald-800">Bill uploaded securely. Verification status: {submission.bill?.verificationStatus || "needs_review"}.</p>{submission.analysis ? <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950"><p className="font-extrabold">OCR extraction requires Sales Staff review</p><p>Consumer number: {submission.analysis.fields?.consumerNumber || "Not extracted"}</p><p>Tariff: {submission.analysis.fields?.tariff || "Not extracted"}</p><p>Monthly units: {submission.analysis.fields?.monthlyUnits ?? "Not extracted"}</p><p>Extraction confidence: {submission.analysis.extractionConfidence == null ? "Unavailable" : `${Math.round(submission.analysis.extractionConfidence * 100)}%`}</p></div> : submission.analysisError ? <p className="mt-2 text-xs text-amber-800">The file is uploaded, but OCR could not complete: {submission.analysisError}</p> : null}{submission.analysisError && <button type="button" disabled={uploading} onClick={retryAnalysis} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-60"><RefreshCw size={14} />Retry OCR analysis</button>}</> : <><p className="mt-1 text-xs text-amber-800">Your lead is saved. The bill has not yet been uploaded.</p><p role="alert" className="mt-2 text-xs text-red-700">{fileError}</p><button type="button" disabled={uploading} onClick={() => uploadAndAnalyze(submission.lead.id)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-extrabold text-white disabled:opacity-60"><RefreshCw size={14} />{uploading ? "Uploading…" : "Retry bill upload"}</button></>}</div>}
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/homeowner" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Go to Dashboard</Link><button type="button" onClick={() => { setSubmission(null); setStep(1); setValues(emptyValues); setBillFile(null); setConsent(false); }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700">Submit another enquiry</button></div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <HomeownerHero eyebrow="New homeowner enquiry" title="Submit a Solar Installation Inquiry" description="Enter your property and energy information. Your enquiry and eligible bill upload will be sent to the SolarQualify backend." />
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-5 shadow-sm sm:px-5"><HomeownerStepper steps={LEAD_STEPS} currentStep={step} /></div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[1.48fr_.72fr]">
        <form onSubmit={(event) => { event.preventDefault(); if (step < 5) next(); else void handleSubmit(); }} noValidate className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">{step === 1 ? <UserRound /> : step === 2 ? <House /> : step === 3 ? <Zap /> : step === 4 ? <FileUp /> : <ClipboardCheck />}</span><div className="min-w-0"><span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-950">Step {step} of 5: {stepDefinition.label}</span><p className="mt-1 text-sm text-slate-500">{stepDefinition.description}</p></div></div>

          {step === 1 && <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Full Name" required value={values.fullName} onChange={(value) => change("fullName", value)} error={errors.fullName} placeholder="Enter your full name" /><Field label="Mobile Number" required value={values.mobileNumber} onChange={(value) => change("mobileNumber", value.replace(/\D/g, "").slice(-10))} error={errors.mobileNumber} placeholder="10-digit mobile number" inputMode="numeric" /><Field label="Email Address" required value={values.email} onChange={(value) => change("email", value)} error={errors.email} placeholder="Enter your email" type="email" /><fieldset className="min-w-0"><legend className="mb-2 text-xs font-extrabold text-slate-800">Preferred Contact Method</legend><div className="flex flex-wrap gap-4">{["phone", "email", "whatsapp"].map((method) => <label key={method} className="inline-flex items-center gap-1.5 text-xs text-slate-700"><input type="radio" name="preferredContact" checked={values.preferredContact === method} onChange={() => change("preferredContact", method)} className="accent-emerald-700" />{method[0].toUpperCase() + method.slice(1)}</label>)}</div></fieldset></div>}

          {step === 2 && <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Address Line 1" required value={values.addressLine1} onChange={(value) => change("addressLine1", value)} error={errors.addressLine1} placeholder="House / flat number and street" /></div><div className="sm:col-span-2"><Field label="Address Line 2" value={values.addressLine2} onChange={(value) => change("addressLine2", value)} placeholder="Landmark or area (optional)" /></div><Field label="City" required value={values.city} onChange={(value) => change("city", value)} error={errors.city} placeholder="Enter city" /><Field label="State" required value={values.state} onChange={(value) => change("state", value)} error={errors.state} placeholder="Enter state" /><Field label="PIN Code" required value={values.pincode} onChange={(value) => change("pincode", value.replace(/\D/g, "").slice(0, 6))} error={errors.pincode} placeholder="6-digit PIN code" inputMode="numeric" /></div>}

          {step === 3 && <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"><SelectField label="Property Type" required value={values.propertyType} onChange={(value) => change("propertyType", value)} options={[{ value: "Independent House", label: "Independent House" }, { value: "Apartment", label: "Apartment" }, { value: "Villa", label: "Villa" }, { value: "Commercial", label: "Commercial Property" }]} /><SelectField label="Ownership" required value={values.ownershipStatus} onChange={(value) => change("ownershipStatus", value)} options={[{ value: "owner", label: "Owner" }, { value: "tenant", label: "Tenant" }]} /><SelectField label="Roof Type" required value={values.roofType} onChange={(value) => change("roofType", value)} options={[{ value: "RCC Flat Roof", label: "RCC Flat Roof" }, { value: "Tiled Roof", label: "Tiled Roof" }, { value: "Metal Sheet", label: "Metal Sheet" }, { value: "Other", label: "Other" }]} /><Field label="Approx. Roof Area (sq. ft.)" required value={values.roofAreaSqFt} onChange={(value) => change("roofAreaSqFt", value)} error={errors.roofAreaSqFt} placeholder="e.g. 900" inputMode="decimal" /><Field label="Monthly Electricity Bill (₹)" required value={values.monthlyElectricityBill} onChange={(value) => change("monthlyElectricityBill", value)} error={errors.monthlyElectricityBill} placeholder="e.g. 3200" inputMode="decimal" /><Field label="Monthly Units Consumed" required value={values.monthlyUnits} onChange={(value) => change("monthlyUnits", value)} error={errors.monthlyUnits} placeholder="e.g. 340" inputMode="numeric" /><Field label="Sanctioned Load (kW)" value={values.sanctionedLoadKw} onChange={(value) => change("sanctionedLoadKw", value)} placeholder="Optional · confirm from bill" inputMode="decimal" /><p className="sm:col-span-2 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-950">Roof type, roof area, PIN code and optional sanctioned load are saved with your enquiry. Final system sizing remains subject to bill verification and the site survey.</p></div>}

          {step === 4 && <div className="space-y-4"><div className="rounded-xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-950"><p className="font-extrabold">Upload a recent electricity bill</p><p className="mt-1">Accepted formats: PDF, JPEG, PNG and WebP. The uploaded file is stored privately; OCR output remains unverified until Sales Staff review it.</p></div><FileUploadField file={billFile} onFileChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.webp" maxSizeMB={MAX_BILL_SIZE_MB} error={fileError || errors.billFile} /></div>}

          {step === 5 && <div className="space-y-4"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><h3 className="font-extrabold text-emerald-950">Review your enquiry details</h3><p className="mt-1 text-xs text-emerald-900">Confirm the information before submitting it to the SolarQualify backend.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[["Contact", values.fullName], ["Mobile", values.mobileNumber], ["Email", values.email], ["Address", [values.addressLine1, values.addressLine2, values.city, values.state, values.pincode].filter(Boolean).join(", ")], ["Property", `${values.propertyType} · ${values.ownershipStatus}`], ["Roof Details", `${values.roofType} · ${values.roofAreaSqFt} sq. ft.`], ["Energy Use", `₹${values.monthlyElectricityBill} / month · ${values.monthlyUnits} units`], ["Electricity Bill", billFile?.name ?? "Not attached"]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-slate-900">{value || "—"}</p></div>)}</div><label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-700"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setErrors((current) => ({ ...current, consent: undefined })); }} className="mt-0.5 h-4 w-4 accent-emerald-700" /><span>I consent to submitting these details and the selected electricity bill for SolarQualify enquiry processing and follow-up.</span></label>{errors.consent && <p role="alert" className="text-xs font-semibold text-red-600">{errors.consent}</p>}</div>}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><Info size={16} className="mt-0.5 shrink-0 text-emerald-700" /><p>Lead ownership and access are enforced by the backend. OCR extraction does not verify a bill or establish subsidy eligibility; staff review remains required.</p></div>
          <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row"><button type="button" onClick={step === 1 ? () => navigate("/homeowner") : back} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">{step === 1 ? "Cancel" : <><ArrowLeft size={16} /> Back</>}</button><button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 px-5 text-sm font-extrabold text-slate-950 shadow-sm hover:brightness-105 disabled:opacity-60">{busy ? "Submitting…" : step === 5 ? <><Send size={16} /> Submit Enquiry</> : <>Next: {LEAD_STEPS[step].label} <ArrowRight size={16} /></>}</button></div>
        </form>
        <div className="space-y-4"><InquiryJourney steps={LEAD_STEPS} currentStep={step} /><div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-sm"><p className="font-extrabold text-slate-900">What happens next?</p><p className="mt-1">Your enquiry appears in the sales lead queue. The bill is analysed for reference only and must be manually reviewed by Sales Staff before verified values are used.</p></div></div>
      </div>
    </div>
  );
}

export default HomeownerLeadSubmissionPage;
