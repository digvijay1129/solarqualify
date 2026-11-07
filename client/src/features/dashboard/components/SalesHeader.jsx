import { ChevronRight, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageDetails = {
  "/": {
    title: "Dashboard",
    description: "Overview of your rooftop solar sales workspace.",
  },
};

function SalesHeader() {
  const location = useLocation();

  const currentPage = pageDetails[location.pathname] ?? {
    title: "Sales Workspace",
    description: "Manage your rooftop solar operations.",
  };

  return (
    <header className="flex min-h-[88px] flex-col justify-center gap-4 border-b border-brand-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">

      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-brand-muted">
          <span>Sales Workspace</span>
          <ChevronRight size={13} />
          <span className="text-brand-emerald">
            {currentPage.title}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-brand-text">
          {currentPage.title}
        </h1>

        <p className="mt-1 text-sm text-brand-muted">
          {currentPage.description}
        </p>
      </div>

      <div className="flex items-center gap-3 self-start rounded-xl border border-brand-border bg-brand-background px-3 py-2 sm:self-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mint-soft text-sm font-bold text-brand-forest">
          ST
        </div>

        <div>
          <p className="text-sm font-semibold text-brand-text">
            Sales Team
          </p>
          <p className="text-xs text-brand-muted">
            Sales Staff
          </p>
        </div>

        <Sun size={17} className="ml-2 text-brand-emerald" />
      </div>

    </header>
  );
}

export default SalesHeader;