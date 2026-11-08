import { useState } from "react";
import { Bell, ChevronDown, Menu, X, UserRound, LogOut } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { HOMEOWNER_NAVIGATION } from "../utils/homeowner-portal.js";
import { useHomeownerPortal } from "../context/HomeownerPortalContext.jsx";

function HomeownerHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { profile, notice, setNotice } = useHomeownerPortal();
  const initials = String(profile.fullName || "Homeowner").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden" aria-label={menuOpen ? "Close navigation" : "Open navigation"}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><UserRound size={19} /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">Homeowner Portal</p>
            <p className="hidden text-xs text-slate-500 sm:block">Manage your profile, projects and solar documents.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} className="relative rounded-full p-2 text-slate-700 hover:bg-slate-100">
              <Bell size={20} /><span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400" />
            </button>
            {notificationsOpen && <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xl"><p className="font-bold text-slate-900">Notifications</p><p className="mt-2 text-xs leading-5 text-slate-500">No live notifications are connected in this demo.</p></div>}
          </div>
          <div className="relative flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-900">{initials || "H"}</span>
            <button type="button" aria-expanded={profileOpen} onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} className="hidden min-w-0 items-center gap-2 text-left sm:flex">
              <span className="min-w-0"><span className="block max-w-36 truncate text-xs font-extrabold text-slate-900">{profile.fullName}</span><span className="mt-0.5 block text-[11px] text-slate-500">Homeowner · Demo</span></span>
              <ChevronDown size={16} className={`text-slate-500 transition ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><Link to="/homeowner/profile-support" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><UserRound size={15} /> My Profile</Link><Link to="/login" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><LogOut size={15} /> Sign out (demo)</Link></div>}
          </div>
        </div>
      </div>
      {menuOpen && <nav aria-label="Mobile homeowner navigation" className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3 lg:hidden">{HOMEOWNER_NAVIGATION.map((item) => <NavLink key={item.path} to={item.path} end={item.path === "/homeowner"} onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-xs font-semibold ${isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}>{item.label}</NavLink>)}</nav>}
      {notice && <div role="status" className={`mt-3 flex items-start justify-between gap-3 rounded-xl px-3 py-2 text-xs ${notice.tone === "success" ? "bg-emerald-50 text-emerald-900" : notice.tone === "error" ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-900"}`}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">×</button></div>}
    </header>
  );
}

export default HomeownerHeader;
