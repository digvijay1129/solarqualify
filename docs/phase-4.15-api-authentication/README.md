# Phase 4.15.1–4.15.2 — API and Authentication Integration

## Shared API infrastructure

The React client uses `client/src/services/api/api-client.js` for API requests. Configure
`VITE_API_BASE_URL` with the backend URL including its `/api/v1` prefix.

The client:
- Sends JSON requests and supports `FormData`, text, JSON, and binary responses.
- Adds the stored JWT as a Bearer token by default.
- Normalizes network and HTTP failures to `ApiError`.
- Does not log request bodies, passwords, or access tokens.

## Session behavior

The backend currently issues JWT access tokens in the login and registration response.
There is no refresh-token or HttpOnly-cookie endpoint yet.

- The default sign-in choice stores the access token in `sessionStorage` (current browser tab session).
- Selecting **Remember me** stores it in `localStorage` until logout or token expiry.
- If browser storage is disabled, the token is kept in memory for the current page session only.
- The app validates a stored token with `GET /auth/me` before rendering a protected portal.
- A 401 clears the stored token. A network/API outage keeps the route blocked and offers a retry rather than treating an unverified token as authenticated.
- Logout calls `POST /auth/logout` when possible and always clears the browser token.

**Backend limitation:** the current logout endpoint is stateless and does not revoke JWTs. A copied
token can remain valid until its configured expiry. The frontend logout only removes the token
from this browser.

**Storage consideration:** both Web Storage and in-memory tokens are readable by JavaScript. They
are not HttpOnly cookies. For production, use HTTPS, apply strong XSS protections, keep access
token lifetimes appropriately short, and consider a server-managed HttpOnly, Secure, SameSite
cookie/refresh-token design.

## Authentication routes

| Client action | API endpoint | Behavior |
|---|---|---|
| Homeowner/Sales Staff sign-in | `POST /auth/login` | Authenticates existing credentials and returns user + access token |
| Homeowner registration | `POST /auth/register` | Creates a homeowner account and returns user + access token |
| Restore/check session | `GET /auth/me` | Validates token and returns the current active user |
| Sign out | `POST /auth/logout` | Acknowledges logout; client discards the access token |

The role selector on the login page is a convenience check only. The backend role is authoritative.
Sales Staff accounts must already exist and be provisioned by an administrator; public registration
always creates a homeowner account.

## Registration data scope

The registration form collects only fields supported by the existing account-registration API:
- full name (`name`)
- email
- phone (10-digit Indian mobile number prefixed with `+91`)
- password

The server hashes the password and does not return the password hash. Address, date of birth,
property ownership, roof type, roof area, and monthly electricity bill are not collected by this
account-registration screen. They belong in the later homeowner lead/property submission flow.

## Local development

1. Start the backend using the existing root workspace command:
   `npm run dev:server`
2. Ensure the server `.env` has valid `JWT_SECRET`, `DOCUMENT_ENCRYPTION_KEY`,
   `MONGODB_URI`, and `CLIENT_ORIGIN=http://127.0.0.1:5173`.
3. Copy `client/.env.example` to `client/.env` if needed and confirm
   `VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1`.
4. Start the frontend: `npm run dev:client`.

For production, use HTTPS for both the frontend and API and set the API base URL to the deployed
backend origin. Never ship backend secrets in any `VITE_*` variable.

## Verification

From the repository root:
```powershell
npm run build:client
npm run test:client
npm run test:server
```

The global `VITE_DATA_SOURCE` remains `mock` because the dashboard, leads, bill analysis,
pricing, quotations, projects and other feature repositories have not all been migrated yet.
Authentication routes use the API regardless of that setting.

This phase integrates the shared client and authentication only. Feature-level API repositories,
end-to-end verification, and deployment remain in the roadmap.
