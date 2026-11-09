# SolarQualify – Assumptions and Constraints

This document separates information explicitly provided in the client brief from implementation assumptions made during development.

Assumptions must not be presented as confirmed client requirements or verified external facts.

## 1. Information Provided by the Client

The following information comes directly from Problem Statement 4.

- Business: Rooftop solar installation company operating across Vidarbha.
- Business location: Nagpur.
- Primary users: Homeowners and sales staff.
- Approximate monthly leads: 1,400.
- Average monthly installations: 120.
- Initial form fields include ownership, roof type, roof area, monthly electricity bill, pincode and bill photo.
- Electricity bill extraction includes consumer number, tariff, sanctioned load and monthly units.
- Solar generation assumption: 1,400 units per kW annually.
- Stated subsidy: ₹30,000 per kW for the first 2 kW, plus ₹18,000 for the third kW, capped at ₹78,000.
- Subsidy rules must be verified before launch.
- Customer information must be protected.
- Marathi and Hindi are required language targets.
- Government subsidy portal integration is outside scope.
- Inventory, purchasing and inverter monitoring are outside scope.
- Notifications may be mocked for the internship demonstration.

## 2. Implementation Assumptions

### A-01: Single Business

The initial application supports one rooftop solar installation business. A development-only seed command creates synthetic accounts, the three brief sample leads and clearly labelled demo pricing/generation/subsidy rules. It refuses to run when NODE_ENV=production.

### A-02: User Roles

Only two application roles are implemented:

- Homeowner
- Sales Staff

A separate administrator role is not introduced because it is not specified in the core build.

Sales staff can manage pricing and subsidy configuration.

### A-03: Authentication

Email and password authentication will be used for the initial demonstration.

This is an implementation choice because the client brief does not specify an authentication method.

### A-04: Pricing Data

The client has not provided actual supplier prices.

Illustrative equipment and installation prices will be stored as clearly labelled sample pricing rules.

They must be replaced with approved business prices before production use.

### A-05: Subsidy Configuration

The subsidy figures in the brief will be used as an unverified demonstration rule.

The applicable subsidy must be independently verified before production use.

### A-06: Lead Scoring

The client has not provided an official lead-scoring formula.

An explainable weighted scoring model will be implemented using ownership, electricity consumption, roof suitability and serviceability.

All scoring weights and thresholds are implementation assumptions.

A low score will never automatically reject a customer.

### A-07: OCR Processing

Tesseract.js will be used for initial bill-image text extraction.

Field parsing and validation will run in JavaScript.

Extracted values must be reviewed and confirmed by sales staff before quotation calculations.

OCR confidence will be derived from available OCR and field-validation signals. It will not be represented as guaranteed extraction accuracy.

### A-08: Bill Upload Formats

The implemented upload pipeline supports PDF, JPEG, PNG and WebP. The server validates file signatures and limits uploads by the configured MAX_UPLOAD_MB setting (5 MB by default). Image OCR uses Tesseract.js; PDF processing uses the dedicated PDF text/OCR pipeline.

### A-09: Generation Calculation

The client-provided assumption of 1,400 units per kW per year will be configurable and versioned.

Actual generation may differ from the estimate.

### A-10: Solar Capacity Recommendation

Recommended capacity is based on annual consumption divided by the configured annual generation per kW, rounded up to a 0.5 kW increment. A manually verified sanctioned load expressed in kW can cap the result. kVA and HP are not converted. Customer-provided roof type, area and pincode are stored and included in the calculation audit snapshot, but are not converted into a capacity cap because the brief supplies no engineering area-to-capacity standard. A technical survey must validate usable roof area, shading, orientation and structural suitability.

The mathematical recommendation is not an engineering installation approval.

### A-11: Customer Notifications

Real WhatsApp and SMS integrations will not be implemented in the initial demonstration.

A notification simulation will record the intended message, channel and status.

### A-12: Project Tracking

Project stages will represent internal business progress.

The application will not directly integrate with payment providers, government portals or DISCOM systems.

### A-13: Demo Customer Data

Only synthetic demonstration records and permitted sample data will be used.

No actual customer electricity bills, consumer numbers, addresses or credentials will be committed to GitHub.

### A-14: Language

The current UI is English-only. Marathi and Hindi were specified as target languages but are not implemented in this take-home build; translation catalogues, language selection and translated accessibility/error copy remain future work.

### A-15: File Storage

Uploaded electricity bills are encrypted with AES-256-GCM before private ImageKit storage. The backend authorizes document access and streams the document through protected routes. The encryption key must be generated per environment, stored only in backend secrets, backed up securely and rotated if exposed.

### A-16: Deployment

Vercel (frontend), Render (API), MongoDB Atlas (database) and ImageKit private storage are the documented deployment targets. No production deployment URL has been verified for this submission.

## 3. Calculation Assumptions

All solar calculations will use deterministic JavaScript formulas.

AI will not generate final quotation values.

### Annual Generation

Annual Generation = System Capacity (kW) × 1,400 units

### Estimated Subsidy

For the demonstration rule:

- First 2 kW: ₹30,000 per kW.
- Third kW: ₹18,000.
- Maximum: ₹78,000.

### Net Installation Cost

Net Cost = Total Installation Cost − Applicable Subsidy

### Estimated Payback

Payback Period = Net Installation Cost ÷ Estimated Annual Savings

These are estimates based on configured inputs and rules.

## 4. Historical Quotation Assumptions

Each quotation will retain:

- Pricing rule version.
- Subsidy rule version.
- Generation rule version.
- System capacity.
- Applicable calculation inputs.
- Calculated costs and totals.
- Quotation creation date.

Changes to future pricing rules must not modify previously generated quotations.

## 5. Security and Privacy Constraints

- Passwords must be hashed.
- Homeowners can access only their own records.
- Sales staff access will be controlled through backend authorization.
- Uploaded electricity bills must not be publicly accessible.
- Secrets must not be stored in GitHub.
- Important staff actions should be recorded.
- Customer documents must use authorized access.
- Synthetic data will be used for development and testing.

## 6. Known Limitations

- OCR accuracy depends on bill image quality and document layout.
- Manual verification remains necessary.
- Lead scores are indicative, not guarantees of customer conversion.
- Generation and payback values are estimates.
- Subsidy figures are not verified production policy.
- Notifications are simulated.
- Government and DISCOM processes are not integrated.
- No real payment processing is included.

## 7. Assumption Management

Whenever a new implementation assumption is introduced:

1. Assign a unique assumption ID.
2. Describe why the assumption is required.
3. Identify its impact on the application.
4. Record whether it has been verified.
5. Update the Technical Design Document before submission.