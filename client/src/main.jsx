import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "@fontsource-variable/inter";
import "./styles/index.css";

import AppProviders from "./app/providers/AppProviders.jsx";
import router from "./app/router.jsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("React root element was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>
);