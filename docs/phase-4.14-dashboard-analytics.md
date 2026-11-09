# Phase 4.14 — Dashboard Analytics and Reporting APIs

## Scope

This phase adds a live, role-scoped analytics endpoint backed by MongoDB aggregations. It does not use frontend fixtures or hard-coded business counts.

## API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Authenticated Homeowner / Sales Staff | Retrieve date-filtered dashboard analytics |

Optional query parameters:

- `startDate`: inclusive UTC calendar date in `YYYY-MM-DD` format.
- `endDate`: inclusive UTC calendar date in `YYYY-MM-DD` format.

When omitted, the report defaults to the current month and the previous eleven calendar months. The maximum supported range is 24 calendar months. The end date includes the complete UTC day.

## Role-based scope

- Homeowners see records belonging to their own homeowner account.
- Sales Staff see leads assigned to them and currently unassigned homeowner leads, matching the lead-list visibility policy. Quotation analytics include quotations for those visible leads.
- Sales Staff project metrics include projects assigned to that staff member.
- Homeowner project metrics include projects linked to their homeowner account.

Unauthorized roles receive HTTP 403. The API never returns customer names, contact details, bill contents, quotation line-item snapshots or other unnecessary personal information.

## Returned analytics

### Leads

- Total leads created in the date range.
- Current qualified and converted counts for those leads.
- Qualification and conversion rates, calculated as a percentage of total leads.
- Low, medium and high priority distribution.
- Monthly lead creation trend, with total, currently qualified and currently converted counts.

The lead schema does not preserve status-transition history. Qualified and converted figures therefore describe the current status of leads created in the selected period; they are not counts of status changes that occurred during that period.

### Quotations

- Total quotation records and draft calculation records.
- Formal generated, sent, accepted, rejected and expired counts.
- Acceptance rate: accepted formal quotations divided by all formal generated quotations in the date range.
- Generated quotation value estimate: sum of saved net installation costs for formal quotations.
- Accepted quotation value estimate: sum of saved net installation costs for accepted quotations.

Quotation metrics are filtered by quotation creation date and the current access scope of their parent lead. Each quotation is counted as a record; multiple quotation versions for one lead are not deduplicated.

### Projects

- Total, active, on-hold, completed and cancelled projects.
- Current stage distribution across the eight project stages.
- Current project-status distribution.

Project metrics use project creation date for the selected cohort. The stage distribution describes the project's current stage, not the historical number of stage transitions.

### Financial reporting

All quoted values are expressed in INR and sourced from the saved `netInstallationCost` values.

The application has no payment, invoice or receipt collection. The API therefore returns `realizedRevenue: null` and `realizedRevenueStatus: not_tracked`. Generated and accepted quotation values are estimates, not received cash, recognized accounting revenue or guaranteed business income.

## Date and metric definitions

The date range is inclusive and uses UTC calendar days. Leads are filtered by lead `createdAt`, quotations by quotation `createdAt`, and projects by project `createdAt`. Monthly lead trends use UTC calendar months and return zero-filled months within the selected range.

Rates are percentages rounded to two decimal places. Empty denominators produce a rate of zero rather than a divide-by-zero error.

All summaries and distributions are generated from live records by MongoDB aggregation pipelines. No analytics snapshots or precomputed counters are written by this phase.
