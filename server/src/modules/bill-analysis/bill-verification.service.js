
import BillAnalysis from '../bills/bill-analysis.model.js';
import {
  getAuthorizedBillLead,
} from '../bills/bill-access.service.js';
import {
  recordBillAuditEvent,
} from '../bills/bill-audit.service.js';
import { AppError } from '../../shared/errors/AppError.js';

const ALLOWED_FIELD_NAMES = new Set([
  'consumerNumber',
  'tariff',
  'sanctionedLoad',
  'sanctionedLoadUnit',
  'monthlyUnits',
]);

const ALLOWED_LOAD_UNITS = new Set([
  'kW',
  'kVA',
  'HP',
]);

const MAX_CONSUMER_NUMBER_LENGTH = 80;
const MAX_TARIFF_LENGTH = 100;
const MAX_REVIEW_NOTES_LENGTH = 500;
const MAX_SANCTIONED_LOAD = 1_000_000;
const MAX_MONTHLY_UNITS = 10_000_000;

function requireSalesStaff(user) {
  if (
    !user ||
    user.role !== 'salesStaff' ||
    typeof user.id !== 'string'
  ) {
    throw new AppError(
      'Only Sales Staff can review and verify bill documents.',
      403
    );
  }
}

function normalizeText(value, fieldName, maxLength) {
  if (typeof value !== 'string') {
    throw new AppError(
      `${fieldName} must be a string.`,
      400
    );
  }

  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();

  if (!normalized || normalized.length > maxLength) {
    throw new AppError(
      `${fieldName} must contain between 1 and ${maxLength} characters.`,
      400
    );
  }

  return normalized;
}

function validateReviewPayload(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new AppError(
      'A valid bill verification payload is required.',
      400
    );
  }

  const allowedRootKeys = new Set([
    'decision',
    'fields',
    'reviewNotes',
  ]);

  const unknownRootKeys = Object.keys(payload).filter(
    (key) => !allowedRootKeys.has(key)
  );

  if (unknownRootKeys.length > 0) {
    throw new AppError(
      'The verification payload contains unsupported properties.',
      400
    );
  }

  const { decision } = payload;

  if (!['verified', 'rejected'].includes(decision)) {
    throw new AppError(
      'Decision must be verified or rejected.',
      400
    );
  }

  const fields = payload.fields ?? {};

  if (
    typeof fields !== 'object' ||
    fields === null ||
    Array.isArray(fields)
  ) {
    throw new AppError(
      'Verification fields must be an object.',
      400
    );
  }

  const unknownFields = Object.keys(fields).filter(
    (field) => !ALLOWED_FIELD_NAMES.has(field)
  );

  if (unknownFields.length > 0) {
    throw new AppError(
      'One or more unsupported bill fields were supplied.',
      400
    );
  }

  if (
    decision === 'rejected' &&
    Object.keys(fields).length > 0
  ) {
    throw new AppError(
      'Bill fields cannot be changed while rejecting a document.',
      400
    );
  }

  let reviewNotes = '';

  if (payload.reviewNotes !== undefined) {
    reviewNotes = normalizeReviewNotes(payload.reviewNotes);
  }

  if (decision === 'rejected' && !reviewNotes) {
    throw new AppError(
      'A reason is required when rejecting a bill.',
      400
    );
  }

  const normalizedFields = {};

  if (Object.hasOwn(fields, 'consumerNumber')) {
    normalizedFields.consumerNumber = normalizeText(
      fields.consumerNumber,
      'Consumer number',
      MAX_CONSUMER_NUMBER_LENGTH
    );
  }

  if (Object.hasOwn(fields, 'tariff')) {
    normalizedFields.tariff = normalizeText(
      fields.tariff,
      'Tariff',
      MAX_TARIFF_LENGTH
    );
  }

  if (Object.hasOwn(fields, 'sanctionedLoad')) {
    const value = fields.sanctionedLoad;

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > MAX_SANCTIONED_LOAD
    ) {
      throw new AppError(
        'Sanctioned load must be a positive valid number.',
        400
      );
    }

    normalizedFields.sanctionedLoad = value;
  }

  if (Object.hasOwn(fields, 'sanctionedLoadUnit')) {
    const unit = fields.sanctionedLoadUnit;

    if (!ALLOWED_LOAD_UNITS.has(unit)) {
      throw new AppError(
        'Sanctioned load unit must be kW, kVA or HP.',
        400
      );
    }

    normalizedFields.sanctionedLoadUnit = unit;
  }

  if (Object.hasOwn(fields, 'monthlyUnits')) {
    const value = fields.monthlyUnits;

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > MAX_MONTHLY_UNITS
    ) {
      throw new AppError(
        'Monthly units must be a valid non-negative number.',
        400
      );
    }

    normalizedFields.monthlyUnits = value;
  }

  return {
    decision,
    fields: normalizedFields,
    reviewNotes,
  };
}

function normalizeReviewNotes(value) {
  if (typeof value !== 'string') {
    throw new AppError(
      'Review notes must be a string.',
      400
    );
  }

  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim();

  if (normalized.length > MAX_REVIEW_NOTES_LENGTH) {
    throw new AppError(
      `Review notes cannot exceed ${MAX_REVIEW_NOTES_LENGTH} characters.`,
      400
    );
  }

  return normalized;
}

function getMissingVerificationFields(fields) {
  const missing = [];

  if (
    typeof fields.consumerNumber !== 'string' ||
    !fields.consumerNumber.trim()
  ) {
    missing.push('consumerNumber');
  }

  if (
    typeof fields.tariff !== 'string' ||
    !fields.tariff.trim()
  ) {
    missing.push('tariff');
  }

  if (
    typeof fields.sanctionedLoad !== 'number' ||
    !Number.isFinite(fields.sanctionedLoad) ||
    fields.sanctionedLoad <= 0
  ) {
    missing.push('sanctionedLoad');
  }

  if (
    !ALLOWED_LOAD_UNITS.has(fields.sanctionedLoadUnit)
  ) {
    missing.push('sanctionedLoadUnit');
  }

  if (
    typeof fields.monthlyUnits !== 'number' ||
    !Number.isFinite(fields.monthlyUnits) ||
    fields.monthlyUnits < 0
  ) {
    missing.push('monthlyUnits');
  }

  return missing;
}

function buildCorrections(originalBill, updatedFields) {
  const corrections = {
    ...(originalBill.corrections ?? {}),
  };

  for (const [field, correctedValue] of Object.entries(
    updatedFields
  )) {
    const originalValue =
      corrections[field]?.original ??
      originalBill[field] ??
      null;

    if (originalValue === correctedValue) {
      delete corrections[field];
      continue;
    }

    corrections[field] = {
      original: originalValue,
      corrected: correctedValue,
    };
  }

  return corrections;
}

function toReviewDTO(bill) {
  const fields = {
    consumerNumber: bill.consumerNumber ?? '',
    tariff: bill.tariff ?? '',
    sanctionedLoad: bill.sanctionedLoad ?? null,
    sanctionedLoadUnit: bill.sanctionedLoadUnit ?? null,
    monthlyUnits: bill.monthlyUnits ?? null,
  };

  return {
    billId: bill._id.toString(),
    leadId: bill.leadId.toString(),
    originalFileName: bill.originalFileName,
    documentType: bill.documentType,
    ocrStatus: bill.ocrStatus,
    verificationStatus: bill.verificationStatus,
    extractionConfidence: bill.extractionConfidence,
    fields,
    missingFields: getMissingVerificationFields(fields),
    corrections: bill.corrections ?? {},
    reviewNotes: bill.reviewNotes ?? '',
    reviewedBy: bill.reviewedBy
      ? bill.reviewedBy.toString()
      : null,
    reviewedAt: bill.reviewedAt ?? null,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
  };
}

async function getAuthorizedReviewBill(user, leadId) {
  requireSalesStaff(user);

  const lead = await getAuthorizedBillLead(
    user,
    leadId
  );

  if (!lead.billAnalysisId) {
    throw new AppError(
      'Bill document not found.',
      404
    );
  }

  const bill = await BillAnalysis.findOne({
    _id: lead.billAnalysisId,
    leadId: lead._id,
  }).lean();

  if (!bill) {
    throw new AppError(
      'Bill document not found.',
      404
    );
  }

  if (
    bill.deletionStatus &&
    bill.deletionStatus !== 'active'
  ) {
    throw new AppError(
      'Bill document is being deleted.',
      409
    );
  }

  if (bill.ocrStatus !== 'completed') {
    throw new AppError(
      'Bill OCR must complete successfully before manual verification.',
      409
    );
  }

  return {
    lead,
    bill,
  };
}

/**
 * Retrieves OCR-extracted fields for assigned Sales Staff.
 *
 * Raw OCR text, encryption metadata and storage information
 * are deliberately excluded from the response.
 */
export async function getBillAnalysisForReview(user, leadId) {
  const { lead, bill } = await getAuthorizedReviewBill(
    user,
    leadId
  );

  await recordBillAuditEvent({
    actorId: user.id,
    action: 'BILL_VERIFICATION_VIEWED',
    billId: bill._id,
    leadId: lead._id,
    documentType: bill.documentType,
    documentSize: bill.documentSize,
  });

  return toReviewDTO(bill);
}

/**
 * Applies Sales Staff corrections and records one final decision.
 *
 * A verified bill must contain all required fields.
 * A rejected bill must include a review reason.
 *
 * Atomic update prevents multiple simultaneous final decisions.
 */
export async function verifyBillAnalysis(
  user,
  leadId,
  payload
) {
  const { decision, fields, reviewNotes } =
    validateReviewPayload(payload);

  const { lead, bill } = await getAuthorizedReviewBill(
    user,
    leadId
  );

  if (
    !['pending', 'needs_review'].includes(
      bill.verificationStatus
    )
  ) {
    throw new AppError(
      'This bill has already received a final verification decision.',
      409
    );
  }

  const currentFields = {
    consumerNumber: bill.consumerNumber ?? '',
    tariff: bill.tariff ?? '',
    sanctionedLoad: bill.sanctionedLoad ?? null,
    sanctionedLoadUnit: bill.sanctionedLoadUnit ?? null,
    monthlyUnits: bill.monthlyUnits ?? null,
  };

  const updatedFields = {
    ...currentFields,
    ...fields,
  };

  if (decision === 'verified') {
    const missingFields = getMissingVerificationFields(
      updatedFields
    );

    if (missingFields.length > 0) {
      throw new AppError(
        'All bill fields must be corrected or confirmed before verification.',
        422,
        { missingFields }
      );
    }
  }

  const corrections =
    decision === 'verified'
      ? buildCorrections(bill, fields)
      : bill.corrections ?? {};

  const reviewedAt = new Date();

  const update = {
    $set: {
      verificationStatus: decision,
      reviewNotes,
      reviewedBy: user.id,
      reviewedAt,
      corrections,
    },
  };

  if (decision === 'verified') {
    Object.assign(update.$set, updatedFields);
  }

  const updatedBill = await BillAnalysis.findOneAndUpdate(
    {
      _id: bill._id,
      leadId: lead._id,
      deletionStatus: 'active',
      ocrStatus: 'completed',
      verificationStatus: {
        $in: ['pending', 'needs_review'],
      },
    },
    update,
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!updatedBill) {
    throw new AppError(
      'Bill verification state changed. Refresh and try again.',
      409
    );
  }

  const auditAction =
    decision === 'verified'
      ? 'BILL_VERIFIED'
      : 'BILL_REJECTED';

  await recordBillAuditEvent({
    actorId: user.id,
    action: auditAction,
    billId: bill._id,
    leadId: lead._id,
    documentType: bill.documentType,
    documentSize: bill.documentSize,
  });

  return toReviewDTO(updatedBill);
}
