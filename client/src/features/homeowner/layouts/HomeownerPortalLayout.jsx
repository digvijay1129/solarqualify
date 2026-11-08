import { Outlet } from "react-router-dom";
import HomeownerHeader from "../components/HomeownerHeader.jsx";
import HomeownerSidebar from "../components/HomeownerSidebar.jsx";
import { HomeownerPortalProvider } from "../context/HomeownerPortalContext.jsx";

function HomeownerPortalLayout() {
  return (
    <HomeownerPortalProvider>
      <div className="min-h-screen bg-[#f5f8fb] lg:flex">
        <HomeownerSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <HomeownerHeader />
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 xl:px-7 xl:py-6">
            <Outlet />
          </main>
          <footer className="px-4 pb-5 text-center text-[10px] leading-5 text-slate-500 sm:px-6">
            SolarQualify homeowner demo portal. Sample data and actions are temporary browser-session interactions; no account, document, message or project update is sent to a server.
          </footer>
        </div>
      </div>
    </HomeownerPortalProvider>
  );
}

export default HomeownerPortalLayout;
