import { fileTypeFromBuffer } from 'file-type';

import BillAnalysis from './bill-analysis.model.js';
import { getAuthorizedBillLead } from './bill-access.service.js';
import { decryptDocument } from './document-crypto.service.js';
import {
  downloadEncryptedDocument,
} from './imagekit-storage.service.js';
import {
  recordBillAuditEvent,
} from './bill-audit.service.js';
import { AppError } from '../../shared/errors/AppError.js';

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

function getBillQuery(lead) {
  if (!lead.billAnalysisId) {
    throw new AppError('Bill document not found.', 404);
  }

  return BillAnalysis.findOne({
    _id: lead.billAnalysisId,
    leadId: lead._id,
  });
}

export async function getBillDocumentMetadata(user, leadId) {
  const lead = await getAuthorizedBillLead(user, leadId);

  const bill = await getBillQuery(lead).lean();

  if (!bill) {
    throw new AppError('Bill document not found.', 404);
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

  await recordBillAuditEvent({
    actorId: user.id,
    action: 'BILL_METADATA_VIEWED',
    billId: bill._id,
    leadId: lead._id,
    documentType: bill.documentType,
    documentSize: bill.documentSize,
  });

  return toBillDTO(bill);
}

export async function downloadBillDocument(user, leadId) {
  const lead = await getAuthorizedBillLead(user, leadId);

  const bill = await getBillQuery(lead)
    .select('+encryption.iv +encryption.authTag')
    .lean();

  if (!bill) {
    throw new AppError('Bill document not found.', 404);
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

  if (
    bill.storageProvider !== 'imagekit' ||
    !bill.storagePath ||
    !bill.encryption
  ) {
    throw new AppError(
      'Bill document storage metadata is invalid.',
      500
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
      502
    );
  }

  // AES-256-GCM does not add padding, so the encrypted
  // document must have the same byte length as the original.
  if (encryptedBuffer.length !== bill.documentSize) {
    throw new AppError(
      'Stored bill document failed integrity validation.',
      500
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
      500
    );
  }

  if (documentBuffer.length !== bill.documentSize) {
    throw new AppError(
      'Stored bill document failed integrity validation.',
      500
    );
  }

  const detectedType = await fileTypeFromBuffer(documentBuffer);

  if (!detectedType || detectedType.mime !== bill.documentType) {
    throw new AppError(
      'Stored bill document type validation failed.',
      500
    );
  }

  await recordBillAuditEvent({
    actorId: user.id,
    action: 'BILL_DOWNLOAD_REQUESTED',
    billId: bill._id,
    leadId: lead._id,
    documentType: bill.documentType,
    documentSize: bill.documentSize,
  });

  return {
    billId: bill._id.toString(),
    leadId: bill.leadId.toString(),
    buffer: documentBuffer,
    originalFileName: bill.originalFileName,
    documentType: bill.documentType,
    documentSize: bill.documentSize,
  };
}