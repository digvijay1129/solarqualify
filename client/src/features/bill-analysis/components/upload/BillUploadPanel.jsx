import { useRef, useState } from "react";
import {
  UploadCloud,
  FileUp,
  CheckCircle2,
  X,
} from "lucide-react";

import BillPreviewPanel from "../preview/BillPreviewPanel.jsx";

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

function validateBillFile(file, maxFileSizeMB) {
  if (!file) {
    return "Please select an electricity bill file.";
  }

  const extension = `.${file.name.split(".").pop().toLowerCase()}`;
  const hasValidType = file.type
    ? ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())
    : ACCEPTED_EXTENSIONS.includes(extension);

  if (!hasValidType || !ACCEPTED_EXTENSIONS.includes(extension)) {
    return "Unsupported file format. Please upload a PDF, JPG, PNG or WebP file.";
  }

  if (file.size > maxFileSizeMB * 1024 * 1024) {
    return `File size exceeds the ${maxFileSizeMB} MB limit. Please choose a smaller file.`;
  }

  if (file.size === 0) {
    return "The selected file is empty. Please choose another file.";
  }

  return null;
}

function BillUploadPanel({
  selectedFile = null,
  onFileSelect = () => {},
  onRemoveFile = () => {},
  maxFileSizeMB = 5,
  disabled = false,
  fileInputRef = null,
}) {
  const internalInputRef = useRef(null);
  const inputRef = fileInputRef ?? internalInputRef;
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file) => {
    if (disabled) return;

    const validationError = validateBillFile(file, maxFileSizeMB);

    if (validationError) {
      setError(validationError);
      onFileSelect(null);
      return;
    }

    setError("");
    onFileSelect(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    if (file) handleFile(file);

    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      setError("No file was detected. Please try again.");
      return;
    }

    handleFile(file);
  };

  const handleRemove = () => {
    setError("");
    onRemoveFile();
  };

  return (
    <section className="min-w-0 rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UploadCloud
            size={27}
            strokeWidth={2.2}
            className="shrink-0 text-brand-emerald"
            aria-hidden="true"
          />
          <h2 className="text-lg font-bold tracking-tight text-brand-text">
            Upload & Preview Bill
          </h2>
        </div>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
            selectedFile
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {selectedFile ? (
            <>
              <CheckCircle2 size={14} aria-hidden="true" />
              File Selected
            </>
          ) : (
            "Awaiting Upload"
          )}
        </span>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={[
          "flex min-h-[178px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          isDragging
            ? "border-brand-emerald bg-brand-mint-soft"
            : "border-[#C8D4E2] bg-[#FAFCFE]",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <UploadCloud
          size={39}
          strokeWidth={1.8}
          className="text-brand-emerald"
          aria-hidden="true"
        />

        <p className="mt-3 text-sm font-medium text-brand-text">
          Drag & drop electricity bill here or
        </p>

        <input
          ref={inputRef}
          id="bill-file-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-emerald bg-white px-5 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-mint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileUp size={18} aria-hidden="true" />
          Choose File
        </button>

        <p className="mt-3 text-xs text-brand-muted">
          Supported formats: PDF, JPG, PNG, WebP (Max {maxFileSizeMB} MB)
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-brand-mint-soft px-3 py-2">
          <p className="min-w-0 truncate text-xs font-medium text-brand-forest">
            {selectedFile.name}
          </p>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove selected bill"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-muted transition hover:bg-red-50 hover:text-red-600"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      <BillPreviewPanel file={selectedFile} embedded />
    </section>
  );
}

export default BillUploadPanel;