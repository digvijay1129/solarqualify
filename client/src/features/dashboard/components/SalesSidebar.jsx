import { NavLink } from "react-router-dom";

import {
  Sun,
  Users,
  FileSearch,
  IndianRupee,
  Layers,
  Percent,
  Settings,
  House,
} from "lucide-react";

import { salesNavigationItems } from "../../../constants/salesNavigation.js";

import sidebarHouseImage from "../../../assets/images/solarqualify-sidebar-home.jpg";

function SolarLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 48 48"
        className="h-12 w-12 shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="10" r="7" fill="#FACC15" />
        <g stroke="#FACC15" strokeWidth="2" strokeLinecap="round">
          <path d="M24 0V-2 M10 10H6 M38 10H42 M14 1L11 -2 M34 1L37 -2" />
        </g>
        <path
          d="M8 25H40L45 43H3L8 25Z"
          fill="#0F766E"
          stroke="#E5FCEB"
          strokeWidth="2"
        />
        <path
          d="M14 25L11 43 M23 25V43 M32 25L35 43 M5 34H43"
          stroke="#E5FCEB"
          strokeWidth="1.5"
        />
      </svg>

      <div className="min-w-0">
        <h1 className="whitespace-nowrap text-[21px] font-bold tracking-tight text-white">
          SolarQualify
        </h1>
        <p className="whitespace-nowrap text-xs text-white/85">
          Rooftop Solar Solutions
        </p>
      </div>
    </div>
  );
}

function SalesSidebar() {
  return (
    <aside className="relative hidden h-screen w-[260px] shrink-0 flex-col overflow-hidden bg-brand-forest text-white lg:sticky lg:top-0 lg:flex">

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[230px]"
        aria-hidden="true"
      >
        <img
          src={sidebarHouseImage}
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-forest/50 via-transparent to-brand-forest/40" />
      </div>

      <div className="relative z-10 px-5 pb-5 pt-6">
        <SolarLogo />
      </div>

      <nav
        aria-label="Sales navigation"
        className="relative z-10 mt-2 flex-1 space-y-1 px-3"
      >
        {salesNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex h-[48px] items-center gap-4 rounded-xl px-5 text-[15px] font-semibold transition-colors duration-200",
                  isActive
                    ? "bg-brand-mint text-brand-forest shadow-sm"
                    : "text-white hover:bg-white/10",
                ].join(" ")
              }
            >
              <Icon size={23} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="relative z-10 mx-3 mb-5 flex items-center gap-3 rounded-2xl border border-white/20 bg-brand-forest/80 p-3 backdrop-blur-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-mint text-lg font-bold text-brand-forest">
          D
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">
            Digvijay Rajput
          </p>
          <p className="mt-0.5 text-xs text-white/75">
            Sales Staff
          </p>
        </div>

        <House size={17} className="shrink-0 text-white/80" />
      </div>

    </aside>
  );
}

export default SalesSidebar;