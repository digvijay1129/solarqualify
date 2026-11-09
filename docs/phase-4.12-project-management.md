# Phase 4.12 — Project Management and Tracking

## Purpose

This phase implements a project lifecycle from an accepted quotation. A unique project is created for each accepted quotation and stores lead, quotation, customer, system and financial snapshots. Project progress is tracked through ordered milestones and an append-only event history.

## Project stages

1. `site_survey`
2. `system_design`
3. `customer_approval`
4. `installation_scheduled`
5. `installation_in_progress`
6. `inspection`
7. `net_metering`
8. `completed`

The initial project starts at `site_survey` with that milestone in progress and later milestones pending. Sales Staff can update only the current milestone. A milestone can move from pending to in progress/skipped and from in progress to completed/skipped. Completing or skipping a stage advances the current stage by one. The final completed milestone marks the project completed. Completed and cancelled projects are terminal.

Project status values are `active`, `on_hold`, `completed` and `cancelled`. Putting a project on hold or cancelling it requires a note. An on-hold project can be resumed to active. Milestone changes are blocked while a project is on hold.

The current milestone array stores the latest state of each stage; the separate `projectHistory` array is append-only and records project creation, milestone updates, status transitions and public-token operations.

## APIs

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/quotations/:quotationId/project` | Assigned Sales Staff | Create project from accepted quotation |
| GET | `/api/v1/projects` | Homeowner / Sales Staff | List scoped projects |
| GET | `/api/v1/projects/:projectId` | Homeowner / assigned Sales Staff | Project detail and event history |
| PATCH | `/api/v1/projects/:projectId/status` | Assigned Sales Staff | Update milestone or operational status |
| POST | `/api/v1/projects/:projectId/public-status-token` | Authorized project owner/staff | Issue or rotate public status token |
| DELETE | `/api/v1/projects/:projectId/public-status-token` | Authorized project owner/staff | Revoke public status token |
| GET | `/api/v1/public/project-status/:token` | Public bearer token | Limited status view without JWT |

Project list filters support `status`, `stage`, `page` and `pageSize`.

Project creation requires quotation status `accepted`, the quotation's lead to be assigned to the requesting Sales Staff member, and no existing project for that quotation. A project is unique per quotation. Leads created directly by Sales Staff may have no linked homeowner account; those projects remain accessible to the assigned Sales Staff member and are not placed in a homeowner's project list until a homeowner account is linked.

## Public status token security

A public status link is issued as a cryptographically random 32-byte base64url token. Only its SHA-256 hash is stored. The plaintext token is returned once to the authorized caller. Issuing another token rotates and invalidates the previous token. Tokens expire after 90 days and can be explicitly revoked.

The public endpoint does not require JWT authentication. It returns only a generated project reference, current stage, project status, milestone stage/status and timestamps. It does not return customer name, email, phone, address, quotation values, internal notes, staff identifiers, project documents or token metadata. Invalid, expired and revoked links all return the same not-found response. Public responses are no-store and no-referrer; the HTTP access log redacts the token path.

## Access control and concurrency

Homeowners can read projects only when `homeownerId` matches their user ID. Sales Staff can read and update projects only when `assignedSalesStaffId` matches their user ID. Only Sales Staff can create projects or update operational status. Public access is granted only by the bearer token.

Milestone and status updates use the project's `updatedAt` value as an optimistic concurrency condition, preventing a stale update from overwriting a newer project update.

## Limitations

This phase adds lifecycle tracking and a safe public status view. It does not add project document upload or installation scheduling/calendar integration; the existing project document schema remains available for a later document workflow.
