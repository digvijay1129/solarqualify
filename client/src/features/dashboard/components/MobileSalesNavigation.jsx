import { useState } from "react";
import { Menu, Sun, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { salesNavigationItems } from "../../../constants/salesNavigation.js";

function MobileSalesNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-brand-border bg-brand-forest text-white lg:hidden">
      <div className="flex h-16 items-center justify-between px-5">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Sun size={23} className="text-brand-mint" />
          </div>

          <div>
            <p className="text-lg font-bold">SolarQualify</p>
            <p className="text-[11px] text-white/65">
              Sales Workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-sales-navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-mint"
        >
          {isOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

      </div>

      {isOpen && (
        <nav
          id="mobile-sales-navigation"
          aria-label="Mobile sales navigation"
          className="space-y-1 border-t border-white/15 px-4 py-4"
        >
          {salesNavigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-mint text-brand-forest"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export default MobileSalesNavigation;