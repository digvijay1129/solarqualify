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

- `client/` contains the React frontend.
- `server/` contains the Node.js backend.
- `docs/` contains project architecture and design documentation.

## Core Workflow

1. Homeowner registers or signs in.
2. Homeowner submits a solar enquiry.
3. Homeowner uploads an electricity bill.
4. OCR extracts relevant information.
5. Sales Staff verifies extracted values.
6. The system calculates lead priority and recommended solar capacity.
7. Sales Staff generates a quotation.
8. Customer and staff track installation progress.

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

Backend development through Phase 4.14 is implemented in the repository:

- Secure electricity bill upload, OCR and manual verification.
- Explainable lead qualification and versioned business rules.
- Deterministic solar calculations and quotation PDF generation.
- Project lifecycle, public status links, simulated notifications and audit logs.
- Role-scoped MongoDB dashboard analytics and reporting APIs.

**Phase 4.15.1–4.15.4 are implemented:** shared API infrastructure and authentication; protected homeowner and Sales Staff routes; live homeowner dashboard, solar enquiry submission, private bill upload/OCR, quotation history/PDF download and project tracking; plus Sales Staff lead listing, server-side search/filters/pagination, lead details, self-assignment and explainable scoring.

The remaining Sales Staff dashboard, Bill Analysis, Pricing & Subsidy, Quotation Builder and Project Tracker feature repositories still need their full UI/API migration. Some homeowner profile, support and preference interactions also remain session-only. See the Phase 4.15 documentation for exact endpoint mapping and limitations.

- [Phase 4.15.1–4.15.2 API and Authentication](docs/phase-4.15-api-authentication/README.md)
- [Phase 4.15.3–4.15.4 Homeowner and Lead Management](docs/phase-4.15.3-4.15.4-homeowner-leads/README.md)

## Assumptions and Limitations

All implementation assumptions, calculation rules and known limitations are documented in `docs/assumptions.md` and the phase documents.

## License

This project is developed as an individual software engineering internship take-home assignment.
