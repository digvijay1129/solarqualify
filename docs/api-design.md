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

| Method | Endpoint | Description | Access |
| POST | /leads | Create customer lead | Homeowner / Sales Staff |
| GET | /leads | List permitted leads | Authenticated |
| GET | /leads/:leadId | Get lead details | Authorized User |
| PATCH | /leads/:leadId | Update permitted lead fields | Authorized User |
| PATCH | /leads/:leadId/assignment | Assign lead to staff | Sales Staff |

Homeowners can access only their own lead records.

Sales staff can access leads within their authorized business scope.

Lead list endpoints will support pagination, search and filtering.

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