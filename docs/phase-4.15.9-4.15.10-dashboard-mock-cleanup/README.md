# Phase 4.15.9–4.15.10 — Dashboard Analytics and Production Mock Cleanup

## Phase 4.15.9 — Dashboard integration

The Sales Staff Dashboard now consumes the existing role-scoped analytics endpoint:

`GET /api/v1/analytics/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

The frontend requests analytics and the latest five authorized leads concurrently. It does not use the old dashboard demo repository or the illustrative dashboard fixture.

### Reporting-period control

The dashboard supports 6, 12 and 24 calendar-month reporting windows. The selected window is sent as explicit UTC date-only query parameters. Changing the selector refetches the dashboard query for that window.

The API date filter is based on record `createdAt`. Lead monthly trends group by lead creation month (UTC); quotation metrics use quotation creation date; project metrics use project creation date.

### KPI cards

| Dashboard KPI | Backend source |
| --- | --- |
| Total Leads | `analytics.leads.totalLeads` |
| High Priority | `analytics.leads.priorityDistribution[key=high]` |
| Quotations Generated | `analytics.quotations.generatedQuotations` |
| Active Projects | `analytics.projects.activeProjects` |

The total-lead sparkline is built from the backend monthly trend. The previous hard-coded growth percentages and demonstration sparklines have been removed. The backend does not supply period-over-period growth, so the UI does not show a fabricated percentage.

### Charts

- Monthly Leads Trend uses `analytics.leads.monthlyTrend`, including total, qualified and converted lead counts by creation month.
- Lead Priority Distribution uses the API priority keys and counts. Missing categories display as zero.

The monthly chart's Y-axis now scales to the retrieved values; it no longer assumes a fixed maximum of 300. The chart period label reflects the selected reporting window.

### Summary information

The dashboard adds live summary blocks for:

- Leads: qualified and converted counts and rates.
- Quotations: generated, sent, accepted, rejected, expired and acceptance rate.
- Projects: total, active, on-hold and completed counts.
- Financials: generated and accepted quotation value estimates, with realized revenue explicitly shown as not tracked.

Recent Leads shows the five most recently created records returned by the authenticated `GET /api/v1/leads?page=1&pageSize=5&status=all` endpoint. This short recent-leads list is independent of the analytics reporting-period selector.

### Analytics caveats preserved in the UI

The dashboard displays the backend reporting notes and does not reinterpret analytics as accounting or historical event data:

1. Lead status counts are current statuses of leads created within the selected period. Historical lead status-transition events are not stored.
2. Monthly lead trends group records by lead creation month (UTC).
3. Quotation totals use quotation creation dates and saved quotation snapshots.
4. Project stage distribution represents current stages of projects created in the selected range.
5. Realized revenue is unavailable because payment and invoice transactions are not tracked. Generated and accepted quotation values are estimates, not cash received.

Lead priority is a follow-up indicator. A low-priority lead is not automatically rejected.

## Phase 4.15.10 — Remove production mock dependencies

### Runtime dependencies removed

- `dashboard.service.js` now calls the analytics API and lead-list API directly. It no longer imports `mocks/repositories/dashboard.repository.js`.
- `authentication.service.js` now contains only API-backed sign-in, homeowner registration, current-session and sign-out methods. It no longer imports `mocks/repositories/authentication.repository.js`.
- The forgot-password screen no longer calls a simulated repository action. It validates the entered email and clearly states that password reset is unsupported by the current backend API.
- Authentication page content has been moved to `features/authentication/constants/authentication-content.js`. The old fixture re-exports this catalogue for tests/reference.
- The project-stage catalogue used by the legacy project utility is now under `features/projects/constants/project-stages.js`. The project fixture re-exports it for tests; the runtime utility no longer imports from the mock fixture directory.
- `VITE_DATA_SOURCE=mock` has been removed from `client/.env.example`. The application no longer uses that environment flag to select a mock data mode.
- Dashboard Quick Actions now navigate to the implemented Lead Management, Bill Analysis and Quotation Builder pages rather than displaying placeholder action messages.

### Fixtures retained

Files under `client/src/mocks/fixtures` and the former local repository implementations remain available as synthetic fixtures/reference material for tests and design comparison. They are not deleted as part of this phase. Active application service paths for authentication, dashboard, homeowner portal, leads, bill analysis, pricing, quotations and projects use the API-backed feature services.

### Explicitly unsupported backend capabilities

This phase does not add new backend capabilities. Password reset, project-document upload and free-form project notes remain unsupported because the current backend does not expose corresponding APIs. Homeowner profile edits, notification/contact preferences and support-message drafts remain browser-session state and are presented/documented as such; they are not reported as server-persisted.

## Tests and verification

New dashboard service tests cover:

- Reporting-period date range generation and validation.
- Mapping KPI values, monthly trends, priority distribution, quotation/project summaries and quotation value estimates.
- Keeping realized revenue as `null` when the backend does not track it.
- Concurrent retrieval of analytics and recent authorized leads.
- Rejecting demo or missing analytics responses rather than falling back to fixture data.

Run from the repository root:

~~~powershell
npm run test:client
npm run build:client
npm run test:server
~~~

No backend source or analytics API contract was changed for this phase.
