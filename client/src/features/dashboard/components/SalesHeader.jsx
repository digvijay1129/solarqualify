import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  House,
  LogOut,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../authentication/context/AuthContext.jsx";

function SalesHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const pageTitle =
    location.pathname === "/"
      ? "Overview"
      : location.pathname === "/leads"
        ? "Leads"
        : location.pathname === "/bill-analysis"
          ? "Bill Analysis"
          : location.pathname === "/quotations"
            ? "Quotation Builder"
            : location.pathname === "/projects"
              ? "Project Tracker"
              : location.pathname === "/pricing"
                ? "Pricing & Subsidy"
                : "Sales Workspace";

  const displayName = user?.name || "Sales Staff";
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "S";

  async function handleSignOut() {
    setShowProfile(false);
    await signOut();
    navigate("/login", { replace: true });
  }

  function NotificationButton() {
    return (
      <div className="relative">
        <button
          type="button"
          aria-label="Notifications"
          aria-expanded={showNotifications}
          onClick={() => {
            setShowNotifications((previous) => !previous);
            setShowProfile(false);
          }}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-border text-brand-text hover:bg-brand-background"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-brand-border bg-white p-4 shadow-lg">
            <p className="text-sm font-semibold text-brand-text">Notifications</p>
            <p className="mt-2 text-xs text-brand-muted">Live notification integration is part of a later phase.</p>
          </div>
        )}
      </div>
    );
  }

  function ProfileButton({ desktop = false }) {
    return (
      <div className="relative">
        <button
          type="button"
          aria-label="Open staff profile menu"
          aria-expanded={showProfile}
          onClick={() => {
            setShowProfile((previous) => !previous);
            setShowNotifications(false);
          }}
          className={[
            "flex shrink-0 items-center justify-center hover:bg-brand-background",
            desktop ? "gap-3 rounded-xl px-1 py-1" : "h-10 w-10 rounded-full",
          ].join(" ")}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-emerald text-base font-semibold text-white lg:h-11 lg:w-11">
            {initials}
          </div>

          {desktop && (
            <>
              <div className="min-w-0 text-left">
                <p className="max-w-40 truncate whitespace-nowrap text-sm font-bold text-brand-text">{displayName}</p>
                <p className="mt-0.5 max-w-40 truncate text-xs text-brand-muted">{user?.email || "Sales Staff"}</p>
              </div>
              <ChevronDown size={19} className={showProfile ? "rotate-180" : ""} />
            </>
          )}
        </button>

        {showProfile && (
          <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-brand-border bg-white p-4 shadow-lg">
            <p className="truncate text-sm font-semibold text-brand-text">{displayName}</p>
            <p className="mt-1 truncate text-xs text-brand-muted">{user?.email}</p>
            <p className="mt-1 text-xs text-brand-muted">Sales Staff</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex min-h-10 w-full items-center gap-2 border-t border-brand-border pt-3 text-left text-sm font-semibold text-red-700 hover:text-red-800"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  function SearchField() {
    return (
      <label className="flex h-10 min-w-0 w-full items-center gap-2 rounded-xl border border-brand-border bg-white px-3 focus-within:ring-2 focus-within:ring-brand-emerald/20 lg:h-11 lg:w-[355px] lg:flex-none lg:gap-3 lg:px-4">
        <Search size={19} className="shrink-0 text-brand-muted" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search leads, customers, projects..."
          aria-label="Search leads, customers and projects"
          className="block w-full min-w-0 border-0 bg-transparent text-sm text-brand-text outline-none placeholder:text-brand-muted"
        />
      </label>
    );
  }

  return (
    <header className="relative z-20 w-full min-w-0 border-b border-brand-border bg-white px-4 py-4 sm:px-6 lg:flex lg:min-h-[88px] lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-4">
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-brand-text">{pageTitle}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-brand-muted">
              <House size={16} /><span>Home</span><span>/</span><span className="font-medium text-brand-text">{pageTitle}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationButton />
            <ProfileButton />
          </div>
        </div>
        <SearchField />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-between gap-6 lg:flex">
        <div className="min-w-0 shrink-0">
          <h1 className="text-[30px] font-bold tracking-tight text-brand-text">{pageTitle}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-brand-muted">
            <House size={16} /><span>Home</span><span>/</span><span className="font-medium text-brand-text">{pageTitle}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <SearchField />
          <NotificationButton />
          <div className="h-10 w-px bg-brand-border" />
          <ProfileButton desktop />
        </div>
      </div>
    </header>
  );
}

export default SalesHeader;
