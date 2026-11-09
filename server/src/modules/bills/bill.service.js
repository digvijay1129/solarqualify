
import Lead from '../leads/lead.model.js';
import BillAnalysis from './bill-analysis.model.js';
import { getAuthorizedBillLead } from './bill-access.service.js';
import { encryptDocument } from './document-crypto.service.js';
import {
  uploadEncryptedDocument,
  deleteStoredDocument,
} from './imagekit-storage.service.js';
import { AppError } from '../../shared/errors/AppError.js';

const ALLOWED_DOCUMENT_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function getSafeOriginalFileName(originalName) {
  if (typeof originalName !== 'string' || !originalName.trim()) {
    throw new AppError('A valid original file name is required.', 400);
  }

  const normalized = originalName
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();

  if (!normalized) {
    throw new AppError('A valid original file name is required.', 400);
  }

  return normalized.slice(0, 255);
}

function validateUploadedFile(file) {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    file.buffer.length === 0
  ) {
    throw new AppError('A valid bill document is required.', 400);
  }

  const expectedExtension = ALLOWED_DOCUMENT_TYPES.get(
    file.detectedMimeType
  );

  if (
    !expectedExtension ||
    expectedExtension !== file.detectedExtension
  ) {
    throw new AppError(
      'Bill document has not passed file validation.',
      400
    );
  }

  return getSafeOriginalFileName(file.originalname);
}

function getLeadOwnershipFilter(user) {
  return user.role === 'homeowner'
    ? { homeownerId: user.id }
    : { assignedSalesStaffId: user.id };
}

function toBillDTO(bill) {
  return {
    id: bill._id.toString(),
    leadId: bill.leadId.toString(),
    originalFileName: bill.originalFileName,
    documentSize: bill.documentSize,
    documentType: bill.documentType,
    verificationStatus: bill.verificationStatus,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
  };
}

async function cleanupFailedUpload(billId, storageFileId, originalError) {
  const cleanupTasks = [];

  if (billId) {
    cleanupTasks.push(
      BillAnalysis.deleteOne({ _id: billId })
    );
  }

  if (storageFileId) {
    cleanupTasks.push(
      deleteStoredDocument(storageFileId)
    );
  }

  const results = await Promise.allSettled(cleanupTasks);

  const cleanupErrors = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason);

  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      [originalError, ...cleanupErrors],
      'Bill upload failed and one or more cleanup operations also failed.'
    );
  }

  throw originalError;
}

/**
 * Uploads one bill document for an authorized lead.
 *
 * The encrypted file is uploaded to private ImageKit storage.
 * MongoDB stores the document metadata and encryption parameters.
 * Only the lead's authorized homeowner or assigned Sales Staff
 * member can attach a bill.
 */
export async function uploadBillDocument(user, leadId, file) {
  const lead = await getAuthorizedBillLead(user, leadId);

  if (lead.billAnalysisId) {
    throw new AppError(
      'A bill document already exists for this lead. Delete it before uploading a replacement.',
      409
    );
  }

  const originalFileName = validateUploadedFile(file);

  const encrypted = encryptDocument(file.buffer);

  const storage = await uploadEncryptedDocument(
    encrypted.encryptedBuffer,
    file.detectedExtension
  );

  let bill = null;

  try {
    bill = await BillAnalysis.create({
      leadId: lead._id,
      storageProvider: storage.storageProvider,
      storageFileId: storage.storageFileId,
      storagePath: storage.storagePath,
      originalFileName,
      documentSize: file.buffer.length,
      encryption: encrypted.encryption,
      documentType: file.detectedMimeType,
      verificationStatus: 'pending',
    });

    const linkedLead = await Lead.findOneAndUpdate(
      {
        _id: leadId,
        ...getLeadOwnershipFilter(user),
        billAnalysisId: null,
      },
      {
        $set: {
          billAnalysisId: bill._id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!linkedLead) {
      throw new AppError(
        'The lead or bill state changed during upload. Refresh and try again.',
        409
      );
    }

    return toBillDTO(bill);
  } catch (error) {
    await cleanupFailedUpload(
      bill?._id,
      storage.storageFileId,
      error
    );
  }
}
