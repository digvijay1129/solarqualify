import { ChevronLeft, ChevronRight } from "lucide-react";

function LeadPagination({
  page = 1,
  pageSize = 5,
  totalItems = 0,
  totalPages = 1,
  onPageChange = () => {},
  onPageSizeChange = () => {},
}) {
  const safeTotal = Math.max(0, Number(totalItems) || 0);
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 5);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);

  const startItem = safeTotal === 0
    ? 0
    : (safePage - 1) * safePageSize + 1;

  const endItem = Math.min(safePage * safePageSize, safeTotal);

  const visiblePages = Array.from(
    { length: safeTotalPages },
    (_, index) => index + 1
  ).filter((pageNumber) => (
    pageNumber === 1 ||
    pageNumber === safeTotalPages ||
    Math.abs(pageNumber - safePage) <= 1
  ));

  return (
    <div className="flex flex-col gap-4 border-t border-brand-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-brand-muted" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-brand-text">{startItem}</span>
        {" – "}
        <span className="font-semibold text-brand-text">{endItem}</span>
        {" of "}
        <span className="font-semibold text-brand-text">{safeTotal}</span>
        {" sample records"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-brand-muted">
          <span className="whitespace-nowrap">Rows per page</span>

          <select
            value={safePageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="Rows per page"
            className="h-9 rounded-lg border border-brand-border bg-white px-2 text-sm font-medium text-brand-text outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-text transition hover:bg-brand-mint-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>

          {visiblePages.map((pageNumber, index) => {
            const previousPage = visiblePages[index - 1];
            const needsEllipsis =
              previousPage != null && pageNumber - previousPage > 1;

            return (
              <span key={pageNumber} className="flex items-center gap-1">
                {needsEllipsis && (
                  <span className="px-1 text-sm text-brand-muted" aria-hidden="true">
                    …
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  aria-label={`Page ${pageNumber}`}
                  aria-current={safePage === pageNumber ? "page" : undefined}
                  className={[
                    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition",
                    safePage === pageNumber
                      ? "bg-[#078B37] text-white shadow-sm"
                      : "border border-brand-border bg-white text-brand-text hover:bg-brand-mint-soft",
                  ].join(" ")}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= safeTotalPages}
            aria-label="Next page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-text transition hover:bg-brand-mint-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadPagination;