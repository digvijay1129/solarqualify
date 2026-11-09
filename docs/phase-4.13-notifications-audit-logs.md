# Phase 4.13 — Notifications and Audit Log APIs

## Scope

This phase adds simulated in-app notifications for project lifecycle events and authorized retrieval of notification and audit history. It does not send SMS, WhatsApp or email messages and does not connect to an external messaging provider.

## APIs

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/projects/:projectId/notifications` | Project homeowner / assigned Sales Staff | Retrieve project notification history |
| GET | `/api/v1/audit-logs` | Authenticated Sales Staff | Retrieve the caller's authorized audit events |

Both endpoints support `page` and `pageSize`. Notification history defaults to 20 records per page and supports a maximum page size of 100. Audit logs support `page`, `pageSize`, `action`, `resourceType` and `projectId`.

## Simulated notification lifecycle

The server creates in-app notification records when a project is created, when a milestone is updated, and when the project operational status changes. Notifications are addressed to linked project recipients: the homeowner account (when present) and the assigned Sales Staff member.

Each notification records:

- Project and recipient references.
- The actor who triggered the event, when applicable.
- Event type, safe system-generated title and message.
- Channel `in_app`.
- Delivery status `simulated` and simulation timestamp.

The message is generated from a fixed event template and the stage/status values. The notification service does not accept arbitrary message text. It never contacts an SMS or WhatsApp provider. SMS and WhatsApp are deliberately outside this phase.

Homeowners see only notification records addressed to their own account. Assigned Sales Staff can see the notification history for projects assigned to them. Project access is checked before the notification query is executed.

## Audit events

The audit service records allowlisted project events:

- `PROJECT_CREATED`
- `PROJECT_MILESTONE_UPDATED`
- `PROJECT_STATUS_CHANGED`
- `PROJECT_PUBLIC_TOKEN_ISSUED`
- `PROJECT_PUBLIC_TOKEN_REVOKED`

Existing bill audit events remain supported, including upload, download request, deletion, OCR and manual verification actions.

Audit records include actor, action, resource type/ID, safe metadata and immutable creation time. The service accepts only known actions and resource types. Metadata uses an explicit allowlist of identifiers, document metadata and status fields. The audit model also sanitizes metadata on assignment so direct model writes cannot add arbitrary fields such as passwords, access tokens, public status tokens, free-form notes, signed URLs, encryption keys or extracted electricity-bill contents.

Audit retrieval is limited to the authenticated Sales Staff member's own recorded actions. A project filter is accepted only after checking that the project is currently assigned to the requesting staff member. Homeowners and unsupported roles receive a 403 response.

## Delivery and failure semantics

`simulated` means the application persisted a notification record to represent an in-app delivery event; it does not mean an SMS, WhatsApp or external message was sent or delivered. Notification status is not presented as a real provider receipt.

Project lifecycle state and project history remain the primary record of stage/status changes. Audit and notification records are separate operational records. These writes are performed after the project state update, not as a cross-collection MongoDB transaction; an operational-record write failure can therefore occur after the project state has already changed.

## Privacy rules

The notification templates contain only project lifecycle information and never include complete electricity bill text, document contents, credentials, public tokens or free-form project notes.

Audit metadata is restricted to approved scalar fields. Passwords, tokens, encryption keys, signed URLs, complete electricity-bill contents and free-form notes are excluded from persisted or returned audit metadata.
