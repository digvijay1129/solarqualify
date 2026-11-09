# Phase 4.15.7–4.15.8 — Quotation and Project API Integration

This phase replaces the Quotation Builder and Project Tracker demo repositories with the existing authenticated SolarQualify APIs. No backend route, model or business rule was added or modified.

## Phase 4.15.7 — Quotation Integration

### Live quotation workflow

1. The page loads the signed-in Sales Staff lead queue (first 20 records) and the effective pricing, subsidy and generation rules.
2. The user selects a lead. The client retrieves its authorized details and saved qualification result.
3. The user claims or confirms the lead assignment using PATCH /leads/:leadId/assignment.
4. Quotation readiness checks require a qualified lead with a saved score, one unique active pricing rule and one unique active generation rule. Any overlapping active rules are shown as a conflict.
5. A verified active subsidy rule is included when one exists. If no verified active subsidy rule exists, the subsidy rule ID is omitted and the backend's optional subsidy behavior calculates zero subsidy.
6. The client submits POST /leads/:leadId/quotations with the effective date and selected rule IDs. The backend calculates recommended capacity, generation, costs, subsidy, savings and payback, then stores a formal generated quotation and immutable rule snapshots.
7. The UI shows the saved server result and its explanation reasons.
8. The saved quotation list is loaded with GET /leads/:leadId/quotations?limit=20.
9. PDF files are downloaded with GET /quotations/:quotationId/pdf as a private binary response.

### Readiness and calculation authority

The frontend does not accept a manually typed system size or invent a price. The backend uses the selected lead's monthly units, a manually verified electricity bill when available, the active pricing and generation rules, and a verified active subsidy rule when one exists. The saved server result is authoritative.

Quotation generation requires the backend lead status to be qualified and a completed score. The frontend displays the saved score but does not treat a score as an automatic rejection decision.

### Current API boundary

The backend creates a formal quotation in one operation. It does not expose a separate quotation draft-save or send-quotation endpoint. The homeowner decision endpoint PATCH /quotations/:quotationId/decision allows the owning homeowner to accept or reject a generated/sent quotation; the decision timestamp is persisted. Sales Staff can then create a project from an accepted quotation. The former local-only “Save Draft” action was removed rather than presented as persisted functionality.

The quotation list shows records for the selected lead. The backend returns immutable pricing, subsidy and generation snapshots, so later rule edits do not rewrite previously issued quotation records.

## Phase 4.15.8 — Project Integration

### Project list and filters

The page loads projects through GET /projects?page=&pageSize=&status=&stage=. The backend scopes Sales Staff to project records assigned to the signed-in Sales Staff account; it does not provide a company-wide project directory to ordinary Sales Staff. The UI supports the server's status and current-stage filters and server pagination.

The project metrics and stage distribution explicitly describe the current API result page. The current project API does not expose location, free-text, due-date or portfolio-analytics filters, so those earlier demo filters and global portfolio figures have been removed.

### Project details and lifecycle

- GET /projects/:projectId retrieves the selected authorized project with its milestone and history records.
- PATCH /projects/:projectId/status saves milestone and project-status transitions.
- Milestones must be updated in order. The UI offers only the valid next transition for the current milestone and relies on the backend for final validation.
- Project status actions support active → on_hold, on_hold → active, active/on_hold → cancelled. Completed and cancelled projects are terminal.
- The backend writes audit events and simulated in-app notification records after lifecycle updates.
- GET /projects/:projectId/notifications reads persisted notification history.

### Customer tracking links

The Project Tracker can issue and revoke public status tokens using POST /projects/:projectId/public-status-token and DELETE /projects/:projectId/public-status-token.

The issued link points to the frontend route /project-status/:token. That page calls GET /public/project-status/:token without a user access token and displays the public project reference, current status and milestone progress. The backend token expires after 90 days. The token is returned only at issue/rotation and is not retrievable after a page refresh; copy and share the link at issuance time. Issuing a new link rotates the previous token.

The public customer page intentionally exposes only the project progress DTO returned by the public API; it does not expose customer contact data, quotations, bills or internal audit records.

### Current API boundary

The current backend does not expose project-document upload/download or free-form project-note write endpoints. Those demo-only actions have been removed from the operational Project Tracker. The UI presents the actual persisted project history and simulated notification feed instead.

The backend does not expose a due date or geocoded coordinates in its project DTO. These fields are not fabricated in the live project tracker.

## Local configuration

The frontend API base URL must include /api/v1, for example:

~~~env
VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1
~~~

Run the app from the repository root:

~~~powershell
npm run dev:server
npm run dev:client
~~~

The backend requires its normal MongoDB, JWT, document encryption and private storage environment variables. CLIENT_ORIGIN must permit the frontend browser origin.

## Verification

~~~powershell
npm run test:client
npm run build:client
npm run test:server
~~~

New tests cover quotation lead/rule loading, qualification context, formal quotation payloads, saved history, PDF download, project DTO mapping, list filters/pagination, detail retrieval, lifecycle updates, notification history, public status lookup and tracking-link issue/revoke.

## Remaining Phase 4.15 work

The Sales Staff Dashboard Analytics screen has not yet been migrated from its demo repository. Project document upload and free-form notes also remain out of scope because the current backend has no corresponding endpoints. The remaining dashboard integration and a full browser end-to-end run against deployed services should be completed before release.
