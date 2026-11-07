import { createBrowserRouter, Navigate } from "react-router-dom";

import SalesLayout from "./layouts/SalesLayout.jsx";
import SalesDashboardPage from "../features/dashboard/pages/SalesDashboardPage.jsx";

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
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;