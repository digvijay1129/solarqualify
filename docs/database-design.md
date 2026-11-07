# SolarQualify – MongoDB Database Design

## 1. Database Overview

Database: MongoDB

ODM: Mongoose

The application will use a document-based data model.

Each major business entity will have its own collection.

MongoDB ObjectId references will connect related documents.

## 2. Collections

### 2.1 users

Stores registered homeowners and sales staff.

Fields:
- _id: ObjectId
- name: String
- email: String (unique)
- passwordHash: String
- role: homeowner or salesStaff
- phone: String
- isActive: Boolean
- createdAt: Date
- updatedAt: Date

The password field will store only a password hash.

### 2.2 leads

Stores customer enquiries and property information.

Fields:
- _id: ObjectId
- homeownerId: ObjectId reference to users
- assignedSalesStaffId: ObjectId reference to users
- customerName: String
- phone: String
- ownership: owner or tenant
- roofType: String
- roofArea: Number
- monthlyElectricityBill: Number
- monthlyUnits: Number
- pincode: String
- billAnalysisId: ObjectId reference to billAnalyses
- leadScore: Number
- leadPriority: high, medium or low
- scoreReasons: Array
- leadStatus: String
- consent: Object
- createdAt: Date
- updatedAt: Date

Lead status will be managed separately from project status.

### 2.3 billAnalyses

Stores electricity bill extraction and verification records.

Fields:
- _id: ObjectId
- leadId: ObjectId reference to leads
- documentKey: String
- documentType: String
- extractedText: String
- consumerNumber: String
- tariff: String
- sanctionedLoad: Number
- monthlyUnits: Number
- extractionConfidence: Object
- verificationStatus: pending, needsReview or verified
- corrections: Array
- reviewedBy: ObjectId reference to users
- reviewedAt: Date
- createdAt: Date

Sensitive document data and consumer information must be protected.

### 2.4 pricingRules

Stores solar equipment and installation pricing.

Fields:
- _id: ObjectId
- ruleName: String
- pricePerKW: Number
- installationCharges: Number
- effectiveFrom: Date
- effectiveTo: Date or null
- version: Number
- status: active or inactive
- createdBy: ObjectId reference to users
- createdAt: Date

Historical rules must remain available.

Overlapping effective periods for applicable pricing rules must be prevented.

### 2.5 subsidyRules

Stores configurable subsidy slabs.

Fields:
- _id: ObjectId
- ruleName: String
- slabs: Array of subsidy slab objects
- maximumSubsidy: Number
- effectiveFrom: Date
- effectiveTo: Date or null
- version: Number
- verificationStatus: unverified or verified
- status: active or inactive
- createdAt: Date

The initial subsidy values from the client brief will be stored as an unverified demonstration rule.

### 2.6 generationRules

Stores annual solar generation assumptions.

Fields:
- _id: ObjectId
- ruleName: String
- unitsPerKWPerYear: Number
- effectiveFrom: Date
- effectiveTo: Date or null
- version: Number
- status: active or inactive
- createdAt: Date

The initial client-provided assumption is 1,400 units per kW per year.

### 2.7 quotations

Stores generated solar quotations.

Fields:
- _id: ObjectId
- leadId: ObjectId reference to leads
- createdBy: ObjectId reference to users
- systemCapacityKW: Number
- estimatedAnnualGeneration: Number
- totalInstallationCost: Number
- applicableSubsidy: Number
- netInstallationCost: Number
- estimatedAnnualSavings: Number
- estimatedPaybackYears: Number
- pricingRuleSnapshot: Object
- subsidyRuleSnapshot: Object
- generationRuleSnapshot: Object
- calculationInputs: Object
- pdfDocumentKey: String
- quotationStatus: draft, issued or accepted
- createdAt: Date

Every quotation must preserve the exact rule values and calculation inputs used when it was generated.

Previously generated quotations must not change when future master rates are updated.

### 2.8 projects

Stores installation progress.

Fields:
- _id: ObjectId
- leadId: ObjectId reference to leads
- quotationId: ObjectId reference to quotations
- assignedSalesStaffId: ObjectId reference to users
- currentStage: String
- milestoneHistory: Array
- projectDocuments: Array
- statusTokenHash: String
- createdAt: Date
- updatedAt: Date

Project stages will represent internal installation progress.

The customer-facing status link will not expose private electricity bills or sensitive customer information.

### 2.9 auditLogs

Records important system activities.

Fields:
- _id: ObjectId
- actorId: ObjectId reference to users
- action: String
- resourceType: String
- resourceId: ObjectId
- metadata: Object
- createdAt: Date

Passwords, authentication tokens and complete electricity bills must not be recorded in audit logs.

### 2.10 notificationLogs

Stores notification simulation records.

Fields:
- _id: ObjectId
- projectId: ObjectId reference to projects
- recipientId: ObjectId reference to users
- channel: sms or whatsapp
- messageType: String
- deliveryStatus: simulated, queued, sent or failed
- createdAt: Date

These records will represent simulated notifications during the demonstration.

## 3. Collection Relationships

- One homeowner can submit multiple leads.
- A lead can have multiple bill analysis records.
- A lead can have multiple quotations.
- A lead can have at most one active project in the initial implementation.
- A project belongs to one lead.
- A project references its selected quotation.
- One user can generate multiple audit log records.
- A project can have multiple notification records.

## 4. Important Indexes

The following indexes will be considered:

### users
- Unique index on normalized email.

### leads
- Index on homeownerId.
- Index on assignedSalesStaffId.
- Index on leadStatus.
- Index on createdAt.

### billAnalyses
- Index on leadId.
- Index on verificationStatus.

### pricingRules
- Index on effectiveFrom and effectiveTo.
- Index on status.

### subsidyRules
- Index on effectiveFrom and effectiveTo.
- Index on status.

### generationRules
- Index on effectiveFrom and effectiveTo.
- Index on status.

### quotations
- Index on leadId.
- Index on createdAt.

### projects
- Index on leadId.
- Index on currentStage.

### auditLogs
- Index on actorId.
- Index on resourceType and resourceId.
- Index on createdAt.

### notificationLogs
- Index on projectId.
- Index on deliveryStatus.

## 5. Data Integrity

- Validate required fields before database writes.
- Validate referenced user and lead records.
- Enforce unique normalized email addresses.
- Prevent overlapping effective periods for applicable master rules.
- Preserve historical quotation snapshots.
- Do not allow homeowners to access another homeowner's records.
- Restrict master rule changes to authorized sales staff.
- Record important staff actions.

## 6. Security Considerations

- Use bcrypt password hashes.
- Protect sensitive customer information.
- Store electricity bills in private object storage.
- Store document object keys rather than public document URLs.
- Use authorized access for document downloads.
- Store only hashes of customer status-link tokens.
- Never commit real customer data to GitHub.

## 7. Data Retention

Document retention and deletion policies must be finalized according to the business requirements and applicable privacy obligations.

Temporary uploaded documents must not be kept indefinitely.

## 8. Database Design Status

This document describes the planned database structure.

Mongoose schemas, indexes and database operations will be implemented during the backend development phase.