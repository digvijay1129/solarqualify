import { NavLink } from "react-router-dom";
import {
  ClipboardPlus,
  FileText,
  FolderOpen,
  Headset,
  Home,
  PanelsTopLeft,
  UserRound,
} from "lucide-react";
import { HOMEOWNER_NAVIGATION } from "../utils/homeowner-portal.js";
import SolarQualifyLogo from "./SolarQualifyLogo.jsx";
import rooftopImage from "../../../assets/images/solarqualify-homeowner-rooftop.jpg";

const icons = { Home, ClipboardPlus, PanelsTopLeft, FileText, FolderOpen, UserRound };

function HomeownerSidebar() {
  return (
    <aside className="relative hidden min-h-screen w-[276px] shrink-0 flex-col overflow-hidden bg-[#08243f] text-white lg:flex">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-cover bg-center opacity-60"
        style={{ backgroundImage: `linear-gradient(180deg, #08243f 0%, rgba(8,36,63,.46) 42%, rgba(8,36,63,.04) 100%), url(${rooftopImage})` }}
        aria-hidden="true"
      />
      <div className="relative z-10 border-b border-white/10 px-5 py-5">
        <SolarQualifyLogo />
      </div>
      <div className="relative z-10 mx-4 mt-5 rounded-2xl border border-white/15 bg-white/10 p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-100"><Home size={19} /></span>
          <div>
            <p className="text-sm font-extrabold">Homeowner Portal</p>
            <p className="mt-0.5 text-xs text-slate-300">Manage your solar journey</p>
          </div>
        </div>
      </div>
      <nav aria-label="Homeowner navigation" className="relative z-10 mt-5 flex-1 space-y-1 px-3">
        {HOMEOWNER_NAVIGATION.map((item) => {
          const Icon = icons[item.icon] ?? Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/homeowner"}
              className={({ isActive }) => [
                "flex min-h-12 items-center gap-3 rounded-xl border-l-[3px] px-4 text-sm font-semibold transition",
                isActive
                  ? "border-emerald-300 bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-md"
                  : "border-transparent text-slate-200 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={1.9} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="relative z-10 m-4 overflow-hidden rounded-2xl border border-white/20 bg-[#102f4d]/90 p-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 text-emerald-200"><Headset size={20} /><span className="text-sm font-extrabold">Need Help?</span></div>
        <p className="mt-2 text-xs leading-5 text-slate-200">Our solar support team can help with your project, quotation or documents.</p>
        <NavLink to="/homeowner/profile-support" className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-amber-300 px-3 text-xs font-bold text-amber-200 hover:bg-amber-300/10">Contact Support <span className="ml-2">â†’</span></NavLink>
      </div>
    </aside>
  );
}

export default HomeownerSidebar;
