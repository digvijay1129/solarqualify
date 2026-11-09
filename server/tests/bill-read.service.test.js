import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockFileTypeFromBuffer,
  mockDecryptDocument,
  mockDownloadEncryptedDocument,
  mockRecordBillAuditEvent,
  mockGetAuthorizedBillLead,
} = vi.hoisted(() => ({
  mockFileTypeFromBuffer: vi.fn(),
  mockDecryptDocument: vi.fn(),
  mockDownloadEncryptedDocument: vi.fn(),
  mockRecordBillAuditEvent: vi.fn(),
  mockGetAuthorizedBillLead: vi.fn(),
}));

vi.mock('file-type', () => ({
  fileTypeFromBuffer: mockFileTypeFromBuffer,
}));

vi.mock('../src/modules/bills/bill-analysis.model.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../src/modules/bills/bill-access.service.js', () => ({
  getAuthorizedBillLead: mockGetAuthorizedBillLead,
}));

vi.mock('../src/modules/bills/document-crypto.service.js', () => ({
  decryptDocument: mockDecryptDocument,
}));

vi.mock('../src/modules/bills/imagekit-storage.service.js', () => ({
  downloadEncryptedDocument: mockDownloadEncryptedDocument,
}));

vi.mock('../src/modules/bills/bill-audit.service.js', () => ({
  recordBillAuditEvent: mockRecordBillAuditEvent,
}));

import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';

import {
  getBillDocumentMetadata,
  downloadBillDocument,
} from '../src/modules/bills/bill-read.service.js';

const ACTOR_ID = '507f1f77bcf86cd799439011';
const LEAD_ID = '507f1f77bcf86cd799439012';
const BILL_ID = '507f1f77bcf86cd799439013';

const homeowner = {
  id: ACTOR_ID,
  role: 'homeowner',
};

const lead = {
  _id: LEAD_ID,
  homeownerId: ACTOR_ID,
  billAnalysisId: BILL_ID,
};

const PDF_BUFFER = Buffer.from(
  '%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF'
);

const ENCRYPTED_BUFFER = Buffer.alloc(PDF_BUFFER.length, 1);

const bill = {
  _id: BILL_ID,
  leadId: LEAD_ID,
  storageProvider: 'imagekit',
  storageFileId: 'private-file-123',
  storagePath:
    '/solarqualify/bills/550e8400-e29b-41d4-a716-446655440000.pdf',
  originalFileName: 'electricity-bill.pdf',
  documentSize: PDF_BUFFER.length,
  documentType: 'application/pdf',
  verificationStatus: 'pending',
  createdAt: new Date('2026-11-09T00:00:00.000Z'),
  updatedAt: new Date('2026-11-09T00:00:00.000Z'),
  encryption: {
    algorithm: 'aes-256-gcm',
    iv: 'dGVzdGl2MTIzNDU2',
    authTag: 'dGVzdGF1dGh0YWc=',
  },
};

function mockBillQuery(result) {
  const query = {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };

  BillAnalysis.findOne.mockReturnValue(query);

  return query;
}

describe('Bill Read Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAuthorizedBillLead.mockResolvedValue(lead);
    mockDecryptDocument.mockReturnValue(PDF_BUFFER);
    mockDownloadEncryptedDocument.mockResolvedValue(
      ENCRYPTED_BUFFER
    );
    mockFileTypeFromBuffer.mockResolvedValue({
      mime: 'application/pdf',
      ext: 'pdf',
    });
    mockRecordBillAuditEvent.mockResolvedValue({});
  });

  describe('getBillDocumentMetadata', () => {
    it('should return safe metadata for an authorized homeowner', async () => {
      mockBillQuery(bill);

      const result = await getBillDocumentMetadata(
        homeowner,
        LEAD_ID
      );

      expect(result).toEqual({
        id: BILL_ID,
        leadId: LEAD_ID,
        originalFileName: 'electricity-bill.pdf',
        documentSize: PDF_BUFFER.length,
        documentType: 'application/pdf',
        verificationStatus: 'pending',
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
      });

      expect(result).not.toHaveProperty('storageFileId');
      expect(result).not.toHaveProperty('storagePath');
      expect(result).not.toHaveProperty('encryption');

      expect(BillAnalysis.findOne).toHaveBeenCalledWith({
        _id: BILL_ID,
        leadId: LEAD_ID,
      });

      expect(mockRecordBillAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: ACTOR_ID,
          action: 'BILL_METADATA_VIEWED',
          billId: BILL_ID,
          leadId: LEAD_ID,
        })
      );
    });

    it('should reject access when the lead has no bill', async () => {
      mockGetAuthorizedBillLead.mockResolvedValue({
        ...lead,
        billAnalysisId: null,
      });

      await expect(
        getBillDocumentMetadata(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Bill document not found.',
      });

      expect(BillAnalysis.findOne).not.toHaveBeenCalled();
    });

    it('should reject when the linked bill record is missing', async () => {
      mockBillQuery(null);

      await expect(
        getBillDocumentMetadata(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(mockRecordBillAuditEvent).not.toHaveBeenCalled();
    });

    it('should block metadata access while deletion is in progress', async () => {
      mockBillQuery({
        ...bill,
        deletionStatus: 'deleting',
      });

      await expect(
        getBillDocumentMetadata(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Bill document is being deleted.',
      });

      expect(mockRecordBillAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('downloadBillDocument', () => {
    it('should retrieve, decrypt, validate, and return the original PDF', async () => {
      const query = mockBillQuery(bill);

      const result = await downloadBillDocument(
        homeowner,
        LEAD_ID
      );

      expect(query.select).toHaveBeenCalledWith(
        '+encryption.iv +encryption.authTag'
      );

      expect(mockDownloadEncryptedDocument).toHaveBeenCalledWith(
        bill.storagePath
      );

      expect(mockDecryptDocument).toHaveBeenCalledWith(
        ENCRYPTED_BUFFER,
        bill.encryption
      );

      expect(mockFileTypeFromBuffer).toHaveBeenCalledWith(
        PDF_BUFFER
      );

      expect(result).toEqual({
        billId: BILL_ID,
        leadId: LEAD_ID,
        buffer: PDF_BUFFER,
        originalFileName: 'electricity-bill.pdf',
        documentType: 'application/pdf',
        documentSize: PDF_BUFFER.length,
      });

      expect(mockRecordBillAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BILL_DOWNLOAD_REQUESTED',
          billId: BILL_ID,
          leadId: LEAD_ID,
        })
      );
    });

    it('should reject unauthorized access before looking up a bill', async () => {
      mockGetAuthorizedBillLead.mockRejectedValue(
        Object.assign(new Error('Lead not found.'), {
          statusCode: 404,
        })
      );

      await expect(
        downloadBillDocument(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(BillAnalysis.findOne).not.toHaveBeenCalled();
      expect(mockDownloadEncryptedDocument).not.toHaveBeenCalled();
    });

    it('should reject encrypted content with an unexpected size', async () => {
      mockBillQuery(bill);

      mockDownloadEncryptedDocument.mockResolvedValue(
        Buffer.from('short')
      );

      await expect(
        downloadBillDocument(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Stored bill document failed integrity validation.',
      });

      expect(mockDecryptDocument).not.toHaveBeenCalled();
    });

    it('should reject documents that fail AES-GCM authentication', async () => {
      mockBillQuery(bill);

      mockDecryptDocument.mockImplementation(() => {
        throw new Error('Authentication failed.');
      });

      await expect(
        downloadBillDocument(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Stored bill document failed integrity validation.',
      });
    });

    it('should reject a decrypted document with a mismatched file signature', async () => {
      mockBillQuery(bill);

      mockFileTypeFromBuffer.mockResolvedValue({
        mime: 'image/png',
        ext: 'png',
      });

      await expect(
        downloadBillDocument(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Stored bill document type validation failed.',
      });

      expect(mockRecordBillAuditEvent).not.toHaveBeenCalled();
    });

    it('should return a gateway error when ImageKit is unavailable', async () => {
      mockBillQuery(bill);

      mockDownloadEncryptedDocument.mockRejectedValue(
        new Error('ImageKit unavailable.')
      );

      await expect(
        downloadBillDocument(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 502,
        message: 'Bill document storage is temporarily unavailable.',
      });

      expect(mockDecryptDocument).not.toHaveBeenCalled();
    });

    it('should block downloads after storage deletion has started', async () => {
      mockBillQuery({
        ...bill,
        deletionStatus: 'storage_deleted',
      });

      await expect(
        downloadBillDocument(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Bill document is being deleted.',
      });

      expect(mockDownloadEncryptedDocument).not.toHaveBeenCalled();
      expect(mockDecryptDocument).not.toHaveBeenCalled();
    });
  });
});