# Phase 3.8 integration instructions

## 1. Copy the ZIP files

Extract the archive at the repository root (`D:\solarqualify`). Allow the `client/src/...` folders to merge with the existing folders. Do not replace unrelated files.

The archive does not include or overwrite your existing router, header, layout, or providers.

## 2. Register public routes

Open:

`client/src/app/router.jsx`

Add these imports with the other page imports:

```jsx
import LoginPage from "../features/authentication/pages/LoginPage.jsx";
import HomeownerRegistrationPage from "../features/authentication/pages/HomeownerRegistrationPage.jsx";
import ForgotPasswordPage from "../features/authentication/pages/ForgotPasswordPage.jsx";
```

Your existing router currently has one SalesLayout route with nested dashboard routes. Add the three public routes at the **top level**, outside the SalesLayout route, so the authentication pages do not render the sales sidebar/header.

The overall structure should look like this. Preserve all existing child routes inside the SalesLayout block:

```jsx
const router = createBrowserRouter([
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
  {
    path: "/",
    element: <SalesLayout />,
    children: [
      // Keep your existing dashboard, leads, bill-analysis,
      // quotations, projects and pricing routes here.
    ],
  },
]);
```

Do not add duplicate wildcard routes. Keep your current wildcard redirect within the SalesLayout children unless you deliberately choose a separate top-level 404 page.

## 3. Current app entry behaviour

The package supplies these UI routes:

- `/login`
- `/register`
- `/forgot-password`

For this frontend-only phase, existing Sales Staff routes remain accessible as they are today. The login screen does not protect them yet. **Do not describe this as secure role-based access control.** Actual route guards and server-side role authorization belong in the backend integration phase.

## 4. Verify

```powershell
npm run build --workspace=@solarqualify/client
npm test --workspace=@solarqualify/client
git diff --check
```

Open these URLs in the local Vite app:

- `http://127.0.0.1:5173/login`
- `http://127.0.0.1:5173/register`
- `http://127.0.0.1:5173/forgot-password`

## 5. Integration after review

Do not commit until the pages have been checked at desktop and iPhone 16 (393 × 852) widths and the user approves the result.

Backend follow-up must replace the demo repository with real API calls and add secure session handling, password hashing on the server, password reset, Google OAuth (if required), and server-enforced role permissions.
