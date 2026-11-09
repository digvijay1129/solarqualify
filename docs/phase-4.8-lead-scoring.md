# Phase 4.8 — Explainable Lead Scoring

## Purpose

The lead scoring engine calculates a deterministic 0–100 qualification score from customer, property, electricity consumption and verified bill information. It is a prioritization aid for Homeowner and Sales Staff workflows, not an approval, rejection, subsidy eligibility decision or guaranteed savings estimate.

## Score bands

| Score | Priority |
|---:|---|
| 70–100 | High |
| 40–69 | Medium |
| 0–39 | Low |

A low score never automatically rejects a lead and scoring does not change the lead workflow status.

## Version 1.0.0 scoring rubric

| Signal | Maximum points | Rule |
|---|---:|---|
| Contact completeness | 15 | Proportional points for customer name, email, phone and property address (15 ÷ 4 per completed field). |
| Property ownership | 15 | Owner: 15; tenant: 5; other/unknown: 0. Tenancy is a prompt to confirm owner permissions, not automatic disqualification. |
| Property type | 10 | Residential: 10; commercial: 8; industrial: 6; other/unknown: 0. |
| Monthly electricity bill | 20 | ₹5,000 or more: 20; ₹3,000–4,999: 16; ₹1,500–2,999: 12; greater than ₹0 and below ₹1,500: 6; missing or zero: 0. |
| Monthly electricity units | 15 | 500 or more: 15; 300–499: 12; 150–299: 9; greater than 0 and below 150: 5; missing or zero: 0. Verified bill units take precedence over lead-form units. |
| Manually verified bill | 15 | Awarded only when the bill linked to the lead is active, OCR-completed and manually verified. |
| OCR confidence | 10 | Rounded verified OCR confidence (0–1) × 10. If unavailable, 0 points are awarded. |

The final score is the rounded total, capped at 100.

## Verified-bill eligibility

Only the lead's linked BillAnalysis record is considered. It must satisfy all of the following:
- `deletionStatus = active`
- `ocrStatus = completed`
- `verificationStatus = verified`

Pending, needs-review, rejected, failed, deleting or storage-deleted documents do not contribute verified-bill or OCR-confidence points. OCR-extracted units are not trusted for scoring until the bill is manually verified. Lead-form monthly units may still be used when no eligible verified bill exists, and the response identifies the source.

## API

- `POST /api/v1/leads/:leadId/qualify`: Recalculates and persists score, priority, reasons, data gaps, scoring version, evaluation time and inputs.
- `GET /api/v1/leads/:leadId/qualification`: Returns the last persisted result. It does not recalculate.

Both endpoints require authentication. POST recalculation is restricted to Sales Staff and applies only to leads assigned to the requesting staff member. GET returns the stored result to the lead's homeowner or assigned Sales Staff member. Unassigned leads are not eligible for Sales Staff qualification until claimed/assigned.

## Explainability and limitations

The API returns rule codes, labels, awarded points, maximum points and a plain-language detail for each scoring signal. It also returns missing information as `dataGaps`.

The thresholds and weights are initial product assumptions. They are intentionally deterministic and versioned. They should be reviewed against real operational outcomes before being used as business acceptance criteria. The score does not calculate system capacity, expected savings, subsidy eligibility or quotation price; those are separate later phases.
