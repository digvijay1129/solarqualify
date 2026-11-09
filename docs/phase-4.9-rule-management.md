# Phase 4.9 — Pricing, Subsidy and Generation Rule Management

## Rule resources

The backend manages three existing Mongoose collections:
- PricingRule: price per kW and installation charges.
- SubsidyRule: capacity slabs, per-kW rates, maximum subsidy and a separate verification status.
- GenerationRule: annual generation units per installed kW.

## Versioning and history

A new version is created under a rule name. The server assigns the next integer version, and assigns `createdBy` from the authenticated Sales Staff account. Clients cannot set either field. New versions default to `draft`. A version's commercial values, rule name and version number are not editable after creation. Historical versions are never deleted by these APIs.

A version can be made active or inactive. An active version can also receive an `effectiveTo` date to close its applicable period without removing the version from history. Effective date periods are inclusive; an end date must be later than the start date.

## Conflict prevention

An activation is rejected when another active version with the same rule name has an overlapping effective period. The check applies both when a version is created directly as active and when a draft/inactive version is activated. Different rule names represent separate rule families and can have separate active periods.

For subsidy rules, activation is blocked until Sales Staff records a `verified` decision. A rejected subsidy is automatically made inactive. Verification and activation are separate operations.

## Access

- Homeowners and Sales Staff can retrieve rule versions and individual version details.
- Only Sales Staff can create versions, change active/inactive status, or verify subsidy rules.
- No new role is introduced; the existing authentication and database-backed role checks are reused.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/rules/pricing` | List pricing versions |
| POST | `/api/v1/rules/pricing` | Create pricing version |
| GET | `/api/v1/rules/pricing/:ruleId` | Retrieve one pricing version |
| PATCH | `/api/v1/rules/pricing/:ruleId/status` | Activate/deactivate or close period |
| GET/POST | `/api/v1/rules/subsidies` | List/create subsidy versions |
| GET | `/api/v1/rules/subsidies/:ruleId` | Retrieve one subsidy version |
| PATCH | `/api/v1/rules/subsidies/:ruleId/status` | Activate/deactivate or close period |
| PATCH | `/api/v1/rules/subsidies/:ruleId/verification` | Verify or reject subsidy policy |
| GET/POST | `/api/v1/rules/generation` | List/create generation versions |
| GET | `/api/v1/rules/generation/:ruleId` | Retrieve one generation version |
| PATCH | `/api/v1/rules/generation/:ruleId/status` | Activate/deactivate or close period |

List endpoints accept optional `ruleName`, `status`, `effectiveOn` and `limit` filters. `effectiveOn` returns versions whose inclusive effective period covers that date, including inactive historical records.

## Example payloads

Pricing:
```json
{
  "ruleName": "Residential Standard",
  "pricePerKW": 65000,
  "installationCharges": 10000,
  "effectiveFrom": "2026-12-01",
  "effectiveTo": null
}
```

Subsidy:
```json
{
  "ruleName": "Residential Subsidy",
  "slabs": [
    { "upToKW": 2, "amountPerKW": 30000 },
    { "upToKW": 3, "amountPerKW": 18000 }
  ],
  "maximumSubsidy": 78000,
  "effectiveFrom": "2026-12-01"
}
```

Generation:
```json
{
  "ruleName": "Standard Annual Generation",
  "unitsPerKWPerYear": 1400,
  "effectiveFrom": "2026-12-01"
}
```

Activate:
```json
{ "status": "active" }
```

Close an existing active rule period while retaining its active historical record:
```json
{
  "status": "active",
  "effectiveTo": "2026-11-30"
}
```

Subsidy verification:
```json
{ "decision": "verified" }
```

## Limitations

These APIs manage the values and lifecycle supplied by the business. They do not independently verify government policy, certify subsidy eligibility, validate tariff eligibility, or infer solar performance. Official subsidy policy must be verified by the business before activation.
