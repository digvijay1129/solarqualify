# SolarQualify — Phase 3.9 Homeowner Portal

This phase adds the six homeowner-facing UI modules designed from the generated references.

## Included modules

1. **Homeowner Dashboard** — demo summary, project progress, activity and quick actions.
2. **Lead Submission & Electricity Bill Upload** — five-step inquiry wizard with field validation and local bill file selection.
3. **Project Status & Tracking** — milestone timeline, sample project summary and upcoming tasks.
4. **Quotations** — quotation list/detail, system assumptions, pricing-pending states, demo accept/request-changes interactions.
5. **Document Management** — category views, search/filter, local file metadata additions and honest unavailable-download states.
6. **Profile & Support** — profile edit form, contact and notification preferences, FAQ accordions, support request form.

## Stack

React + JavaScript + React Router + Tailwind CSS + Lucide React. All implementation files use `.js` or `.jsx`; no TypeScript is introduced.

## Integration

Follow `INTEGRATION.md` for exact router imports, route block, required existing asset, and URLs.

## Demo boundary

All records are sample fixture data. Form submissions, profile edits, uploaded-file metadata, quote decisions, preferences and support messages exist only in the current mounted page session. Files are not uploaded, OCR is not run, and external messages, notifications, payments, contracts or installer events are not triggered. Download actions are disabled when there is no real attached file.

The system generation display uses the project-brief assumption of 1,400 units per kW per year and is labelled illustrative, not guaranteed. Quotation equipment and installation prices remain pending approved pricing. The ₹78,000 3 kW subsidy display follows the brief's unverified demo rule and is not an eligibility determination.

## Automated tests

`homeowner-portal.test.js` covers generation, pricing placeholders, contact and lead wizard validation, upload checks, profile validation, support messages, document filters, milestone progress and file-size formatting.
