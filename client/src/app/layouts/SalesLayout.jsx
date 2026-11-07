import { Outlet } from "react-router-dom";

import SalesSidebar from "../../features/dashboard/components/SalesSidebar.jsx";
import SalesHeader from "../../features/dashboard/components/SalesHeader.jsx";
import MobileSalesNavigation from "../../features/dashboard/components/MobileSalesNavigation.jsx";

function SalesLayout() {
  return (
    <div className="min-h-screen bg-brand-background lg:flex">

      <SalesSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSalesNavigation />

        <SalesHeader />

        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default SalesLayout;