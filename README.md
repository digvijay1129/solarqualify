# SolarQualify

AI-Powered Rooftop Solar Lead Qualification, Quotation and Project Tracking System.

## Overview

SolarQualify is a web-based platform designed to help rooftop solar installation businesses manage customer enquiries, analyze electricity bills, qualify potential leads, generate solar quotations and track installation projects.

## User Roles

### Homeowner
- Register and sign in.
- Submit property and electricity consumption details.
- Upload electricity bills.
- Review bill information.
- View solar quotations.
- Track project progress.

### Sales Staff
- View and manage customer leads.
- Review and correct OCR-extracted bill information.
- View explainable lead scores.
- Generate solar quotations.
- Manage pricing and subsidy rules.
- Track installation projects.

## Technology Stack

### Frontend
- React.js
- JavaScript (ES Modules)
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

### AI and Processing
- Tesseract.js for OCR
- JavaScript-based lead scoring
- Fixed solar calculation formulas

### Deployment
- Vercel
- Render
- MongoDB Atlas
- Private object storage

## Architecture

The application follows a modular monolithic architecture.

- client/ contains the React frontend.
- server/ contains the Node.js backend.
- docs/ contains project architecture and design documentation.

## Core Workflow

1. Homeowner registers or signs in.
2. Homeowner submits ownership, roof type/area, PIN code, monthly bill and monthly units.
3. Homeowner uploads an electricity bill (PDF/JPEG/PNG/WebP).
4. OCR extracts consumer number, tariff, sanctioned load and monthly units.
5. Sales Staff reviews and confirms extracted values; OCR output stays unverified until review.
6. The system stores an explainable lead score and a consumption-based capacity recommendation.
7. Sales Staff generates a formal quotation PDF from dated pricing, generation and verified subsidy rules.
8. Staff updates project milestones and can issue a time-limited public customer status link.

## Local demo data

After configuring `server/.env` and starting MongoDB, run `npm run seed:demo`. The command creates synthetic accounts, the three sample leads from the brief, and clearly marked demo pricing/generation/subsidy rules. Local-only demo credentials and exact steps are in [deployment.md](deployment.md). The seed command refuses to run with `NODE_ENV=production`.

## Project Development Approach

Development is organized into phases:

1. Project architecture and folder structure.
2. UI/UX design and image generation.
3. Frontend development using static sample data.
4. Backend development.
5. Frontend and backend integration.
6. OCR, lead scoring and solar calculations.
7. Testing and security.
8. Deployment and documentation.

## Important Notes

- The application is developed using JavaScript only.
- No TypeScript is used.
- Static feature repositories are progressively replaced with backend API repositories during integration.
- OCR results require human verification.
- Solar calculations use fixed formulas and versioned configuration rules, not AI-generated calculations.
- Subsidy and pricing rules are configurable and versioned.
- Sample data is synthetic and must not contain real customer information.

## Project Status

The take-home core is implemented as a role-based React/Express/MongoDB application. This submission adds persisted homeowner roof/PIN inputs, sample-aligned score thresholds (scoring version 1.1.0), calculation audit details for roof constraints, a local-only synthetic demo seeder, and a safe blank document-encryption-key template.

Backend capabilities in the repository include:

- Secure electricity bill upload, OCR and manual verification.
- Explainable lead qualification and versioned business rules.
- Deterministic solar calculations and quotation PDF generation.
- Project lifecycle, public status links, simulated notifications and audit logs.
- Role-scoped MongoDB dashboard analytics and reporting APIs.

Phase 4.15.1–4.15.10 are implemented: shared API infrastructure and authentication; protected homeowner and Sales Staff routes; live homeowner enquiry, bill and quotation workflows; live lead listing, scoring and bill verification; versioned business-rule management; formal quotation generation and PDF downloads; live project lifecycle and customer tracking; plus the Sales Staff dashboard migrated to role-scoped backend analytics. Production dashboard and authentication services no longer import mock repositories. Fixtures and sample repositories remain in the repository for tests and design reference only.

The Sales Staff Dashboard reads live lead, priority, quotation and project analytics, plus recent authorized leads. Its period selector supports 6, 12 and 24 calendar months. The API does not track realized revenue, historical lead status events or period-over-period growth; these are labelled as unavailable rather than inferred. Project document upload and free-form project notes are not available because the current backend has no corresponding endpoints. Some homeowner profile, support and preference interactions remain session-only. See the Phase 4.15 documentation for exact endpoint mapping and limitations.

- Phase 4.15.1–4.15.2 API and Authentication: docs/phase-4.15-api-authentication/README.md
- Phase 4.15.3–4.15.4 Homeowner and Lead Management: docs/phase-4.15.3-4.15.4-homeowner-leads/README.md
- Phase 4.15.5–4.15.6 Bill Analysis and Business Rules: docs/phase-4.15.5-4.15.6-bill-pricing/README.md
- Phase 4.15.7–4.15.8 Quotations and Projects: docs/phase-4.15.7-4.15.8-quotations-projects/README.md
- Phase 4.15.9–4.15.10 Dashboard Analytics and Mock Removal: docs/phase-4.15.9-4.15.10-dashboard-mock-cleanup/README.md

## Submission and known gaps

The Technical Design Document and deployment guide are included in the take-home submission ZIP. No production URL has been verified. Homeowner quotation acceptance/rejection is implemented. Project document upload and direct payment/WhatsApp/SMS delivery remain outside the current API. Server project stages are a simplified internal workflow and do not yet model every requested financial/subsidy event. Marathi and Hindi are not yet implemented. The subsidy rule seeded from the brief is unverified and must not be presented as official eligibility or a production entitlement.

All assumptions, calculation rules and limitations are documented in [docs/assumptions.md](docs/assumptions.md) and the phase integration notes.

## License

This project is developed as an individual software engineering internship take-home assignment.
