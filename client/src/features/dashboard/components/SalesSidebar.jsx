import { Sun } from "lucide-react";
import { NavLink } from "react-router-dom";

import { salesNavigationItems } from "../../../constants/salesNavigation.js";

function SalesSidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-brand-forest px-5 py-6 text-white lg:flex">

      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
          <Sun size={25} className="text-brand-mint" />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">
            SolarQualify
          </h1>
          <p className="mt-0.5 text-xs text-white/60">
            Solar Management
          </p>
        </div>
      </div>

      <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
        Sales Workspace
      </p>

      <nav aria-label="Sales navigation" className="flex-1 space-y-1">
        {salesNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-brand-mint text-brand-forest shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-white/15 pt-5">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mint text-sm font-bold text-brand-forest">
            ST
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Sales Team
            </p>
            <p className="mt-0.5 text-xs text-white/55">
              Staff Workspace
            </p>
          </div>
        </div>
      </div>

    </aside>
  );
}

export default SalesSidebar;