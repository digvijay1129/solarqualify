import { FileSpreadsheet, Coins, FileText } from "lucide-react";

const tabs = [
  { id: "system-details", label: "System Details", icon: FileSpreadsheet },
  { id: "pricing-subsidy", label: "Pricing & Subsidy", icon: Coins },
  { id: "quotation-summary", label: "Quotation Preview", icon: FileText },
];

function QuotationBuilderTabs({ activeTab = "system-details", onNavigate = () => {} }) {
  return (
    <nav aria-label="Quotation sections" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            aria-current={active ? "step" : undefined}
            className={[
              "inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold transition sm:text-base",
              active
                ? "border-brand-emerald bg-brand-forest text-white shadow-sm"
                : "border-slate-300 bg-white text-brand-text hover:border-brand-emerald hover:bg-brand-mint-soft",
            ].join(" ")}
          >
            <Icon size={23} aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default QuotationBuilderTabs;
