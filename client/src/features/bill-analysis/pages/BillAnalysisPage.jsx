import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../../authentication/context/AuthContext.jsx";
import BillAnalysisHero from "../components/BillAnalysisHero.jsx";
import BillAnalysisStepper from "../components/BillAnalysisStepper.jsx";
import BillUploadPanel from "../components/upload/BillUploadPanel.jsx";
import ExtractedInformationPanel from "../components/extraction/ExtractedInformationPanel.jsx";
import BillPreviewPanel from "../components/preview/BillPreviewPanel.jsx";
import {
  confirmBillLeadAssignment,
  getBillAnalysisLeads,
  getBillDocumentMetadata,
  downloadBillDocument,
  deleteBillDocument,
  getBillReview,
  runBillOcr,
  submitBillVerification,
  uploadBillDocument,
} from "../services/bill-analysis.service.js";

const STEPS = [
  { id: 1, label: "Select Lead & Upload" },
  { id: 2, label: "OCR Extraction" },
  { id: 3, label: "Manual Review" },
  { id: 4, label: "Verification" },
];

const EMPTY_FIELDS = {
  consumerNumber: "",
  tariff: "",
  sanctionedLoad: "",
  sanctionedLoadUnit: "",
  monthlyUnits: "",
};

function unwrapNumber(value) {
  return value === null || value === undefined ? "" : String(value);
}

function mapReviewFields(review) {
  const fields = review?.fields ?? {};
  return {
    consumerNumber: fields.consumerNumber ?? "",
    tariff: fields.tariff ?? "",
    sanctionedLoad: unwrapNumber(fields.sanctionedLoad),
    sanctionedLoadUnit: fields.sanctionedLoadUnit ?? "",
    monthlyUnits: unwrapNumber(fields.monthlyUnits),
  };
}

function BillAnalysisLoading() {
  return <div className="space-y-5" aria-label="Loading Bill Analysis"><div className="h-20 animate-pulse rounded-2xl bg-gray-200" /><div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><div className="h-96 animate-pulse rounded-2xl bg-gray-200" /><div className="h-96 animate-pulse rounded-2xl bg-gray-200" /></div></div>;
}

function ErrorBanner({ children, tone = "error" }) {
  return <div role="alert" className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-red-200 bg-red-50 text-red-800"}`}>{children}</div>;
}

function BillAnalysisPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [confirmedLeadId, setConfirmedLeadId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fieldValues, setFieldValues] = useState(EMPTY_FIELDS);
  const [validationErrors, setValidationErrors] = useState({});
  const [reviewNotes, setReviewNotes] = useState("");
  const [decision, setDecision] = useState("verified");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState("");

  const leadsQuery = useQuery({
    queryKey: ["bill-analysis", "leads", search],
    queryFn: () => getBillAnalysisLeads(search),
    staleTime: 15_000,
  });

  const leads = leadsQuery.data?.items ?? [];

  useEffect(() => {
    if (!selectedLeadId && leads.length) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const hasConfirmedAccess = Boolean(selectedLeadId && confirmedLeadId === selectedLeadId);

  const billQuery = useQuery({
    queryKey: ["bill-analysis", "bill", selectedLeadId],
    queryFn: () => getBillDocumentMetadata(selectedLeadId),
    enabled: hasConfirmedAccess,
    retry: false,
    staleTime: 0,
  });

  const billExists = Boolean(billQuery.data?.id);
  const billNotFound = billQuery.error?.status === 404;

  const storedBillQuery = useQuery({
    queryKey: ["bill-analysis", "bill-file", selectedLeadId],
    queryFn: () => downloadBillDocument(selectedLeadId),
    enabled: hasConfirmedAccess && billExists,
    staleTime: 60_000,
    retry: false,
  });

  const storedBillFile = useMemo(() => {
    if (!storedBillQuery.data || !billQuery.data) return null;
    return new File(
      [storedBillQuery.data],
      billQuery.data.originalFileName,
      { type: billQuery.data.documentType }
    );
  }, [storedBillQuery.data, billQuery.data]);

  const reviewQuery = useQuery({
    queryKey: ["bill-analysis", "review", selectedLeadId],
    queryFn: () => getBillReview(selectedLeadId),
    enabled: hasConfirmedAccess && billExists,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (reviewQuery.data) {
      setFieldValues(mapReviewFields(reviewQuery.data));
      setReviewNotes(reviewQuery.data.reviewNotes ?? "");
      setValidationErrors({});
      setDecision("verified");
    }
  }, [reviewQuery.data]);

  function resetForLead(nextLeadId) {
    setSelectedLeadId(nextLeadId);
    setConfirmedLeadId("");
    setSelectedFile(null);
    setFieldValues(EMPTY_FIELDS);
    setValidationErrors({});
    setReviewNotes("");
    setDecision("verified");
    setNotice(null);
  }

  async function confirmAssignment() {
    if (!selectedLeadId || busy) return;
    setBusy("assignment");
    setNotice(null);
    try {
      await confirmBillLeadAssignment(selectedLeadId, user.id);
      setConfirmedLeadId(selectedLeadId);
      setNotice({ tone: "success", message: "Lead access confirmed for your Sales Staff account." });
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (error) {
      setNotice({ tone: "error", message: error?.message || "This lead could not be assigned to your account." });
    } finally {
      setBusy("");
    }
  }

  async function refreshBillState() {
    await Promise.all([billQuery.refetch(), reviewQuery.refetch()]);
  }

  async function handleUpload() {
    if (!selectedFile || !selectedLeadId || busy) return;
    setBusy("upload");
    setNotice(null);
    try {
      await uploadBillDocument(selectedLeadId, selectedFile);
      setNotice({ tone: "success", message: "Bill uploaded to private document storage. Starting OCR extraction…" });
      await billQuery.refetch();
      try {
        await runBillOcr(selectedLeadId);
        await refreshBillState();
        setNotice({ tone: "success", message: "OCR completed. Review and correct the extracted fields before making a verification decision." });
      } catch (ocrError) {
        if (ocrError?.status === 409) {
          await reviewQuery.refetch();
          setNotice({ tone: "warning", message: ocrError.message || "OCR is already complete or being processed. Refresh the review status." });
        } else {
          setNotice({ tone: "warning", message: ocrError?.message || "The bill is stored, but OCR failed. Retry extraction from the uploaded bill." });
        }
      }
      setSelectedFile(null);
      await billQuery.refetch();
    } catch (error) {
      setNotice({ tone: "error", message: error?.message || "Bill upload failed. The selected file has not been saved." });
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteRejectedBill() {
    if (!selectedLeadId || busy || reviewQuery.data?.verificationStatus !== "rejected") return;
    const accepted = typeof globalThis.confirm !== "function" || globalThis.confirm("Delete the rejected bill document? You can then upload a replacement bill.");
    if (!accepted) return;
    setBusy("delete");
    setNotice(null);
    try {
      await deleteBillDocument(selectedLeadId);
      setFieldValues(EMPTY_FIELDS);
      setReviewNotes("");
      setSelectedFile(null);
      queryClient.setQueryData(["bill-analysis", "bill", selectedLeadId], null);
      queryClient.removeQueries({ queryKey: ["bill-analysis", "bill-file", selectedLeadId], exact: true });
      queryClient.removeQueries({ queryKey: ["bill-analysis", "review", selectedLeadId], exact: true });
      await queryClient.invalidateQueries({ queryKey: ["bill-analysis", "bill", selectedLeadId] });
      await billQuery.refetch();
      setNotice({ tone: "success", message: "Rejected bill deleted. Upload a replacement document for a new OCR and review cycle." });
    } catch (error) {
      setNotice({ tone: "error", message: error?.message || "Rejected bill could not be deleted." });
    } finally {
      setBusy("");
    }
  }

  async function handleRunOcr() {
    if (!selectedLeadId || busy) return;
    setBusy("ocr");
    setNotice(null);
    try {
      await runBillOcr(selectedLeadId);
      await refreshBillState();
      setNotice({ tone: "success", message: "OCR extraction completed. Manual review is now available." });
    } catch (error) {
      setNotice({ tone: error?.status === 409 ? "warning" : "error", message: error?.message || "OCR could not be completed." });
      await billQuery.refetch();
    } finally {
      setBusy("");
    }
  }

  function changeField(fieldId, value) {
    setFieldValues((current) => ({ ...current, [fieldId]: value }));
    setValidationErrors((current) => ({ ...current, [fieldId]: undefined }));
    setNotice(null);
  }

  function validateVerification() {
    if (decision === "rejected") {
      if (!reviewNotes.trim()) return { reviewNotes: "A reason is required when rejecting a bill." };
      return {};
    }

    const errors = {};
    if (!fieldValues.consumerNumber.trim()) errors.consumerNumber = "Consumer number is required.";
    if (!fieldValues.tariff.trim()) errors.tariff = "Tariff is required.";

    const sanctionedLoad = Number(fieldValues.sanctionedLoad);
    if (!fieldValues.sanctionedLoad.trim() || !Number.isFinite(sanctionedLoad) || sanctionedLoad <= 0) {
      errors.sanctionedLoad = "Enter a sanctioned load greater than zero.";
    }
    if (!["kW", "kVA", "HP"].includes(fieldValues.sanctionedLoadUnit)) {
      errors.sanctionedLoadUnit = "Select kW, kVA or HP.";
    }

    const monthlyUnits = Number(fieldValues.monthlyUnits);
    if (!fieldValues.monthlyUnits.trim() || !Number.isFinite(monthlyUnits) || monthlyUnits < 0) {
      errors.monthlyUnits = "Enter monthly units greater than or equal to zero.";
    }
    return errors;
  }

  async function handleVerify() {
    if (!selectedLeadId || !reviewQuery.data || busy) return;
    const errors = validateVerification();
    setValidationErrors(errors);
    if (Object.keys(errors).length) {
      setNotice({ tone: "error", message: "Correct the highlighted fields before submitting your verification decision." });
      return;
    }

    setBusy("verify");
    setNotice(null);
    try {
      const payload = {
        decision,
        fields: decision === "verified" ? {
          consumerNumber: fieldValues.consumerNumber.trim(),
          tariff: fieldValues.tariff.trim(),
          sanctionedLoad: Number(fieldValues.sanctionedLoad),
          sanctionedLoadUnit: fieldValues.sanctionedLoadUnit,
          monthlyUnits: Number(fieldValues.monthlyUnits),
        } : {},
        reviewNotes: reviewNotes.trim(),
      };
      await submitBillVerification(selectedLeadId, payload);
      await refreshBillState();
      setNotice({
        tone: "success",
        message: decision === "verified"
          ? "Bill verified. Corrected values and the reviewer decision have been saved."
          : "Bill rejected. The decision and review reason have been saved.",
      });
    } catch (error) {
      setNotice({ tone: "error", message: error?.message || "The bill verification decision could not be saved." });
      await reviewQuery.refetch();
    } finally {
      setBusy("");
    }
  }

  if (leadsQuery.isPending) return <BillAnalysisLoading />;

  if (leadsQuery.isError) {
    return <section className="rounded-2xl border border-red-200 bg-white p-8"><h2 className="text-lg font-bold text-slate-950">Could not load leads for bill review</h2><p className="mt-2 text-sm text-slate-600">{leadsQuery.error?.message}</p><button type="button" onClick={() => leadsQuery.refetch()} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Retry</button></section>;
  }

  const review = reviewQuery.data;
  const verificationFinal = ["verified", "rejected"].includes(review?.verificationStatus);
  const ocrPending = billExists && !review && reviewQuery.error?.status === 409;
  const ocrFailed = billExists && !review && reviewQuery.error && reviewQuery.error.status !== 409;
  const extractionFields = [
    { id: "consumerNumber", label: "Consumer Number", value: fieldValues.consumerNumber, required: true },
    { id: "tariff", label: "Tariff", value: fieldValues.tariff, required: true },
    { id: "sanctionedLoad", label: "Sanctioned Load", value: fieldValues.sanctionedLoad, required: true },
    { id: "sanctionedLoadUnit", label: "Sanctioned Load Unit", value: fieldValues.sanctionedLoadUnit, required: true },
    { id: "monthlyUnits", label: "Monthly Units", value: fieldValues.monthlyUnits, required: true },
  ];
  const extractionConfidence = review?.extractionConfidence;
  const currentStep = verificationFinal ? 4 : review ? 3 : billExists ? 2 : 1;

  return (
    <div className="min-w-0 space-y-5">
      <BillAnalysisHero />
      <BillAnalysisStepper steps={STEPS} currentStep={currentStep} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <label htmlFor="bill-analysis-search" className="mb-1.5 block text-sm font-bold text-slate-900">Select a lead for bill processing</label>
            <input id="bill-analysis-search" value={search} onChange={(event) => { setSearch(event.target.value); resetForLead(""); }} placeholder="Search customer, phone or lead reference…" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <label className="block min-w-0 lg:w-[440px]">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Lead record ({leadsQuery.data?.pagination?.totalItems ?? leads.length} accessible results)</span>
            <select value={selectedLeadId} onChange={(event) => resetForLead(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600">
              <option value="">Choose a lead</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.referenceId} · {lead.name} · {lead.status}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => leadsQuery.refetch()} disabled={leadsQuery.isFetching} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={leadsQuery.isFetching ? "animate-spin" : ""} />Refresh Leads</button>
        </div>

        {selectedLead ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <div><p className="text-sm font-bold text-slate-900">{selectedLead.name} · {selectedLead.referenceId}</p><p className="mt-1 text-xs text-slate-600">{selectedLead.location || "Address not provided"} · {selectedLead.phone}</p></div>
            <button type="button" onClick={confirmAssignment} disabled={busy === "assignment" || hasConfirmedAccess} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-extrabold text-white disabled:opacity-50"><ShieldCheck size={15} />{busy === "assignment" ? "Confirming…" : hasConfirmedAccess ? "Lead access confirmed" : "Claim / Confirm Lead"}</button>
          </div>
        ) : <p className="mt-3 text-xs text-slate-500">{leads.length ? "Choose a lead to continue." : "No assigned or unassigned leads were found for this Sales Staff account."}</p>}
      </section>

      {selectedLead && !hasConfirmedAccess && <ErrorBanner tone="warning">Bill documents are available only to the homeowner or currently assigned Sales Staff member. Claim or confirm this lead before viewing or uploading its bill.</ErrorBanner>}

      {hasConfirmedAccess && (
        <>
          {billQuery.isFetching && <p className="text-xs text-slate-500">Checking the lead's bill record…</p>}
          {billQuery.error && !billNotFound && <ErrorBanner>{billQuery.error.message || "Bill metadata could not be loaded."}</ErrorBanner>}

          <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="min-w-0 space-y-4">
              <BillUploadPanel
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onRemoveFile={() => setSelectedFile(null)}
                maxFileSizeMB={5}
                disabled={Boolean(busy) || billExists}
                fileInputRef={fileInputRef}
              />
              {!billExists && (
                <button type="button" onClick={handleUpload} disabled={!selectedFile || Boolean(busy) || !billNotFound} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <FileCheck2 size={17} />{busy === "upload" ? "Uploading & running OCR…" : "Upload Bill & Run OCR"}
                </button>
              )}
              {billExists && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-black text-slate-950">Stored electricity bill</h3>
                  <p className="mt-2 break-all text-xs font-semibold text-slate-800">{billQuery.data.originalFileName}</p>
                  <p className="mt-1 text-xs text-slate-500">{billQuery.data.documentType} · {Math.round((billQuery.data.documentSize ?? 0) / 1024)} KB</p>
                  <p className="mt-2 text-xs text-slate-600">Verification status: <strong>{review?.verificationStatus ?? billQuery.data.verificationStatus}</strong></p>
                  {storedBillFile ? <div className="mt-4"><BillPreviewPanel file={storedBillFile} embedded /></div> : storedBillQuery.isFetching ? <p className="mt-3 text-xs text-slate-500">Loading private bill preview…</p> : storedBillQuery.error ? <ErrorBanner>Stored bill preview could not be loaded: {storedBillQuery.error.message}</ErrorBanner> : null}
                  {review?.verificationStatus === "rejected" && <button type="button" onClick={handleDeleteRejectedBill} disabled={Boolean(busy)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 text-xs font-bold text-red-800 hover:bg-red-50 disabled:opacity-50">{busy === "delete" ? "Deleting…" : "Delete rejected bill & upload replacement"}</button>}
                  {ocrPending && <ErrorBanner tone="warning">OCR has not completed yet or is currently processing. Run or retry extraction below.</ErrorBanner>}
                  {ocrFailed && <ErrorBanner>{reviewQuery.error?.message || "OCR review data could not be retrieved."}</ErrorBanner>}
                  {ocrPending && <button type="button" onClick={handleRunOcr} disabled={Boolean(busy)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-extrabold text-white disabled:opacity-50"><RefreshCw size={14} className={busy === "ocr" ? "animate-spin" : ""} />{busy === "ocr" ? "Running OCR…" : "Run / Retry OCR"}</button>}
                  {review && <button type="button" onClick={refreshBillState} disabled={Boolean(busy)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw size={14} />Refresh Review Data</button>}
                </section>
              )}
            </div>

            <div className="min-w-0">
              {review ? (
                <>
                  <ExtractedInformationPanel
                    fields={extractionFields}
                    extractionStatus={review.ocrStatus}
                    extractionConfidence={extractionConfidence}
                    editable={!verificationFinal}
                    onFieldChange={changeField}
                    validationErrors={validationErrors}
                    onReupload={() => fileInputRef.current?.click()}
                    onSaveDraft={() => setNotice({ tone: "warning", message: "Draft corrections remain in this page session and are not saved to the server until you submit a verification decision." })}
                    onConfirmDetails={handleVerify}
                    confirmLabel={decision === "rejected" ? "Confirm Rejection" : "Verify Bill"}
                    reviewMessage={notice?.message ?? (verificationFinal ? `Final decision: ${review.verificationStatus}. ${review.reviewNotes || ""}` : "")}
                    isConfirmed={verificationFinal}
                    disabled={Boolean(busy) || verificationFinal}
                  />
                  {!verificationFinal && (
                    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="text-sm font-black text-slate-950">Manual verification decision</h3>
                      <fieldset className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-bold ${decision === "verified" ? "border-emerald-500 bg-emerald-50 text-emerald-950" : "border-slate-200"}`}><input type="radio" name="bill-decision" checked={decision === "verified"} onChange={() => setDecision("verified")} /> Verify corrected bill</label>
                        <label className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-bold ${decision === "rejected" ? "border-red-400 bg-red-50 text-red-900" : "border-slate-200"}`}><input type="radio" name="bill-decision" checked={decision === "rejected"} onChange={() => setDecision("rejected")} /> Reject bill</label>
                      </fieldset>
                      <label className="mt-3 block text-xs font-bold text-slate-700">Review note {decision === "rejected" ? "(required)" : "(optional)"}<textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={3} maxLength={500} placeholder={decision === "rejected" ? "Enter why this bill is rejected…" : "Record any corrections or review context…"} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-600" />{validationErrors.reviewNotes && <span role="alert" className="mt-1 block text-red-600">{validationErrors.reviewNotes}</span>}</label>
                      <p className="mt-2 text-[10px] leading-4 text-slate-500">Verification is a final decision and cannot be changed through this endpoint. Rejected bills must be replaced using a separately supported deletion/re-upload workflow.</p>
                    </section>
                  )}
                </>
              ) : (
                <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><AlertCircle size={30} className="mx-auto text-slate-400" /><h2 className="mt-3 text-base font-black text-slate-950">OCR information not available yet</h2><p className="mt-1 text-sm text-slate-600">Upload a bill and run OCR. Extracted values and confidence will appear here for manual review.</p></section>
              )}
            </div>
          </div>
        </>
      )}

      {notice && <div role="status" className={`rounded-xl border px-4 py-3 text-sm leading-6 ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : notice.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{notice.message}</div>}
      <p className="text-xs leading-5 text-brand-muted">OCR extraction confidence is a processor signal, not proof of correctness. All extracted fields require human review; only a successful manual verification decision marks the bill as verified for downstream lead scoring and solar calculations.</p>
    </div>
  );
}

export default BillAnalysisPage;
