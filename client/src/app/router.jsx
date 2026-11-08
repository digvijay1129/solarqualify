import { createBrowserRouter, Navigate } from "react-router-dom";

import SalesLayout from "./layouts/SalesLayout.jsx";
import SalesDashboardPage from "../features/dashboard/pages/SalesDashboardPage.jsx";
import LeadManagementPage from "../features/leads/pages/LeadManagementPage.jsx";
import BillAnalysisPage from "../features/bill-analysis/pages/BillAnalysisPage.jsx";
import QuotationBuilderPage from "../features/quotations/pages/QuotationBuilderPage.jsx";
import ProjectTrackerPage from "../features/projects/pages/ProjectTrackerPage.jsx";
import PricingSubsidyPage from "../features/pricing/pages/PricingSubsidyPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SalesLayout />,
    children: [
      {
        index: true,
        element: <SalesDashboardPage />,
      },
      {
        path: "leads",
        element: <LeadManagementPage />,
      },
      {
        path: "bill-analysis",
        element: <BillAnalysisPage />,
      },
      {
        path: "quotations",
        element: <QuotationBuilderPage />,
      },
      {
        path: "projects",
        element: <ProjectTrackerPage />,
      },
      {
        path: "pricing",
        element: <PricingSubsidyPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;