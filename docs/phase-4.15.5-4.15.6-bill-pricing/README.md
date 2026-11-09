# Phase 4.15.5–4.15.6 — Bill Analysis and Business Rule Integration

This phase replaces the Sales Staff Bill Analysis and Pricing & Subsidy mock repositories with authenticated requests to the existing /api/v1 backend. No backend data model or route was changed for this phase.

## Phase 4.15.5 — Bill Analysis

### Live workflow

1. The screen loads the Sales Staff lead queue with GET /leads?page=1&pageSize=20&status=all. Search is submitted as the server-side search query parameter.
2. The user selects a lead and confirms access. The frontend calls PATCH /leads/:leadId/assignment with the current Sales Staff user ID. This can claim an unassigned lead for the current staff account or confirm that an already-assigned lead belongs to the current user.
3. The screen checks bill metadata using GET /leads/:leadId/bill.
4. A selected bill is sent as multipart form data using the required field name bill to POST /leads/:leadId/bill.
5. OCR is started with POST /leads/:leadId/bill/analyze.
6. After successful extraction, the frontend retrieves the Sales Staff review DTO using GET /leads/:leadId/bill/review.
7. The reviewer can correct the fields and submit one final decision using PATCH /leads/:leadId/bill/verification.
8. For a rejected bill, the assigned Sales Staff user can delete the rejected document with DELETE /leads/:leadId/bill and upload a replacement. A final verification decision cannot be edited in place.

### Supported review fields

| API field | Review UI |
|---|---|
| consumerNumber | Consumer Number |
| tariff | Tariff |
| sanctionedLoad | Sanctioned Load |
| sanctionedLoadUnit | kW, kVA or HP |
| monthlyUnits | Monthly Units Consumed |

The UI also displays the backend extractionConfidence, OCR status, verification status, missing fields and review notes. Confidence is shown as a percentage for readability; it is an OCR processor signal, not proof that an extracted value is correct.

### Verification rules

- Only assigned Sales Staff can open the verification DTO and submit a decision. The UI requires a lead claim/assignment confirmation before bill operations.
- A bill must have completed OCR before manual verification.
- A verified bill requires a consumer number, tariff, positive sanctioned load, a supported load unit and a non-negative monthly unit value.
- A rejected bill requires review notes.
- Verification is final for that bill record. To replace a rejected document, delete it and upload a new bill.
- OCR extraction never marks a bill as verified. Downstream lead scoring and solar calculations rely on the backend manually verified bill record.

### File handling

The upload control accepts PDF, JPEG, PNG and WebP files and limits selection to 5 MB, matching the backend default MAX_UPLOAD_MB=5. The server validates file signatures and stores the document encrypted in private object storage. The client downloads the private document only through the authorized bill download endpoint for the preview; it does not use a public storage URL.

The backend setting MAX_UPLOAD_MB can be configured up to 20 MB. If an operator changes it above 5 MB, update the frontend upload limit to match before expecting larger files to be accepted.

## Phase 4.15.6 — Pricing, Subsidy and Generation Rules

### Live rule reads

The page loads the three independently versioned rule histories in parallel:

| Rule | Read endpoint | Business data |
|---|---|---|
| Pricing | GET /rules/pricing?limit=100 | pricePerKW, installationCharges |
| Subsidy | GET /rules/subsidies?limit=100 | Ordered slabs, maximumSubsidy, verificationStatus |
| Generation | GET /rules/generation?limit=100 | unitsPerKWPerYear |

The client selects a single active rule effective on the current date. If multiple active pricing or generation versions overlap, the page surfaces a conflict and does not present a usable active rule for that input. Multiple verified active subsidy rules are also surfaced as a conflict.

### Rule lifecycle and write operations

| Action | Endpoint | Payload |
|---|---|---|
| Create pricing version | POST /rules/pricing | ruleName, effectiveFrom, optional effectiveTo, pricePerKW, installationCharges, status=draft |
| Create subsidy version | POST /rules/subsidies | ruleName, dates, slabs, maximumSubsidy, status=draft |
| Create generation version | POST /rules/generation | ruleName, dates, unitsPerKWPerYear, status=draft |
| Activate / deactivate | PATCH /rules/:ruleType/:ruleId/status | status=active or status=inactive |
| Verify / reject subsidy | PATCH /rules/subsidies/:ruleId/verification | decision=verified or decision=rejected |

The backend assigns the next numeric version number for each rule name; the client does not invent or persist a version label. Rule values and version history are immutable after creation. Only status and the effective-to date may be changed by the status endpoint.

### Pricing model

The actual backend stores one price per kW plus fixed installation charges. For the screen's 1, 2 and 3 kW illustrations:

~~~text
Equipment / module cost = selected capacity × pricePerKW
Gross system cost       = equipment / module cost + installationCharges
~~~

These rows are a display preview derived from the active pricing rule. The backend solar-calculation endpoint remains authoritative and creates its own immutable pricing snapshot when a calculation is generated.

### Subsidy model and safeguards

Subsidy slabs are marginal capacity bands. Each slab applies its amountPerKW to the capacity segment after the previous slab's upper limit, capped by maximumSubsidy. The client preview uses the same slab structure.

A newly created subsidy rule starts unverified and inactive as a draft. Sales Staff must make a final verification decision before the backend permits activation. Rejected rules are forced inactive. The quotation-calculation backend only applies a verified active subsidy rule effective on the requested date; unverified or inactive subsidy values are not applied to quotations.

A verified rule is an internal rule-review state only. It does not confirm an individual homeowner's government eligibility or replace current official MNRE / DISCOM policy validation.

### Generation assumptions

Generation values are loaded only from an active, effective generation rule. When there is no unique active generation rule, the page displays the missing/conflict state rather than silently using the previous illustrative 1,400-unit assumption.

## Local configuration

The frontend must point at the backend API including the version prefix:

~~~env
VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1
~~~

Run the existing workspaces from the repository root:

~~~powershell
npm run dev:server
npm run dev:client
~~~

The backend requires its existing MongoDB, JWT, document-encryption and private ImageKit storage configuration. The browser origin must be allowed by CLIENT_ORIGIN.

## Verification

Run these commands from the repository root:

~~~powershell
npm run test:client
npm run build:client
npm run test:server
~~~

The added frontend service tests cover API paths, multipart field naming, OCR, review and verification payloads, rule listing, rule creation, activation and subsidy verification. The pricing utility tests cover backend slab calculations, rule status and effective-date validation.

## Known scope boundaries

- The bill screen loads the first 20 accessible Sales Staff lead records; users can search the list, and backend lead ownership/assignment restrictions remain authoritative.
- The frontend upload selector is currently capped at 5 MB to match the backend default; deployments configured with a larger upload limit must update the UI limit too.
- Site visits, external utility verification, government subsidy eligibility lookup, supplier integrations and customer outbound notifications are not added by this phase.
- The pricing page displays 1/2/3 kW examples from the single active price-per-kW rule because the backend rule schema has no separate per-capacity price matrix.
- A subsidy verification decision is final for a version. If a rule is rejected, create a new draft version to submit corrected policy data.
- Pricing and generation rule creation and activation are restricted to Sales Staff by the backend.
