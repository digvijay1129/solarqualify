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
5. Sales staff verifies extracted values.
6. The system calculates lead priority and recommended solar capacity.
7. Sales staff generates a quotation.
8. Customer and staff track project progress.

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
- Static data is used during initial frontend development.
- Static feature repositories are being replaced with backend API repositories during integration.
- OCR results require human verification.
- Solar calculations use fixed formulas, not AI-generated calculations.
- Subsidy and pricing rules are configurable and versioned.
- Sample data is synthetic and must not contain real customer information.

## Project Status

Backend development through Phase 4.14 is implemented in the repository:

- Secure electricity bill upload, OCR and manual verification.
- Explainable lead qualification and versioned business rules.
- Deterministic solar calculations and quotation PDF generation.
- Project lifecycle, public status links, simulated notifications and audit logs.
- Role-scoped MongoDB dashboard analytics and reporting APIs.

**Phase 4.15.1 and 4.15.2 are implemented:** shared frontend API infrastructure, normalized API errors, Bearer-token storage/session restoration, homeowner registration, email/password login, logout, current-user verification, and role-protected homeowner/Sales Staff routes.

The remaining dashboard, leads, bill-analysis, pricing, quotation, project and notification repositories still use illustrative mock data. Feature-level API integration, end-to-end verification, production deployment and final release activities remain in the development roadmap.

See [Phase 4.15 API and Authentication Integration](docs/phase-4.15-api-authentication/README.md) and the other phase documentation in `docs/` for API contracts, assumptions and limitations.

## Assumptions and Limitations

All implementation assumptions, calculation rules and known limitations will be documented in `docs/assumptions.md`.

## License

This project is developed as an individual software engineering internship take-home assignment.
