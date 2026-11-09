# Phase 4.15.3–4.15.4 — Homeowner and Lead Management API Integration

## Phase 4.15.3 — Homeowner

The homeowner portal now loads account-scoped records using the authenticated API client and the existing Bearer token.

| Experience | API used | Integration |
|---|---|---|
| Homeowner dashboard | `GET /leads/overview`, `GET /leads`, `GET /projects`, lead quotation and bill metadata | Live counts, enquiry list, project summary, activity and document metadata |
| Solar enquiry | `POST /leads` | Creates a homeowner-owned lead; consent is required |
| Electricity bill upload | `POST /leads/:leadId/bill` | Private bill upload using multipart field `bill` |
| Bill OCR | `POST /leads/:leadId/bill/analyze` | Displays OCR result and explicitly retains `needs_review` until Sales Staff verification |
| Quotation history | `GET /leads/:leadId/quotations` | Lists real quotation DTOs and price/calculation snapshots |
| Quotation PDF | `GET /quotations/:quotationId/pdf` | Downloads the private quotation PDF |
| Project tracking | `GET /projects` | Displays actual project stage, milestone status and history |
| Bill document download | `GET /leads/:leadId/bill/download` | Downloads a private bill document |

### Lead form field scope

The current lead model persists customer name, email, phone, combined property address, property type, ownership, monthly electricity bill, monthly units and consent.

The existing UI also asks for preferred contact method, roof type, roof area and sanctioned load. Those fields are not persisted by the current lead endpoint and are not sent as if they were saved. The form identifies that limitation on the review step. They should be added to a validated lead/property schema or a separate property-details endpoint before they are advertised as stored account data.

### Bill upload and verification

The upload field is named `bill`, matching the server middleware. The client limits uploads to 5 MB to align with the default server configuration and allows PDF, JPEG, PNG and WebP files.

OCR extraction is not verification. The result is presented as requiring manual Sales Staff review. The client does not mark an OCR result as verified or use unverified extracted values as an approved bill.

### Quotations and projects

Homeowner quotation pages are read-only because the current API does not expose homeowner quotation acceptance or change-request endpoints. Project records are created by Sales Staff from an accepted quotation in the backend workflow; the homeowner sees an empty state until a project exists. No installation date, appointment, installer contact or project ETA is fabricated.

## Phase 4.15.4 — Sales Staff Lead Management

| Experience | API used | Integration |
|---|---|---|
| Overview/KPIs | `GET /leads/overview` | Live totals, status counts and priorities |
| Search/filter/pagination | `GET /leads?page=&pageSize=&status=&priority=&location=&search=` | Server-side filters and pagination (page sizes 5, 10, 20) |
| Lead details | `GET /leads/:leadId` | Retrieves the current authorized record |
| Claim/assignment | `PATCH /leads/:leadId/assignment` | Claims an unassigned lead or confirms the current Sales Staff assignment |
| Explainable scoring | `POST /leads/:leadId/qualify` | Calculates and persists a lead score |
| Qualification detail | `GET /leads/:leadId/qualification` | Displays score, reason breakdown, scoring version and data gaps |

Sales Staff list scope is enforced by the API: leads currently assigned to the signed-in user and unassigned leads are returned. The UI does not provide an arbitrary staff assignment selector because the current assignment contract permits an unassigned lead to be claimed by the current user; it does not provide an all-staff assignment directory.

Lead scores are follow-up indicators. The UI exposes scoring reasons and data gaps and does not automatically reject low-scoring records. Site visit scheduling and customer notifications are not implemented by these APIs.

## Local configuration

The frontend uses the existing shared API client and `VITE_API_BASE_URL`. Keep the API prefix in the URL, for example:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1
```

The backend must be running with MongoDB, JWT, document encryption and private file storage configured. The browser origin must match the backend `CLIENT_ORIGIN`.

Start locally from the repository root:

```powershell
npm run dev:server
npm run dev:client
```

## Verification

```powershell
npm run test:client
npm run build:client
npm run test:server
```

GitHub Actions also runs the frontend test/build workflow and the backend test workflow on pushes to `main` and pull requests.

## Still outside this phase

- Dashboard analytics UI for Sales Staff.
- Full backend integration of the Bill Analysis, Pricing & Subsidy, Quotation Builder and Project Tracker feature repositories.
- Homeowner profile update endpoint, persisted contact/notification preferences and support-ticket endpoint.
- Homeowner quotation acceptance/change request endpoint.
- Site visit/appointment scheduling and real outbound notifications.
- Full browser end-to-end verification against a deployed environment.
