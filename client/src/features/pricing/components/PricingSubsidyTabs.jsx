import { Coins, Landmark, Clock3, Settings } from "lucide-react";

const tabs = [
  { id: "pricing-configuration", label: "Pricing Configuration", icon: Coins },
  { id: "subsidy-rules", label: "Subsidy Rules", icon: Landmark },
  { id: "rule-versions", label: "Rule Versions & History", icon: Clock3 },
  { id: "configuration-settings", label: "Configuration Settings", icon: Settings },
];

function PricingSubsidyTabs({ activeTab, onNavigate }) {
  return (
    <nav aria-label="Pricing and subsidy sections" className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            aria-current={isActive ? "location" : undefined}
            className={`inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${isActive ? "border-brand-emerald bg-brand-forest text-white shadow-sm" : "border-slate-300 bg-white text-brand-text hover:border-brand-emerald hover:bg-brand-mint-soft"}`}
          >
            <Icon size={21} className="shrink-0" aria-hidden="true" />
            <span className="text-center">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default PricingSubsidyTabs;
