
import mongoose from 'mongoose';
import AuditLog from '../audit-logs/audit-log.model.js';

const BILL_AUDIT_ACTIONS = new Set([
  'BILL_UPLOADED',
  'BILL_METADATA_VIEWED',
  'BILL_DOWNLOAD_REQUESTED',
  'BILL_DELETE_REQUESTED',
  'BILL_DELETED',
  'BILL_DELETE_FAILED',
]);

const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export async function recordBillAuditEvent({
  actorId,
  action,
  billId = null,
  leadId,
  documentType,
  documentSize,
}) {
  if (!mongoose.isValidObjectId(actorId)) {
    throw new TypeError('A valid audit actor ID is required.');
  }

  if (!BILL_AUDIT_ACTIONS.has(action)) {
    throw new TypeError('Unsupported bill audit action.');
  }

  if (!mongoose.isValidObjectId(leadId)) {
    throw new TypeError('A valid audit lead ID is required.');
  }

  if (billId !== null && !mongoose.isValidObjectId(billId)) {
    throw new TypeError('A valid audit bill ID is required.');
  }

  const metadata = {
    leadId: String(leadId),
  };

  if (documentType !== undefined) {
    if (!DOCUMENT_TYPES.has(documentType)) {
      throw new TypeError('Invalid audit document type.');
    }

    metadata.documentType = documentType;
  }

  if (documentSize !== undefined) {
    if (!Number.isSafeInteger(documentSize) || documentSize < 1) {
      throw new TypeError('Invalid audit document size.');
    }

    metadata.documentSize = documentSize;
  }

  return AuditLog.create({
    actorId,
    action,
    resourceType: 'BillAnalysis',
    resourceId: billId,
    metadata,
  });
}
