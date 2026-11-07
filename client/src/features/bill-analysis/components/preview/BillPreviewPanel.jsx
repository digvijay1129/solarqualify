import { useEffect, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Eye,
} from "lucide-react";

function BillPreviewPanel({ file = null, embedded = false }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const isPdf =
    file?.type === "application/pdf" ||
    file?.name?.toLowerCase().endsWith(".pdf");

  const isImage =
    file?.type === "image/jpeg" ||
    file?.type === "image/png" ||
    /\.(jpe?g|png)$/i.test(file?.name ?? "");

  return (
    <section
      className={
        embedded
          ? "mt-5 min-w-0 border-t border-brand-border pt-5"
          : "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card"
      }
    >
      <div
        className={[
          "flex items-center justify-between gap-3",
          embedded
            ? "mb-3"
            : "border-b border-brand-border px-4 py-4 sm:px-5",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Eye size={21} className="shrink-0 text-brand-emerald" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-brand-text">
              Bill Preview
            </h3>
            <p className="mt-0.5 truncate text-xs text-brand-muted">
              {file ? file.name : "Uploaded document preview"}
            </p>
          </div>
        </div>

        {file && (
          <span className="shrink-0 rounded-full bg-brand-mint-soft px-3 py-1 text-xs font-semibold text-brand-forest">
            Preview Ready
          </span>
        )}
      </div>

      <div
        className={
          embedded
            ? "min-w-0 overflow-hidden rounded-xl border border-brand-border bg-[#F4F6F8] p-2 sm:p-3"
            : "min-h-[280px] flex-1 bg-[#F4F6F8] p-3 sm:min-h-[360px] sm:p-4"
        }
      >
        {!file ? (
          <div className="flex min-h-[225px] flex-col items-center justify-center rounded-xl border border-dashed border-[#C8D4E2] bg-white px-5 text-center sm:min-h-[280px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-mint-soft text-brand-emerald">
              <UploadCloud size={29} aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-sm font-semibold text-brand-text">
              No bill uploaded yet
            </h4>
            <p className="mt-2 max-w-xs text-xs leading-5 text-brand-muted">
              Select an electricity bill to display its preview here.
            </p>
          </div>
        ) : !previewUrl ? (
          <div className="flex min-h-[254px] items-center justify-center text-sm text-brand-muted">
            Preparing document preview...
          </div>
        ) : isPdf ? (
          <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-brand-border bg-white">
            <div className="flex min-w-0 items-center gap-2 border-b border-brand-border px-3 py-2.5">
              <FileText size={17} className="shrink-0 text-red-600" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-brand-text">
                {file.name}
              </span>
              <span className="shrink-0 text-[11px] text-brand-muted">
                PDF document
              </span>
            </div>
            <iframe
              title={`Preview of ${file.name}`}
              src={previewUrl}
              className="h-[390px] w-full border-0 sm:h-[460px]"
            />
          </div>
        ) : isImage ? (
          <div className="flex min-h-[254px] items-center justify-center overflow-hidden rounded-xl border border-brand-border bg-white p-2 sm:min-h-[328px]">
            <img
              src={previewUrl}
              alt={`Electricity bill preview: ${file.name}`}
              className="max-h-[460px] w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex min-h-[254px] flex-col items-center justify-center rounded-xl border border-brand-border bg-white p-5 text-center">
            <ImageIcon size={30} className="text-brand-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-brand-text">
              Preview unavailable
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              This file format cannot be previewed.
            </p>
          </div>
        )}
      </div>

      {file && (
        <p className="mt-2 text-xs leading-5 text-brand-muted">
          Local browser preview. The document has not been uploaded to a server.
        </p>
      )}
    </section>
  );
}

export default BillPreviewPanel;