import { List, Users, TriangleAlert } from "lucide-react";

const tabs = [
  { id: "all", label: "All Projects", icon: List, countKey: "totalProjects" },
  { id: "my", label: "My Projects", icon: Users, countKey: "myProjects" },
  { id: "overdue", label: "Overdue", icon: TriangleAlert, countKey: "overdue" },
];

function ProjectViewTabs({ activeView = "all", summary = {}, onChange = () => {} }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="tablist" aria-label="Project views">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${active ? "border-brand-emerald bg-brand-forest text-white shadow-sm" : "border-slate-300 bg-white text-brand-text hover:border-brand-emerald hover:bg-brand-mint-soft"}`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{tab.label}</span>
            <span className={`tabular-nums ${active ? "text-white" : "text-brand-muted"}`}>({summary[tab.countKey] ?? 0})</span>
          </button>
        );
      })}
    </div>
  );
}

export default ProjectViewTabs;
