# SolarQualify – System Architecture

## 1. Architecture Overview

SolarQualify follows a modular monolithic architecture with a monorepo project structure.

The system consists of:
- React.js frontend
- Node.js and Express.js backend
- MongoDB database
- OCR processing using Tesseract.js
- Private document storage
- PDF quotation generation

All application source code will use JavaScript (ES Modules). TypeScript is not used.

## 2. Architecture Principles

- Separation of frontend and backend responsibilities.
- Modular and reusable business functionality.
- Centralized error handling and input validation.
- Role-based access control.
- Secure handling of customer documents.
- Testable business logic.
- Versioned pricing and subsidy rules.
- Clear separation between development sample data and production data.

## 3. Frontend Architecture

Technology:
- React.js
- Vite
- JavaScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form

Frontend responsibilities:

- Render homeowner and sales staff interfaces.
- Handle navigation and forms.
- Display lead information and dashboards.
- Display OCR-extracted bill information.
- Display solar quotations and project progress.
- Communicate with the backend through API services.

During initial frontend development, dedicated mock repositories will provide synthetic sample data.

After backend integration, API repositories will replace the mock repositories. Production frontend builds will not use demo mock data.

## 4. Backend Architecture

Technology:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt

The backend will follow a modular structure.

Business modules:

- Authentication
- Users
- Leads
- Bill Analysis
- Lead Scoring
- Solar Calculations
- Pricing Rules
- Quotations
- Projects
- Notifications
- Audit Logs

Each module will separate routes, controllers, services, repositories and validation.

## 5. Database Architecture

MongoDB will store:

- User accounts and roles.
- Customer leads.
- Electricity bill analysis records.
- Pricing rules.
- Subsidy rules.
- Generation assumptions.
- Quotations.
- Projects.
- Audit logs.
- Notification records.

Quotation records will preserve snapshots of the applicable pricing and calculation rules.

## 6. AI and Calculation Architecture

### Electricity Bill Analysis

1. Customer uploads an electricity bill.
2. Backend validates the document.
3. The document is processed using Tesseract.js.
4. Text extraction and field parsing are performed.
5. Extracted fields and confidence information are returned.
6. Sales staff reviews and confirms the information.

Uncertain or missing values must be manually reviewed.

### Lead Scoring

Lead scoring will use an explainable weighted rules-based calculation.

The application will show the reasons behind each score.

A low score will not automatically reject a customer.

### Solar Calculations

Solar sizing, generation, subsidy, cost and payback will use deterministic JavaScript formulas.

AI will not calculate final quotation values.

## 7. File Storage

Production customer documents will use private object storage.

Electricity bills and project documents must not be publicly accessible.

Access will require appropriate authorization.

## 8. Security Architecture

- Password hashing.
- JWT-based authentication.
- Role-based access control.
- Input validation.
- Secure file upload validation.
- Private document storage.
- Restricted CORS configuration.
- Audit logging.
- Protection of environment secrets.
- Customer data access restrictions.

## 9. Deployment Architecture

Planned deployment:

- Frontend: Vercel.
- Backend: Render.
- Database: MongoDB Atlas.
- Documents: Private AWS S3 storage.

Deployment configuration will be documented separately.

## 10. Development Strategy

Development will follow these phases:

1. Architecture and project structure.
2. UI/UX design and image generation.
3. Frontend development using synthetic sample data.
4. Backend development.
5. API integration.
6. OCR and calculation implementation.
7. Testing and security.
8. Deployment and documentation.

## 11. Current Implementation Status

This document describes the planned system architecture.

The architecture and initial repository setup are being completed before application functionality is implemented.