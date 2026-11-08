# SolarQualify – REST API Design

## 1. API Overview

Backend: Node.js + Express.js

API style: REST

Base URL:
- Local: http://localhost:5000/api/v1
- Production: To be configured during deployment.

All API endpoints will use the `/api/v1` prefix.

The backend will return JSON responses except for file upload and PDF download endpoints.

## 2. Authentication APIs

| Method | Endpoint | Description | Access |
| POST | /auth/register | Register homeowner | Public |
| POST | /auth/login | User login | Public |
| POST | /auth/logout | Logout | Authenticated |
| GET | /auth/me | Get current user | Authenticated |

Public registration will create homeowner accounts only.

Sales staff accounts will be provisioned through a controlled process.

## 3. Lead Management APIs

All Leads endpoints require JWT authentication.

### 3.1 Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | /leads | Create a customer lead | Homeowner / Sales Staff |
| GET | /leads | List permitted leads | Homeowner / Sales Staff |
| GET | /leads/overview | Retrieve lead overview and KPI counts | Homeowner / Sales Staff |
| GET | /leads/:leadId | Retrieve lead details | Authorized User |
| PATCH | /leads/:leadId | Update permitted lead fields | Authorized User |
| PATCH | /leads/:leadId/assignment | Assign lead to Sales Staff | Sales Staff |

### 3.2 Lead Creation

Required fields:

- customerName
- email
- phone
- propertyAddress
- consent

Optional fields:

- propertyType
- ownership
- monthlyElectricityBill
- monthlyUnits

The consent field must explicitly be `true`.

Homeowner-created leads are associated with the authenticated homeowner.

Sales Staff-created leads are initially assigned to the authenticated Sales Staff member.

The backend controls homeowner ID, staff assignment, priority, status,
lead score and recommended system capacity. These values must not be
accepted as trusted client input during lead creation.

### 3.3 Lead Listing and Filtering

Supported query parameters:

| Parameter | Description | Supported values |
|---|---|---|
| status | Filter by status | all, new, qualified, in-progress, contacted, quotation_created, converted, lost |
| priority | Filter by priority | all, low, medium, high |
| location | Filter by property location | all, not-provided, or location text |
| search | Search lead information | Name, reference ID, phone, email or address |
| page | Page number | Positive integer |
| pageSize | Records per page | 5, 10 or 20 |

The `in-progress` filter includes both `contacted` and
`quotation_created` database statuses.

Homeowners can retrieve only their own records.

Sales Staff can retrieve only records currently assigned to them.

### 3.4 Lead List Response

The successful response contains:

- `items`: array of lead records.
- `pagination`: page, pageSize, totalItems and totalPages.

Lead records expose:

- id
- referenceId
- name
- email
- phone
- location
- propertyType
- ownership
- monthlyBill
- monthlyUnits
- recommendedSystemKw
- priority and priorityCode
- status and statusCode
- createdAt and updatedAt

The API translates database status and priority codes into frontend
display labels. Database status values remain unchanged.

### 3.5 Lead Overview

GET `/leads/overview` returns live MongoDB counts for:

- Total leads
- New leads
- Qualified leads
- In-progress leads
- Converted leads
- Lost leads

Overview counts are scoped to the authenticated user's permitted records.

Growth percentages remain `null` until sufficient historical comparison
data is available. Demonstration percentages must not be presented as
verified company performance.

### 3.6 Lead Updates

PATCH `/leads/:leadId` accepts only permitted fields.

Homeowners may update their own customer and property information.

Sales Staff may update permitted customer and property information,
lead status and priority for records assigned to them.

Ownership IDs, staff assignment IDs, lead scores and recommended system
capacity cannot be changed through the general update endpoint.

### 3.7 Lead Assignment

PATCH `/leads/:leadId/assignment` requires Sales Staff authorization.

Request body:

- `salesStaffId`: ID of an active user whose role is `salesStaff`.

A Sales Staff member can reassign a lead only when the lead is within
their current authorized assignment scope.

The server validates the target account using MongoDB. Inactive users
and users with other roles cannot receive lead assignments.

### 3.8 Lead Security and Data Integrity

- Every lead must belong to a homeowner or have a Sales Staff assignment.
- Homeowner access is restricted by `homeownerId`.
- Sales Staff access is restricted by `assignedSalesStaffId`.
- Resource ownership and assignment are checked in database queries.
- Client-supplied ownership and assignment fields are not trusted.
- Search input is escaped before being used in MongoDB regular expressions.
- Invalid status, priority, pagination and field values are rejected.
- Unavailable customer information is not inferred.
## 4. Electricity Bill Analysis APIs

| Method | Endpoint | Description | Access |
| POST | /leads/:leadId/bills | Upload electricity bill | Authorized User |
| GET | /bill-analyses/:analysisId | Get extraction information | Authorized User |
| POST | /bill-analyses/:analysisId/process | Process bill using OCR | Sales Staff |
| PATCH | /bill-analyses/:analysisId/verification | Confirm or correct extracted fields | Sales Staff |

The bill upload endpoint will accept multipart/form-data.

The upload will be validated for permitted file types and file size.

OCR output will include extracted values and available confidence information.

Missing or uncertain information must be reviewed manually.

## 5. Lead Qualification APIs

Lead scoring will use deterministic business rules.

| Method | Endpoint | Description | Access |
| POST | /leads/:leadId/qualify | Calculate or refresh lead score | Sales Staff |
| GET | /leads/:leadId/qualification | Retrieve score and reasons | Authorized User |

Lead scoring will use verified customer and property information.

A low score must not automatically reject a lead.

## 6. Pricing Rule APIs

| Method | Endpoint | Description | Access |
| GET | /pricing-rules | List pricing rules | Sales Staff |
| GET | /pricing-rules/active | Get applicable pricing rule | Sales Staff |
| POST | /pricing-rules | Create new pricing version | Sales Staff |
| GET | /pricing-rules/:ruleId | Get pricing rule details | Sales Staff |

Existing quotation history must not be changed by future pricing updates.

## 7. Subsidy Rule APIs

| Method | Endpoint | Description | Access |
| GET | /subsidy-rules | List subsidy rule versions | Sales Staff |
| GET | /subsidy-rules/active | Get applicable subsidy rule | Sales Staff |
| POST | /subsidy-rules | Create new subsidy version | Sales Staff |
| GET | /subsidy-rules/:ruleId | Get rule details | Sales Staff |

Subsidy rules must contain effective dates and verification status.

Unverified demonstration rules must not be represented as confirmed government policy.

## 8. Generation Rule APIs

| Method | Endpoint | Description | Access |
| GET | /generation-rules | List generation rule versions | Sales Staff |
| POST | /generation-rules | Create generation rule version | Sales Staff |

Generation assumptions must be versioned and retained for historical quotations.

## 9. Quotation APIs

| Method | Endpoint | Description | Access |
| POST | /leads/:leadId/quotations | Generate quotation | Sales Staff |
| GET | /quotations/:quotationId | Get quotation details | Authorized User |
| GET | /quotations/:quotationId/pdf | Download quotation PDF | Authorized User |
| GET | /leads/:leadId/quotations | List quotations for a lead | Authorized User |

Quotation generation requires verified calculation inputs and applicable pricing rules.

The backend will calculate final financial values using fixed JavaScript formulas.

Every generated quotation must save the applicable pricing, subsidy and generation rule snapshots.

## 10. Project Tracking APIs

| Method | Endpoint | Description | Access |
| POST | /quotations/:quotationId/project | Create project from quotation | Sales Staff |
| GET | /projects | List permitted projects | Authenticated |
| GET | /projects/:projectId | Get project information | Authorized User |
| PATCH | /projects/:projectId/status | Update project stage | Sales Staff |
| GET | /public/project-status/:token | View limited public status | Valid Status Token |

Customer-facing status pages must not expose private electricity bills or sensitive personal information.

Status tokens must be random, revocable and stored securely as hashes.

## 11. Notification APIs

Notifications will initially be simulated.

| Method | Endpoint | Description | Access |
| GET | /projects/:projectId/notifications | View notification history | Sales Staff |

Actual WhatsApp and SMS integrations are outside the initial implementation scope.

Notification records will clearly identify simulated delivery.

## 12. Audit Log APIs

| Method | Endpoint | Description | Access |
| GET | /audit-logs | List permitted audit records | Sales Staff |

Important staff actions will be recorded.

Passwords, access tokens and complete electricity bill contents must never be stored in audit logs.

## 13. Standard Response Format

Successful response example:

{
  "success": true,
  "message": "Lead retrieved successfully",
  "data": {
    "leadId": "DEMO-LEAD-001"
  }
}

Error response example:

{
  "success": false,
  "message": "Invalid request",
  "errors": [
    {
      "field": "monthlyUnits",
      "message": "Monthly units must be a positive number"
    }
  ]
}

## 14. HTTP Status Codes

- 200: Successful request.
- 201: Resource created.
- 204: Successful request without response body.
- 400: Invalid request.
- 401: Authentication required.
- 403: Permission denied.
- 404: Resource not found.
- 409: Resource conflict.
- 413: Uploaded file too large.
- 415: Unsupported file type.
- 422: Valid request structure but unacceptable business data.
- 429: Too many requests.
- 500: Internal server error.

## 15. API Security

- Authenticate protected endpoints.
- Enforce authorization on the backend.
- Validate request bodies, parameters and query strings.
- Apply request rate limits.
- Configure CORS for approved frontend origins.
- Use secure authentication cookies and CSRF protection where applicable.
- Validate uploaded document types and size.
- Prevent access to another homeowner's records.
- Keep environment secrets outside the repository.
- Avoid returning unnecessary sensitive information.

## 16. API Integration Strategy

During frontend development, feature services will use dedicated mock repositories.

After backend development:

1. Implement the actual API endpoints.
2. Test backend APIs.
3. Create API repositories in the frontend.
4. Replace mock repository implementations.
5. Validate actual API responses in the UI.
6. Remove demo mock data from the production application.

## 17. API Design Status

This document describes the planned backend API contracts.

The Express routes, controllers, validation and database operations will be implemented during the backend development phase.

### Lead access, ownership, and assignment rules

- Homeowners can access only leads linked to their authenticated homeowner account.
- Homeowner-created leads remain unassigned until a Sales Staff member claims them.
- Sales Staff can list and view leads assigned to themselves and unassigned homeowner leads.
- Sales Staff can update a lead's details, status, and priority only when it is assigned to them.
- Sales Staff can claim an unassigned lead by assigning it to their own authenticated user ID.
- Sales Staff can transfer a lead assigned to themselves to another active Sales Staff member.
- Sales Staff cannot claim an unassigned lead for another staff member or modify a lead assigned to someone else.
- Assignment updates use a conditional database update to prevent concurrent claims. If another staff member claims the lead first, the request returns a conflict response.
- A lead created directly by Sales Staff is assigned to its creator.
- The API derives ownership and assignment from the authenticated user. Client-supplied ownership, assignment, lead score, priority, and status values cannot override server-controlled creation fields.
- Lead list search and filters must always preserve the authenticated user's access scope.