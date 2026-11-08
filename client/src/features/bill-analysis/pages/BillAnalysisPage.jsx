import { useRef } from "react";

import { useBillAnalysis } from "../hooks/useBillAnalysis.js";
import { useBillAnalysisSession } from "../../../app/providers/BillAnalysisSessionProvider.jsx";

import BillAnalysisHero from "../components/BillAnalysisHero.jsx";
import BillAnalysisStepper from "../components/BillAnalysisStepper.jsx";
import BillUploadPanel from "../components/upload/BillUploadPanel.jsx";
import ExtractedInformationPanel from "../components/extraction/ExtractedInformationPanel.jsx";

function BillAnalysisLoading() {
  return (
    <div className="space-y-5" aria-label="Loading Bill Analysis">
      <div className="h-20 animate-pulse rounded-2xl bg-gray-200" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="h-[420px] animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-[420px] animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

function BillAnalysisError({ onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-brand-text">
        Bill Analysis could not be loaded
      </h2>

      <p className="mt-2 text-sm text-brand-muted">
        Something went wrong while retrieving Bill Analysis information.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-emerald-hover"
      >
        Try again
      </button>
    </section>
  );
}

function BillAnalysisContent({ data }) {
  const fileInputRef = useRef(null);

  const { session, setSession } = useBillAnalysisSession();

  const initialFieldValues = Object.fromEntries(
    data.extraction.fields.map((field) => [
      field.id,
      field.value ?? "",
    ])
  );

  // Values remain in the shared provider when the route changes.
  const selectedFile = session.selectedFile ?? null;
  const fieldValues = session.fieldValues ?? initialFieldValues;
  const validationErrors = session.validationErrors ?? {};
  const reviewMessage = session.reviewMessage ?? "";
  const confirmedValues = session.confirmedValues ?? null;

  const isConfirmed = Boolean(
    selectedFile &&
      confirmedValues &&
      Object.entries(confirmedValues).every(
        ([fieldId, value]) =>
          String(fieldValues[fieldId] ?? "") === value
      )
  );

  const fields = data.extraction.fields.map((field) => ({
    ...field,
    value: fieldValues[field.id] ?? "",
  }));

  function handleFieldChange(fieldId, value) {
    setSession((previous) => {
      const nextErrors = {
        ...(previous.validationErrors ?? {}),
      };

      delete nextErrors[fieldId];

      return {
        ...previous,
        fieldValues: {
          ...(previous.fieldValues ?? fieldValues),
          [fieldId]: value,
        },
        validationErrors: nextErrors,
        confirmedValues: null,
        reviewMessage: "",
      };
    });
  }

  function handleSaveDraft() {
    setSession((previous) => ({
      ...previous,
      confirmedValues: null,
      reviewMessage:
        "Draft retained in this app session only. It has not been saved to a server.",
    }));
  }

  function handleConfirmDetails() {
    if (!selectedFile) {
      setSession((previous) => ({
        ...previous,
        confirmedValues: null,
        reviewMessage:
          "Please upload an electricity bill before confirming details.",
      }));

      return;
    }

    const errors = {};

    const requiredTextFields = ["consumerNumber", "tariff"];

    requiredTextFields.forEach((fieldId) => {
      if (!String(fieldValues[fieldId] ?? "").trim()) {
        errors[fieldId] = "This field is required.";
      }
    });

    const numericFields = [
      {
        id: "sanctionedLoadKw",
        label: "Enter a valid load greater than zero.",
        minimum: 0,
        exclusive: true,
      },
      {
        id: "monthlyUnits",
        label: "Enter valid monthly units (zero or greater).",
        minimum: 0,
        exclusive: false,
      },
      {
        id: "billAmount",
        label: "Enter a valid bill amount greater than zero.",
        minimum: 0,
        exclusive: true,
      },
    ];

    numericFields.forEach(({ id, label, minimum, exclusive }) => {
      const rawValue = String(fieldValues[id] ?? "").trim();
      const numericValue = Number(rawValue);

      const invalid =
        !rawValue ||
        !Number.isFinite(numericValue) ||
        (exclusive
          ? numericValue <= minimum
          : numericValue < minimum);

      if (invalid) {
        errors[id] = label;
      }
    });

    if (Object.keys(errors).length > 0) {
      setSession((previous) => ({
        ...previous,
        validationErrors: errors,
        confirmedValues: null,
        reviewMessage:
          "Please correct the highlighted fields before confirming.",
      }));

      return;
    }

    const snapshot = Object.fromEntries(
      Object.entries(fieldValues).map(([fieldId, value]) => [
        fieldId,
        String(value ?? ""),
      ])
    );

    setSession((previous) => ({
      ...previous,
      validationErrors: {},
      confirmedValues: snapshot,
      reviewMessage:
        "Details confirmed for this app session. No OCR extraction or server save was performed.",
    }));
  }

  function handleFileSelect(file) {
    setSession((previous) => ({
      ...previous,
      selectedFile: file,
      validationErrors: {},
      confirmedValues: null,
      reviewMessage: "",
    }));
  }

  function handleRemoveFile() {
    setSession((previous) => ({
      ...previous,
      selectedFile: null,
      confirmedValues: null,
      reviewMessage: "",
    }));
  }

  return (
    <div className="min-w-0 space-y-5">
      <BillAnalysisHero />

      <BillAnalysisStepper
        steps={data.workflow.steps}
        currentStep={isConfirmed ? 4 : data.workflow.currentStep}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="min-w-0">
          <BillUploadPanel
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            maxFileSizeMB={data.upload.maxFileSizeMB}
            fileInputRef={fileInputRef}
          />
        </div>

        <div className="min-w-0">
          <ExtractedInformationPanel
            fields={fields}
            extractionStatus={data.extraction.status}
            editable={true}
            onFieldChange={handleFieldChange}
            validationErrors={validationErrors}
            onReupload={() => fileInputRef.current?.click()}
            onSaveDraft={handleSaveDraft}
            onConfirmDetails={handleConfirmDetails}
            reviewMessage={reviewMessage}
            isConfirmed={isConfirmed}
          />
        </div>
      </div>

      {selectedFile && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"
        >
          File selected for local preview. The document has not been sent
          to a server, and OCR extraction has not been performed.
        </div>
      )}

      <p className="text-xs leading-5 text-brand-muted">
        {data.dataLabel}. Manual entries and confirmation are retained
        in the current app session. Backend persistence and OCR are not connected.
      </p>
    </div>
  );
}

function BillAnalysisPage() {
  const { data, isPending, isError, refetch } = useBillAnalysis();

  if (isPending) {
    return <BillAnalysisLoading />;
  }

  if (isError || !data) {
    return <BillAnalysisError onRetry={refetch} />;
  }

  return <BillAnalysisContent data={data} />;
}

export default BillAnalysisPage;