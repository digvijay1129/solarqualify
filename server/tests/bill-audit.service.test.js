
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('../src/modules/audit-logs/audit-log.model.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

import AuditLog from '../src/modules/audit-logs/audit-log.model.js';

import {
  recordBillAuditEvent,
} from '../src/modules/bills/bill-audit.service.js';

const ACTOR_ID = '507f1f77bcf86cd799439011';
const LEAD_ID = '507f1f77bcf86cd799439012';
const BILL_ID = '507f1f77bcf86cd799439013';

describe('Bill Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    AuditLog.create.mockResolvedValue({
      _id: BILL_ID,
    });
  });

  it('should create an upload audit event', async () => {
    await recordBillAuditEvent({
      actorId: ACTOR_ID,
      action: 'BILL_UPLOADED',
      billId: BILL_ID,
      leadId: LEAD_ID,
      documentType: 'application/pdf',
      documentSize: 1024,
    });

    expect(AuditLog.create).toHaveBeenCalledWith({
      actorId: ACTOR_ID,
      action: 'BILL_UPLOADED',
      resourceType: 'BillAnalysis',
      resourceId: BILL_ID,
      metadata: {
        leadId: LEAD_ID,
        documentType: 'application/pdf',
        documentSize: 1024,
      },
    });
  });

  it('should support audit events without a bill ID', async () => {
    await recordBillAuditEvent({
      actorId: ACTOR_ID,
      action: 'BILL_DELETE_FAILED',
      leadId: LEAD_ID,
    });

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: null,
        metadata: {
          leadId: LEAD_ID,
        },
      })
    );
  });

  it.each([
    'BILL_OCR_REQUESTED',
    'BILL_OCR_COMPLETED',
    'BILL_OCR_FAILED',
  ])('should accept the %s OCR audit event', async (action) => {
    await recordBillAuditEvent({
      actorId: ACTOR_ID,
      action,
      billId: BILL_ID,
      leadId: LEAD_ID,
      documentType: 'application/pdf',
      documentSize: 2048,
    });

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        action,
        resourceId: BILL_ID,
      })
    );
  });

  it.each([
    'BILL_VERIFICATION_VIEWED',
    'BILL_VERIFIED',
    'BILL_REJECTED',
  ])('should accept the %s verification audit event', async (action) => {
    await recordBillAuditEvent({
      actorId: ACTOR_ID,
      action,
      billId: BILL_ID,
      leadId: LEAD_ID,
      documentType: 'application/pdf',
      documentSize: 1024,
    });

    expect(AuditLog.create).toHaveBeenCalledWith({
      actorId: ACTOR_ID,
      action,
      resourceType: 'BillAnalysis',
      resourceId: BILL_ID,
      metadata: {
        leadId: LEAD_ID,
        documentType: 'application/pdf',
        documentSize: 1024,
      },
    });
  });

  it('should reject invalid actor IDs', async () => {
    await expect(
      recordBillAuditEvent({
        actorId: 'invalid',
        action: 'BILL_UPLOADED',
        leadId: LEAD_ID,
      })
    ).rejects.toThrow(
      'A valid audit actor ID is required.'
    );

    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  it('should reject unsupported audit actions', async () => {
    await expect(
      recordBillAuditEvent({
        actorId: ACTOR_ID,
        action: 'UNKNOWN_ACTION',
        leadId: LEAD_ID,
      })
    ).rejects.toThrow(
      'Unsupported bill audit action.'
    );

    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  it('should reject invalid lead IDs', async () => {
    await expect(
      recordBillAuditEvent({
        actorId: ACTOR_ID,
        action: 'BILL_UPLOADED',
        leadId: 'invalid',
      })
    ).rejects.toThrow(
      'A valid audit lead ID is required.'
    );
  });

  it('should reject invalid bill IDs', async () => {
    await expect(
      recordBillAuditEvent({
        actorId: ACTOR_ID,
        action: 'BILL_UPLOADED',
        billId: 'invalid',
        leadId: LEAD_ID,
      })
    ).rejects.toThrow(
      'A valid audit bill ID is required.'
    );
  });

  it('should reject unsupported document types', async () => {
    await expect(
      recordBillAuditEvent({
        actorId: ACTOR_ID,
        action: 'BILL_UPLOADED',
        leadId: LEAD_ID,
        documentType: 'application/zip',
      })
    ).rejects.toThrow(
      'Invalid audit document type.'
    );
  });

  it('should reject invalid document sizes', async () => {
    await expect(
      recordBillAuditEvent({
        actorId: ACTOR_ID,
        action: 'BILL_UPLOADED',
        leadId: LEAD_ID,
        documentSize: -1,
      })
    ).rejects.toThrow(
      'Invalid audit document size.'
    );
  });

  it('should not save unexpected sensitive properties', async () => {
    await recordBillAuditEvent({
      actorId: ACTOR_ID,
      action: 'BILL_UPLOADED',
      billId: BILL_ID,
      leadId: LEAD_ID,
      documentType: 'application/pdf',
      documentSize: 1024,
      encryptionKey: 'secret',
      authTag: 'secret',
      signedUrl: 'https://example.test/private',
    });

    const savedData = AuditLog.create.mock.calls[0][0];

    expect(savedData).not.toHaveProperty('encryptionKey');
    expect(savedData).not.toHaveProperty('authTag');
    expect(savedData.metadata).not.toHaveProperty('signedUrl');
  });
});
