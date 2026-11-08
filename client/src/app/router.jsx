import { createBrowserRouter, Navigate } from "react-router-dom";

// Authentication pages
import LoginPage from "../features/authentication/pages/LoginPage.jsx";
import HomeownerRegistrationPage from "../features/authentication/pages/HomeownerRegistrationPage.jsx";
import ForgotPasswordPage from "../features/authentication/pages/ForgotPasswordPage.jsx";

// Homeowner portal
import HomeownerPortalLayout from "../features/homeowner/layouts/HomeownerPortalLayout.jsx";
import HomeownerDashboardPage from "../features/homeowner/pages/HomeownerDashboardPage.jsx";
import HomeownerLeadSubmissionPage from "../features/homeowner/pages/HomeownerLeadSubmissionPage.jsx";
import HomeownerProjectStatusPage from "../features/homeowner/pages/HomeownerProjectStatusPage.jsx";
import HomeownerQuotationsPage from "../features/homeowner/pages/HomeownerQuotationsPage.jsx";
import HomeownerDocumentsPage from "../features/homeowner/pages/HomeownerDocumentsPage.jsx";
import HomeownerProfileSupportPage from "../features/homeowner/pages/HomeownerProfileSupportPage.jsx";

// Sales Staff portal
import SalesLayout from "./layouts/SalesLayout.jsx";
import SalesDashboardPage from "../features/dashboard/pages/SalesDashboardPage.jsx";
import LeadManagementPage from "../features/leads/pages/LeadManagementPage.jsx";
import BillAnalysisPage from "../features/bill-analysis/pages/BillAnalysisPage.jsx";
import QuotationBuilderPage from "../features/quotations/pages/QuotationBuilderPage.jsx";
import ProjectTrackerPage from "../features/projects/pages/ProjectTrackerPage.jsx";
import PricingSubsidyPage from "../features/pricing/pages/PricingSubsidyPage.jsx";

const router = createBrowserRouter([
  // Public authentication routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <HomeownerRegistrationPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },

  // Homeowner portal
  {
    path: "/homeowner",
    element: <HomeownerPortalLayout />,
    children: [
      {
        index: true,
        element: <HomeownerDashboardPage />,
      },
      {
        path: "lead",
        element: <HomeownerLeadSubmissionPage />,
      },
      {
        path: "project",
        element: <HomeownerProjectStatusPage />,
      },
      {
        path: "quotations",
        element: <HomeownerQuotationsPage />,
      },
      {
        path: "documents",
        element: <HomeownerDocumentsPage />,
      },
      {
        path: "profile-support",
        element: <HomeownerProfileSupportPage />,
      },
      {
        path: "*",
        element: <Navigate to="/homeowner" replace />,
      },
    ],
  },

  // Sales Staff portal
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