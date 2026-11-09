# Phase 4.10 — Deterministic Solar Calculation Engine

## Purpose and persistence

Solar calculations are deterministic JavaScript business formulas. They do not use an AI model. Each completed calculation is saved as a draft `Quotation` with immutable snapshots of the exact pricing, subsidy and generation rule versions used. Later rule changes do not recalculate or overwrite past calculations.

## APIs

All endpoints are under `/api/v1/leads`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/:leadId/solar-calculations` | Assigned Sales Staff | Calculate and save a draft quotation |
| GET | `/:leadId/solar-calculations` | Lead's homeowner or assigned Sales Staff | Retrieve calculation history |
| GET | `/:leadId/solar-calculations/:calculationId` | Lead's homeowner or assigned Sales Staff | Retrieve one saved calculation |

The POST payload accepts optional `effectiveOn`, `pricingRuleId`, `subsidyRuleId` and `generationRuleId`. `effectiveOn` defaults to the current UTC date. Selected rules must be active and effective on that date; subsidy rules must also be marked verified. When exactly one applicable active pricing or generation rule exists, it is selected automatically. If multiple candidates exist, the client must specify the intended rule ID. A missing subsidy rule yields a ₹0 subsidy estimate; an explicitly selected unavailable or unverified subsidy rule is rejected.

## Versioned rule inputs

- Pricing: `pricePerKW` and `installationCharges`.
- Generation: `unitsPerKWPerYear`.
- Subsidy: increasing `upToKW` slab limits, each `amountPerKW`, and `maximumSubsidy`.

Rule effective periods are evaluated inclusively. The selected rule IDs, names, versions, values and effective-from/effective-to dates are copied into the quotation snapshots.

## Fixed formulas — calculation version 1.0.0

1. Annual consumption = monthly electricity units × 12.
2. Required capacity (kW) = annual consumption ÷ configured annual units per kW.
3. Recommended capacity = required capacity rounded **up** to the next 0.5 kW increment, with a 0.5 kW minimum.
4. A manually verified bill's sanctioned load caps the recommendation only when its unit is explicitly `kW`. No conversion is assumed for `kVA` or `HP`.
5. Annual generation = recommended capacity × configured annual units per kW.
6. Consumption coverage = minimum(annual generation, annual consumption) ÷ annual consumption × 100.
7. Gross system cost = recommended capacity × configured price per kW + fixed installation charges.
8. Subsidy = sum of the marginal capacity bands: for each slab, eligible kW in that band × its `amountPerKW`. The result is capped by `maximumSubsidy` and gross system cost. Capacity above the final slab's `upToKW` receives no additional slab amount.
9. Net installation cost = maximum(0, gross system cost − subsidy).
10. Implied average bill rate = lead-form monthly bill amount ÷ monthly consumption units.
11. Estimated annual bill offset = minimum(annual generation, annual consumption) × implied average bill rate.
12. Simple payback (years) = net installation cost ÷ estimated annual bill offset.

Money is rounded to two decimal places, generation to whole units, coverage to two decimal places and payback to two decimal places.

## Source selection and constraints

Monthly consumption uses the linked electricity bill only when it is active, OCR-completed and manually verified, and the bill contains a positive monthly unit value. Otherwise it falls back to the lead-form monthly units. A positive monthly consumption value is required.

The lead schema does not store a verified bill amount, so savings uses the lead-form monthly bill amount and the selected consumption units as a blended average-rate proxy. If the monthly bill is unavailable or non-positive, savings and payback are stored as `null`, not fabricated as zero.

The current lead schema has no roof-area, shading, orientation, structural-load, export-credit or tariff-slab fields. The formula therefore reports a consumption-based preliminary capacity only. A verified kW sanctioned-load cap is applied where available; kVA and HP are not converted. The result must be checked against site survey and utility requirements.

## Subsidy and financial limitations

A verified, active subsidy rule is treated as the configured subsidy estimate selected for this calculation; this does **not** independently determine individual government eligibility or prove that the customer meets policy conditions. No verified active subsidy rule means an estimate of ₹0.

Savings and payback are simple estimates. They do not model fixed charges, time-of-day tariffs, export compensation, financing, maintenance, degradation, tariff escalation, taxes or discount rates. They are not a guarantee of actual bill reduction, financial return or solar generation.

## Explainability

Every saved calculation includes a versioned formula and reason entries describing the inputs, formula, plain-language detail and output for consumption, capacity, generation, coverage, cost, subsidy, net cost, savings, payback and material constraints.
