# Phase 3.9 — Integration Guide

## 1. Extract destination

Extract the ZIP into the existing repository root `D:\\solarqualify` (or your clone root). Merge the `client` and `docs` folders. The package does not replace your existing sales routes, router, SalesHeader, SalesLayout, or authentication pages.

## 2. Existing asset dependencies

The portal imports existing files from prior phases:

- `client/src/assets/images/solarqualify-hero-rooftop.jpg`

This asset was already used by the established Sales Staff screens. Do not remove it. The six new reference screenshots are copied to `docs/phase-3.9-homeowner-portal/references/` and are design references, not in-page screenshots.

## 3. Router registration

Open `client/src/app/router.jsx`.

Add these imports with the other page/layout imports:

```jsx
import HomeownerPortalLayout from "../features/homeowner/layouts/HomeownerPortalLayout.jsx";
import HomeownerDashboardPage from "../features/homeowner/pages/HomeownerDashboardPage.jsx";
import HomeownerLeadSubmissionPage from "../features/homeowner/pages/HomeownerLeadSubmissionPage.jsx";
import HomeownerProjectStatusPage from "../features/homeowner/pages/HomeownerProjectStatusPage.jsx";
import HomeownerQuotationsPage from "../features/homeowner/pages/HomeownerQuotationsPage.jsx";
import HomeownerDocumentsPage from "../features/homeowner/pages/HomeownerDocumentsPage.jsx";
import HomeownerProfileSupportPage from "../features/homeowner/pages/HomeownerProfileSupportPage.jsx";
```

Register the homeowner branch as a top-level route in the `createBrowserRouter([...])` array, alongside (not inside) your existing SalesLayout route:

```jsx
{
  path: "/homeowner",
  element: <HomeownerPortalLayout />,
  children: [
    { index: true, element: <HomeownerDashboardPage /> },
    { path: "lead", element: <HomeownerLeadSubmissionPage /> },
    { path: "project", element: <HomeownerProjectStatusPage /> },
    { path: "quotations", element: <HomeownerQuotationsPage /> },
    { path: "documents", element: <HomeownerDocumentsPage /> },
    { path: "profile-support", element: <HomeownerProfileSupportPage /> },
  ],
},
```

Place this route before the existing `{ path: "/", element: <SalesLayout />, ... }` object for readability. Preserve `/login`, `/register`, `/forgot-password`, and all Sales Staff routes.

## 4. Test URLs

- `/homeowner` — Dashboard
- `/homeowner/lead` — five-step lead submission
- `/homeowner/project` — project tracking
- `/homeowner/quotations` — quotation review
- `/homeowner/documents` — document records and local upload metadata
- `/homeowner/profile-support` — profile, preferences, FAQs and support message form

These pages can be opened directly during frontend review. There is no authentication guard yet. Do not expose these routes as production homeowner data until JWT authentication and server-side authorization are implemented.

## 5. Login handoff after backend authentication

When backend auth is ready, the login handler should route by the verified role returned by the server, not only by the role card selected in the browser:

```jsx
if (user.role === "homeowner") navigate("/homeowner");
if (user.role === "sales_staff") navigate("/");
```

Protect the homeowner branch with a route guard that checks the authenticated session and homeowner role. Never trust a client-side role selection for authorization.

## 6. Frontend checks

```powershell
npm run build --workspace=@solarqualify/client
npm test --workspace=@solarqualify/client

git diff --check
```
