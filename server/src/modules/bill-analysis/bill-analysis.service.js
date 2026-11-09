
import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';

import BillAnalysis from '../bills/bill-analysis.model.js';
import { getAuthorizedBillLead } from '../bills/bill-access.service.js';
import { decryptDocument } from '../bills/document-crypto.service.js';
import {
  downloadEncryptedDocument,
} from '../bills/imagekit-storage.service.js';
import {
  recordBillAuditEvent,
} from '../bills/bill-audit.service.js';

import {
  recognizeBillImage,
} from './bill-ocr.service.js';
import {
  processBillPdf,
  BillPdfProcessingError,
} from './bill-pdf.service.js';
import {
  extractBillFields,
} from './bill-field-extraction.service.js';

import { AppError } from '../../shared/errors/AppError.js';

const OCR_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

const MAX_EXTRACTED_TEXT_CHARS = 200_000;

const SUPPORTED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

class OcrClaimLostError extends Error {
  constructor() {
    super('The OCR processing claim was lost.');
    this.name = 'OcrClaimLostError';
  }
}

function getOcrErrorCode(error) {
  const code =
    error?.details?.code ||
    error?.code;

  if (
    typeof code === 'string' &&
    /^[A-Z0-9_]{1,80}$/.test(code)
  ) {
    return code;
  }

  return 'OCR_PROCESSING_FAILED';
}

function toPublicProcessingError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof BillPdfProcessingError) {
    return new AppError(
      'The electricity bill PDF could not be processed.',
      422,
      { code: error.code }
    );
  }

  return new AppError(
    'Bill OCR processing failed. Please retry.',
    502,
    { code: 'OCR_PROCESSING_FAILED' }
  );
}

function createBillResult({
  bill,
  leadId,
  fields,
  extractionMethod,
  confidence,
}) {
  return {
    billId: bill._id.toString(),
    leadId: leadId.toString(),
    ocrStatus: 'completed',
    verificationStatus: 'needs_review',

    extractionMethod,
    extractionConfidence: confidence,

    fields: {
      consumerNumber: fields.consumerNumber,
      tariff: fields.tariff,
      sanctionedLoad: fields.sanctionedLoad,
      sanctionedLoadUnit: fields.sanctionedLoadUnit,
      monthlyUnits: fields.monthlyUnits,
    },

    missingFields: fields.missingFields,
  };
}

async function getCurrentBillStatus(billId, leadId) {
  const query = BillAnalysis.findOne({
    _id: billId,
    leadId,
  });

  return query
    .select('ocrStatus deletionStatus')
    .lean();
}

async function claimBillForOcr(billId, leadId, lockId) {
  const now = new Date();

  const staleBefore = new Date(
    now.getTime() - OCR_LOCK_TIMEOUT_MS
  );

  const claimFilter = {
    _id: billId,
    leadId,
    deletionStatus: 'active',

    $or: [
      { ocrStatus: 'not_started' },

      // Compatibility with records created before OCR fields existed.
      { ocrStatus: { $exists: false } },

      // Failed jobs can be retried.
      { ocrStatus: 'failed' },

      // Recover an interrupted processing job after the lock expires.
      {
        ocrStatus: 'processing',
        ocrStartedAt: { $lte: staleBefore },
      },

      {
        ocrStatus: 'processing',
        ocrStartedAt: null,
      },
    ],
  };

  const claimUpdate = {
    $set: {
      ocrStatus: 'processing',
      ocrStartedAt: now,
      ocrCompletedAt: null,
      ocrLockId: lockId,
      ocrErrorCode: null,
    },

    $inc: {
      ocrAttempts: 1,
    },
  };

  return BillAnalysis.findOneAndUpdate(
    claimFilter,
    claimUpdate,
    {
      new: true,
      runValidators: true,
    }
  )
    .select('+encryption.iv +encryption.authTag')
    .lean();
}

async function retrieveAndDecryptBill(bill) {
  if (
    bill.storageProvider !== 'imagekit' ||
    typeof bill.storagePath !== 'string' ||
    !bill.storagePath
  ) {
    throw new AppError(
      'Bill document storage metadata is invalid.',
      500,
      { code: 'DOCUMENT_STORAGE_INVALID' }
    );
  }

  let encryptedBuffer;

  try {
    encryptedBuffer = await downloadEncryptedDocument(
      bill.storagePath
    );
  } catch {
    throw new AppError(
      'Bill document storage is temporarily unavailable.',
      502,
      { code: 'DOCUMENT_STORAGE_UNAVAILABLE' }
    );
  }

  // AES-256-GCM encryption does not add padding.
  if (
    !Buffer.isBuffer(encryptedBuffer) ||
    encryptedBuffer.length !== bill.documentSize
  ) {
    throw new AppError(
      'Stored bill document failed integrity validation.',
      500,
      { code: 'DOCUMENT_INTEGRITY_FAILED' }
    );
  }

  let documentBuffer;

  try {
    documentBuffer = decryptDocument(
      encryptedBuffer,
      bill.encryption
    );
  } catch {
    throw new AppError(
      'Stored bill document failed integrity validation.',
      500,
      { code: 'DOCUMENT_DECRYPTION_FAILED' }
    );
  }

  if (
    documentBuffer.length !== bill.documentSize
  ) {
    throw new AppError(
      'Stored bill document failed integrity validation.',
      500,
      { code: 'DOCUMENT_INTEGRITY_FAILED' }
    );
  }

  let detectedType;

  try {
    detectedType = await fileTypeFromBuffer(documentBuffer);
  } catch {
    detectedType = null;
  }

  if (
    !detectedType ||
    detectedType.mime !== bill.documentType ||
    !SUPPORTED_DOCUMENT_TYPES.has(detectedType.mime)
  ) {
    throw new AppError(
      'Stored bill document type validation failed.',
      500,
      { code: 'DOCUMENT_TYPE_MISMATCH' }
    );
  }

  return documentBuffer;
}

async function processBillDocument(buffer, documentType) {
  if (documentType === 'application/pdf') {
    const result = await processBillPdf(buffer);

    return {
      text: result.text,
      extractionMethod: result.extractionMethod,
      confidence: result.ocrConfidence,
    };
  }

  if (
    documentType === 'image/jpeg' ||
    documentType === 'image/png' ||
    documentType === 'image/webp'
  ) {
    const result = await recognizeBillImage(
      buffer,
      documentType
    );

    return {
      text: result.text,
      extractionMethod: 'ocr',
      confidence: result.confidence,
    };
  }

  throw new AppError(
    'Unsupported bill document type.',
    415,
    { code: 'UNSUPPORTED_DOCUMENT_TYPE' }
  );
}

async function saveOcrFailure({
  bill,
  lead,
  user,
  lockId,
  error,
}) {
  const errorCode = getOcrErrorCode(error);

  const result = await BillAnalysis.updateOne(
    {
      _id: bill._id,
      leadId: lead._id,
      ocrStatus: 'processing',
      ocrLockId: lockId,
    },
    {
      $set: {
        ocrStatus: 'failed',
        ocrErrorCode: errorCode,
        ocrCompletedAt: null,
        ocrLockId: null,
      },
    },
    {
      runValidators: true,
    }
  );

  // Another worker took ownership or deletion superseded this job.
  if (result.matchedCount !== 1) {
    return false;
  }

  await recordBillAuditEvent({
    actorId: user.id,
    action: 'BILL_OCR_FAILED',
    billId: bill._id,
    leadId: lead._id,
    documentType: bill.documentType,
    documentSize: bill.documentSize,
  });

  return true;
}

/**
 * Processes the bill attached to an authorized lead.
 *
 * This function:
 * 1. Authorizes the lead.
 * 2. Claims the OCR processing job atomically.
 * 3. Retrieves and decrypts the private ImageKit document.
 * 4. Runs image OCR or PDF processing.
 * 5. Extracts electricity-bill fields.
 * 6. Persists the result only if this worker still owns the lock.
 * 7. Keeps the bill in needs_review until a staff member verifies it.
 */
export async function analyzeBillDocument(user, leadId) {
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

  const lockId = randomUUID();

  const bill = await claimBillForOcr(
    lead.billAnalysisId,
    lead._id,
    lockId
  );

  if (!bill) {
    const existingBill = await getCurrentBillStatus(
      lead.billAnalysisId,
      lead._id
    );

    if (!existingBill) {
      throw new AppError(
        'Bill document not found.',
        404
      );
    }

    if (
      existingBill.deletionStatus &&
      existingBill.deletionStatus !== 'active'
    ) {
      throw new AppError(
        'Bill document is being deleted.',
        409
      );
    }

    if (existingBill.ocrStatus === 'completed') {
      throw new AppError(
        'Bill OCR has already been completed.',
        409
      );
    }

    throw new AppError(
      'Bill OCR is already being processed. Please try again later.',
      409
    );
  }

  try {
    await recordBillAuditEvent({
      actorId: user.id,
      action: 'BILL_OCR_REQUESTED',
      billId: bill._id,
      leadId: lead._id,
      documentType: bill.documentType,
      documentSize: bill.documentSize,
    });

    const documentBuffer = await retrieveAndDecryptBill(
      bill
    );

    const processedDocument = await processBillDocument(
      documentBuffer,
      bill.documentType
    );

    if (typeof processedDocument.text !== 'string') {
      throw new Error(
        'OCR processor returned invalid text.'
      );
    }

    if (
      processedDocument.text.length >
      MAX_EXTRACTED_TEXT_CHARS
    ) {
      throw new AppError(
        'Extracted bill text exceeds the allowed processing limit.',
        422,
        { code: 'OCR_TEXT_LIMIT_EXCEEDED' }
      );
    }

    const fields = extractBillFields(
      processedDocument.text
    );

    const completedAt = new Date();

    const updateResult = await BillAnalysis.updateOne(
      {
        _id: bill._id,
        leadId: lead._id,
        ocrStatus: 'processing',
        ocrLockId: lockId,
        deletionStatus: 'active',
      },
      {
        $set: {
          extractedText: processedDocument.text,

          consumerNumber:
            fields.consumerNumber ?? '',

          tariff:
            fields.tariff ?? '',

          sanctionedLoad:
            fields.sanctionedLoad,

          sanctionedLoadUnit:
            fields.sanctionedLoadUnit,

          monthlyUnits:
            fields.monthlyUnits,

          extractionConfidence:
            processedDocument.confidence,

          ocrStatus: 'completed',
          ocrCompletedAt: completedAt,
          ocrErrorCode: null,
          ocrLockId: null,

          // OCR is not verification.
          verificationStatus: 'needs_review',

          // Never mark OCR-extracted fields as manually reviewed.
          reviewedBy: null,
          reviewedAt: null,
        },
      },
      {
        runValidators: true,
      }
    );

    if (updateResult.matchedCount !== 1) {
      throw new OcrClaimLostError();
    }

    const response = createBillResult({
      bill,
      leadId: lead._id,
      fields,
      extractionMethod: processedDocument.extractionMethod,
      confidence: processedDocument.confidence,
    });

    // Completion audit is recorded only after successful persistence.
    await recordBillAuditEvent({
      actorId: user.id,
      action: 'BILL_OCR_COMPLETED',
      billId: bill._id,
      leadId: lead._id,
      documentType: bill.documentType,
      documentSize: bill.documentSize,
    });

    return response;
  } catch (error) {
    if (error instanceof OcrClaimLostError) {
      throw new AppError(
        'The OCR processing job was superseded. Check the latest bill status.',
        409,
        { code: 'OCR_CLAIM_LOST' }
      );
    }

    try {
      await saveOcrFailure({
        bill,
        lead,
        user,
        lockId,
        error,
      });
    } catch (failureError) {
      throw new AggregateError(
        [error, failureError],
        'Bill OCR processing and failure recovery both failed.'
      );
    }

    throw toPublicProcessingError(error);
  }
}
