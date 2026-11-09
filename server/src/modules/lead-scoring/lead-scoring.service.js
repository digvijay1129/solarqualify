import mongoose from 'mongoose';

import Lead from '../leads/lead.model.js';
import BillAnalysis from '../bills/bill-analysis.model.js';
import { AppError } from '../../shared/errors/AppError.js';

export const LEAD_SCORING_VERSION = '1.0.0';

const PRIORITY_THRESHOLDS = Object.freeze({
  high: 70,
  medium: 40,
});

const SCORE_WEIGHTS = Object.freeze({
  contactCompleteness: 15,
  customerOwnership: 15,
  propertyType: 10,
  electricityBill: 20,
  electricityUsage: 15,
  verifiedBill: 15,
  billConfidence: 10,
});

function requireAuthenticatedUser(user) {
  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !['homeowner', 'salesStaff'].includes(user.role)
  ) {
    throw new AppError('You are not authorized to access lead qualification.', 403);
  }
}

function requireSalesStaff(user) {
  requireAuthenticatedUser(user);

  if (user.role !== 'salesStaff') {
    throw new AppError('Only Sales Staff can qualify leads.', 403);
  }
}

function validateLeadId(leadId) {
  if (!mongoose.isValidObjectId(leadId)) {
    throw new AppError('Invalid lead ID.', 400);
  }
}

function roundScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function addReason(reasons, code, label, points, maxPoints, detail, awarded) {
  reasons.push({
    code,
    label,
    points: awarded,
    maxPoints,
    detail,
  });
}

function calculatePriority(score) {
  if (score >= PRIORITY_THRESHOLDS.high) return 'high';
  if (score >= PRIORITY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

function evaluateLead(lead, bill) {
  const reasons = [];
  const dataGaps = [];
  let score = 0;

  // Customer readiness: contact details needed for follow-up.
  const contactFields = [
    ['customerName', lead.customerName],
    ['email', lead.email],
    ['phone', lead.phone],
    ['propertyAddress', lead.propertyAddress],
  ];
  const completedContacts = contactFields.filter(([, value]) =>
    typeof value === 'string' && value.trim().length > 0
  ).length;
  const contactPoints = roundScore(
    (completedContacts / contactFields.length) * SCORE_WEIGHTS.contactCompleteness
  );
  score += contactPoints;
  addReason(
    reasons,
    'CONTACT_COMPLETENESS',
    'Contact information',
    roundScore(contactPoints),
    SCORE_WEIGHTS.contactCompleteness,
    `${completedContacts} of ${contactFields.length} required contact details are available.`,
    roundScore(contactPoints)
  );
  if (completedContacts < contactFields.length) {
    dataGaps.push('Complete the missing customer contact or property address details.');
  }

  // Ownership is a project-readiness signal, not a legal eligibility decision.
  const ownershipPoints = lead.ownership === 'owner'
    ? SCORE_WEIGHTS.customerOwnership
    : lead.ownership === 'tenant'
      ? 5
      : 0;
  score += ownershipPoints;
  addReason(
    reasons,
    'PROPERTY_OWNERSHIP',
    'Property ownership',
    ownershipPoints,
    SCORE_WEIGHTS.customerOwnership,
    lead.ownership === 'owner'
      ? 'Customer is recorded as the property owner.'
      : lead.ownership === 'tenant'
        ? 'Customer is recorded as a tenant; confirm owner consent and installation permissions.'
        : 'Property ownership is not confirmed.',
    ownershipPoints
  );
  if (lead.ownership !== 'owner') {
    dataGaps.push('Confirm property ownership and any required owner consent.');
  }

  // Property type is a broad suitability indicator only.
  const propertyPoints = lead.propertyType === 'residential'
    ? SCORE_WEIGHTS.propertyType
    : lead.propertyType === 'commercial'
      ? 8
      : lead.propertyType === 'industrial'
        ? 6
        : 0;
  score += propertyPoints;
  addReason(
    reasons,
    'PROPERTY_TYPE',
    'Property type',
    propertyPoints,
    SCORE_WEIGHTS.propertyType,
    lead.propertyType === 'residential'
      ? 'Residential property recorded.'
      : lead.propertyType === 'commercial'
        ? 'Commercial property recorded; confirm applicable technical and tariff requirements.'
        : lead.propertyType === 'industrial'
          ? 'Industrial property recorded; confirm applicable technical and tariff requirements.'
          : 'Property type is unknown or requires clarification.',
    propertyPoints
  );
  if (!['residential', 'commercial', 'industrial'].includes(lead.propertyType)) {
    dataGaps.push('Confirm the property type.');
  }

  // Monthly electricity bill: higher spend indicates potential savings,
  // but no claim about actual savings or eligibility is made.
  const monthlyBill = Number.isFinite(lead.monthlyElectricityBill)
    ? lead.monthlyElectricityBill
    : null;
  let billSpendPoints = 0;
  if (monthlyBill !== null) {
    billSpendPoints = monthlyBill >= 5000 ? 20
      : monthlyBill >= 3000 ? 16
        : monthlyBill >= 1500 ? 12
          : monthlyBill > 0 ? 6
            : 0;
  } else {
    dataGaps.push('Capture the customer’s average monthly electricity bill.');
  }
  billSpendPoints = (billSpendPoints / 20) * SCORE_WEIGHTS.electricityBill;
  score += billSpendPoints;
  addReason(
    reasons,
    'MONTHLY_ELECTRICITY_BILL',
    'Monthly electricity bill',
    roundScore(billSpendPoints),
    SCORE_WEIGHTS.electricityBill,
    monthlyBill === null
      ? 'Monthly electricity bill has not been provided.'
      : `Recorded monthly bill: ₹${monthlyBill.toLocaleString('en-IN')}.`,
    roundScore(billSpendPoints)
  );

  // Consumption supports a first-pass commercial opportunity indicator.
  // Do not infer consumption from the OCR document unless that bill is verified.
  const verifiedUnits = bill?.monthlyUnits;
  const hasVerifiedBillUnits = Number.isFinite(verifiedUnits);
  const leadUnits = Number.isFinite(lead.monthlyUnits) ? lead.monthlyUnits : null;
  const monthlyUnits = hasVerifiedBillUnits ? verifiedUnits : leadUnits;
  let usagePoints = 0;
  if (monthlyUnits !== null) {
    usagePoints = monthlyUnits >= 500 ? 15
      : monthlyUnits >= 300 ? 12
        : monthlyUnits >= 150 ? 9
          : monthlyUnits > 0 ? 5
            : 0;
  } else {
    dataGaps.push('Capture monthly electricity consumption in kWh/units.');
  }
  score += usagePoints;
  addReason(
    reasons,
    'MONTHLY_ELECTRICITY_UNITS',
    'Monthly electricity consumption',
    usagePoints,
    SCORE_WEIGHTS.electricityUsage,
    monthlyUnits === null
      ? 'Monthly electricity consumption is unavailable.'
      : `Scoring uses ${hasVerifiedBillUnits ? 'verified bill' : 'lead form'} consumption of ${monthlyUnits} units per month.`,
    usagePoints
  );

  // Only an active, completed, manually verified bill is allowed to add
  // bill verification and OCR-confidence points.
  if (bill) {
    score += SCORE_WEIGHTS.verifiedBill;
    addReason(
      reasons,
      'BILL_VERIFIED',
      'Electricity bill verification',
      SCORE_WEIGHTS.verifiedBill,
      SCORE_WEIGHTS.verifiedBill,
      'An active electricity bill has completed OCR and was manually verified by Sales Staff.',
      SCORE_WEIGHTS.verifiedBill
    );

    const confidence = Number.isFinite(bill.extractionConfidence)
      ? bill.extractionConfidence
      : null;
    if (confidence === null) {
      dataGaps.push('Verified bill has no OCR confidence value; confirm document quality manually.');
    }
    const confidencePoints = confidence === null
      ? 0
      : roundScore(confidence * SCORE_WEIGHTS.billConfidence);
    score += confidencePoints;
    addReason(
      reasons,
      'BILL_EXTRACTION_CONFIDENCE',
      'Bill extraction confidence',
      confidencePoints,
      SCORE_WEIGHTS.billConfidence,
      confidence === null
        ? 'OCR confidence is unavailable; no confidence points are awarded.'
        : `Verified bill OCR confidence: ${Math.round(confidence * 100)}%.`,
      confidencePoints
    );
  } else {
    addReason(
      reasons,
      'BILL_NOT_VERIFIED',
      'Electricity bill verification',
      0,
      SCORE_WEIGHTS.verifiedBill,
      'No active, completed and manually verified bill is available. Unverified OCR values do not contribute.',
      0
    );
    addReason(
      reasons,
      'BILL_EXTRACTION_CONFIDENCE',
      'Bill extraction confidence',
      0,
      SCORE_WEIGHTS.billConfidence,
      'Bill extraction confidence is not scored until the bill is manually verified.',
      0
    );
    dataGaps.push('Upload an electricity bill and have Sales Staff complete manual verification.');
  }

  const finalScore = roundScore(score);
  const priority = calculatePriority(finalScore);

  reasons.push({
    code: 'SCORING_VERSION',
    label: 'Scoring model',
    points: null,
    maxPoints: null,
    detail: `Explainable rule set version ${LEAD_SCORING_VERSION}; priority thresholds: high ≥ ${PRIORITY_THRESHOLDS.high}, medium ≥ ${PRIORITY_THRESHOLDS.medium}.`,
  });

  return {
    score: finalScore,
    priority,
    reasons,
    dataGaps: [...new Set(dataGaps)],
    scoringVersion: LEAD_SCORING_VERSION,
    evaluatedAt: new Date(),
    inputs: {
      propertyType: lead.propertyType,
      ownership: lead.ownership,
      monthlyElectricityBill: monthlyBill,
      monthlyUnits,
      monthlyUnitsSource: hasVerifiedBillUnits
        ? 'verified_bill'
        : monthlyUnits !== null
          ? 'lead_form'
          : 'unavailable',
      billVerificationStatus: bill?.verificationStatus ?? 'not_verified',
      billOcrStatus: bill?.ocrStatus ?? 'not_available',
      billExtractionConfidence: bill?.extractionConfidence ?? null,
    },
  };
}

function toQualificationDTO(lead, qualification) {
  return {
    leadId: lead._id.toString(),
    referenceId: lead.referenceId,
    leadStatus: lead.status,
    leadScore: qualification.score,
    priority: qualification.priority,
    scoringVersion: qualification.scoringVersion,
    evaluatedAt: qualification.evaluatedAt,
    reasons: qualification.reasons,
    dataGaps: qualification.dataGaps,
    inputs: qualification.inputs,
  };
}

async function findAccessibleLead(user, leadId) {
  const scope = user.role === 'homeowner'
    ? { homeownerId: user.id }
    : { assignedSalesStaffId: user.id };

  const lead = await Lead.findOne({ _id: leadId, ...scope }).lean();
  if (!lead) {
    throw new AppError('Lead not found.', 404);
  }
  return lead;
}

async function findVerifiedBill(lead) {
  if (!lead.billAnalysisId) return null;

  return BillAnalysis.findOne({
    _id: lead.billAnalysisId,
    leadId: lead._id,
    deletionStatus: 'active',
    ocrStatus: 'completed',
    verificationStatus: 'verified',
  })
    .select('monthlyUnits extractionConfidence verificationStatus ocrStatus')
    .lean();
}

/**
 * Recalculate and persist an explainable, deterministic lead score.
 * Only Sales Staff may recalculate scores, and only for leads
 * currently assigned to them. Homeowners can retrieve their own result.
 */
export async function qualifyLead(user, leadId) {
  requireSalesStaff(user);
  validateLeadId(leadId);

  const lead = await findAccessibleLead(user, leadId);
  const bill = await findVerifiedBill(lead);
  const qualification = evaluateLead(lead, bill);

  const updatedLead = await Lead.findOneAndUpdate(
    {
      _id: lead._id,
      assignedSalesStaffId: user.id,
      updatedAt: lead.updatedAt,
    },
    {
      $set: {
        leadScore: qualification.score,
        priority: qualification.priority,
        qualificationReasons: qualification.reasons,
        qualificationScoringVersion: qualification.scoringVersion,
        qualificationEvaluatedAt: qualification.evaluatedAt,
        qualificationDataGaps: qualification.dataGaps,
        qualificationInputs: qualification.inputs,
      },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedLead) {
    throw new AppError(
      'Lead information changed during qualification. Refresh and retry.',
      409
    );
  }

  return toQualificationDTO(updatedLead, qualification);
}

/**
 * Return the last stored score without silently recalculating it.
 * This keeps GET a read operation and makes the evaluation timestamp meaningful.
 */
export async function getLeadQualification(user, leadId) {
  requireAuthenticatedUser(user);
  validateLeadId(leadId);

  const lead = await findAccessibleLead(user, leadId);
  if (lead.leadScore === null || lead.leadScore === undefined) {
    throw new AppError('Lead has not been qualified yet.', 404);
  }

  return toQualificationDTO(lead, {
    score: lead.leadScore,
    priority: lead.priority,
    scoringVersion: lead.qualificationScoringVersion ?? 'legacy',
    evaluatedAt: lead.qualificationEvaluatedAt ?? null,
    reasons: lead.qualificationReasons ?? [],
    dataGaps: lead.qualificationDataGaps ?? [],
    inputs: lead.qualificationInputs ?? null,
  });
}
