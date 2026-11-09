# SolarQualify — Deployment and Local Run Guide

> This file is part of the take-home submission. Secrets and real customer data must never be committed.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- MongoDB 7 or newer (local) or a MongoDB Atlas database
- Git

The repository is an npm-workspaces monorepo. Run commands from the repository root unless a step says otherwise.

## 1. Clone and install

```bash
git clone https://github.com/digvijay1129/solarqualify.git
cd solarqualify
npm install
```

## 2. Configure the backend

Copy the backend environment template:

PowerShell:
```powershell
Copy-Item server/.env.example server/.env
```

macOS/Linux:
```bash
cp server/.env.example server/.env
```

Set these values in `server/.env`:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` locally; `production` in deployment |
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Random secret of at least 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime, e.g. `1h` |
| `CLIENT_ORIGIN` | Exact frontend origin allowed by CORS |
| `MAX_UPLOAD_MB` | Upload limit (default 5; maximum 20) |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key for private document storage |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint |
| `DOCUMENT_ENCRYPTION_KEY` | Base64-encoded 32-byte AES key |

Generate secrets locally; do not copy them into source control:

PowerShell:
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

macOS/Linux:
```bash
openssl rand -base64 32
```

Use separate, randomly generated values for `JWT_SECRET` and `DOCUMENT_ENCRYPTION_KEY`. The encryption key must decode to exactly 32 bytes. Keep a secure backup: losing it makes encrypted customer documents unreadable. Never reuse the example values as production secrets.

For a local-only walkthrough without external object storage, configure ImageKit credentials only if the backend's selected document-storage adapter requires them; the current production path uses private ImageKit storage. Do not expose uploaded files through public buckets or public URLs.

## 3. Configure the frontend

Copy the frontend template:

PowerShell:
```powershell
Copy-Item client/.env.example client/.env
```

macOS/Linux:
```bash
cp client/.env.example client/.env
```

Set:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1
VITE_DEFAULT_LOCALE=en
```

`VITE_API_BASE_URL` must include `/api/v1`. Vite variables are bundled into client code; never put server secrets in `VITE_*` variables.

## 4. Start MongoDB and run the application

Start your local MongoDB service, or use your Atlas URI in `MONGODB_URI`.

Open two terminals at the repository root.

Terminal 1 — API:
```bash
npm run dev:server
```

Terminal 2 — frontend:
```bash
npm run dev:client
```

Open:
- Frontend: http://127.0.0.1:5173
- API health check: http://127.0.0.1:5000/api/v1/health

The backend connects to MongoDB before accepting requests. If it fails to start, check the backend terminal and confirm MongoDB and all required environment variables are configured.

## 5. Demo access and seed data

The project source includes synthetic sample fixtures for design and automated tests. The production application does not fall back to those fixtures when API calls fail. There is no committed demo password, pre-seeded production user, or public reviewer account in this repository.

Create a homeowner account using the Register screen. A Sales Staff account must be provisioned securely in the review database by the project owner; public self-registration creates homeowner accounts only. Do not add a hard-coded reviewer password or real customer data to Git.

For reviewer access, provision a dedicated synthetic Sales Staff account in the private deployment database and share its credentials through the submission platform's private channel (not this public repository). Create a separate synthetic homeowner account through registration. Do not reuse personal accounts or production credentials.

## 6. Tests and production build

Run the automated checks from the repository root:

```bash
npm run test:client
npm run build:client
npm run test:server
```

GitHub Actions runs backend tests and frontend tests/build on pushes. Confirm the latest run status before submission. A passing unit/integration CI run is not a substitute for a manual browser smoke test against the deployed services.

## 7. Deployment topology

The intended deployment topology is:

- Frontend: Vercel (deploy the `client` workspace; configure the Vite build output as `client/dist` and root/install settings to install from the monorepo).
- Backend: Render (Node web service, repository root; build command `npm install`; start command `npm run start:server`).
- Database: MongoDB Atlas.
- Private documents: ImageKit private storage, with document encryption key configured only in the backend environment.

Set `CLIENT_ORIGIN` to the exact deployed Vercel origin. Set the Vercel `VITE_API_BASE_URL` to the deployed API origin plus `/api/v1`. Configure every backend variable from the table above in Render's environment settings and the frontend variables in Vercel. Use separate production credentials and restrict database network access to the backend service.

**Deployment status:** This repository documents the deployment target but does not contain a verified live application URL or evidence of an active Vercel/Render deployment. Treat the app as locally runnable and CI-verified until the owner adds and smoke-tests the actual production URLs.

## 8. Security and data handling checklist

- Keep `.env` files out of Git; commit only `.env.example` templates with placeholders.
- Use unique strong production secrets; rotate any key that was ever committed.
- Use TLS for deployed frontend/API/database connections.
- Restrict CORS to the deployed frontend origin.
- Keep bill documents private and serve them only through authorized API routes.
- Use synthetic data for screenshots, demos and tests.
- Do not share real consumer numbers, electricity bills, addresses or contact information in logs or public issues.
- Provide a retention/deletion policy and privacy notice before production processing of personal electricity data.
- Verify current subsidy rules and their applicability before creating customer-facing financial offers.

## 9. Known scope boundaries

This assessment build mocks external payments and WhatsApp/SMS delivery. In-app notification records are simulated. There is no government subsidy-portal filing, DISCOM integration, inventory/purchasing workflow, inverter monitoring, homeowner quotation acceptance workflow, project document upload API, or persisted homeowner profile/support preference workflow. See `docs/assumptions.md` and the Phase 4.15 implementation notes.

