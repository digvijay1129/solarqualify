# SolarQualify — Phase 3.8: Authentication & Role Management

This package adds the **frontend authentication experience** based on the two supplied SolarQualify references:

1. Role-aware sign-in screen (Homeowner / Sales Staff).
2. Four-step Homeowner Registration (Basic Details → Address → Property & Solar → Create Account).
3. Forgot-password screen.

## Important scope boundary

This is a frontend prototype package. It includes form validation, responsive UI, role selection, and clear demo-mode feedback. It does **not** authenticate users, create persistent accounts, store passwords, send password-reset emails, or connect Google OAuth. Those must be implemented by the backend in the later integration phase.

No password or registration data is written to `localStorage`, `sessionStorage`, or a server.

## Requirements

- Existing SolarQualify React + Vite + JavaScript frontend.
- Existing Tailwind CSS configuration and design tokens.
- Existing `lucide-react` dependency.
- Existing image asset from the previous phases:
  `client/src/assets/images/solarqualify-hero-rooftop.jpg`

All implementation files use `.js` or `.jsx`. No TypeScript is included.

## ZIP contents and destinations

Extract the ZIP at `D:\solarqualify`. The archive preserves repository-relative paths:

- `client/src/features/authentication/` → authentication UI, pages, service and validation.
- `client/src/mocks/fixtures/authentication.fixture.js` → static UI copy and registration options.
- `client/src/mocks/repositories/authentication.repository.js` → explicit demo-only repository adapter.

The package intentionally does **not** overwrite your existing root `README.md`, `router.jsx`, `SalesHeader.jsx`, `SalesLayout.jsx`, or app providers. The four package guides are placed under `docs/phase-3.8-authentication/`; see its `INTEGRATION.md` for the small route-registration change.

## Design implementation notes

- Desktop: split-screen solar hero and white authentication card, following the login reference.
- Mobile: hero becomes a compact top section; forms stack into one column.
- Registration uses a four-step progress indicator and retains entered values while moving between steps.
- Required fields display inline validation errors.
- DOB and address line 2 are optional; required markers and validation follow the assumptions document.
- The hero reuses the existing SolarQualify rooftop image asset; no duplicate image is added to this ZIP.

## After copying

From PowerShell:

```powershell
cd D:\solarqualify

Test-Path "client/src/features/authentication/pages/LoginPage.jsx"
Test-Path "client/src/features/authentication/pages/HomeownerRegistrationPage.jsx"
Test-Path "client/src/features/authentication/pages/ForgotPasswordPage.jsx"
Test-Path "client/src/mocks/fixtures/authentication.fixture.js"
```

Then open `docs/phase-3.8-authentication/INTEGRATION.md` and follow the route-registration instructions before running the frontend build and tests.
