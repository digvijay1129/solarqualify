import { ChevronLeft, ChevronRight } from "lucide-react";

function ProjectPagination({ page, pageSize, totalItems, totalPages, startItem, endItem, onPageChange = () => {} }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const visiblePages = totalPages <= 5 ? pages : [...new Set([1, page - 1, page, page + 1, totalPages].filter((item) => item >= 1 && item <= totalPages))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-brand-text">
        Showing <span className="font-bold">{startItem}–{endItem}</span> of <span className="font-bold">{totalItems}</span> sample records
      </p>
      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-brand-text disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft size={18} />
        </button>
        {visiblePages.map((pageNumber, index) => {
          const previous = visiblePages[index - 1];
          return (
            <span key={pageNumber} className="contents">
              {previous && pageNumber - previous > 1 && <span className="px-1 text-sm text-brand-muted">…</span>}
              <button type="button" onClick={() => onPageChange(pageNumber)} aria-current={page === pageNumber ? "page" : undefined} className={`h-9 min-w-9 rounded-lg border px-2 text-sm font-semibold ${page === pageNumber ? "border-brand-emerald bg-brand-emerald text-white" : "border-slate-300 bg-white text-brand-text hover:bg-slate-50"}`}>
                {pageNumber}
              </button>
            </span>
          );
        })}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-brand-text disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default ProjectPagination;
