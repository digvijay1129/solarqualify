import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

vi.mock('../src/modules/leads/lead.model.js', () => ({
  default: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../src/modules/bills/bill-analysis.model.js', () => ({
  default: {
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('../src/modules/bills/bill-access.service.js', () => ({
  getAuthorizedBillLead: vi.fn(),
}));

vi.mock('../src/modules/bills/document-crypto.service.js', () => ({
  encryptDocument: vi.fn(),
}));

vi.mock('../src/modules/bills/imagekit-storage.service.js', () => ({
  uploadEncryptedDocument: vi.fn(),
  deleteStoredDocument: vi.fn(),
}));

import Lead from '../src/modules/leads/lead.model.js';
import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';
import {
  getAuthorizedBillLead,
} from '../src/modules/bills/bill-access.service.js';
import {
  encryptDocument,
} from '../src/modules/bills/document-crypto.service.js';
import {
  uploadEncryptedDocument,
  deleteStoredDocument,
} from '../src/modules/bills/imagekit-storage.service.js';

import {
  uploadBillDocument,
} from '../src/modules/bills/bill.service.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const LEAD_ID = '507f1f77bcf86cd799439014';
const BILL_ID = '507f1f77bcf86cd799439015';
const BILL_OBJECT_ID = new mongoose.Types.ObjectId(BILL_ID);

const encryptedBuffer = Buffer.from('encrypted electricity bill');

const encryption = {
  algorithm: 'aes-256-gcm',
  iv: 'dGVzdGl2MTIzNDU2',
  authTag: 'dGVzdGF1dGh0YWc=',
};

const storageResult = {
  storageProvider: 'imagekit',
  storageFileId: 'imagekit-file-123',
  storagePath:
    '/solarqualify/bills/550e8400-e29b-41d4-a716-446655440000.pdf',
  documentSize: encryptedBuffer.length,
  storageFileType: 'non-image',
};

const file = {
  buffer: Buffer.from('%PDF-1.7 test bill'),
  originalname: 'electricity-bill.pdf',
  detectedMimeType: 'application/pdf',
  detectedExtension: 'pdf',
};

const homeowner = {
  id: HOMEOWNER_ID,
  role: 'homeowner',
};

const salesStaff = {
  id: STAFF_ID,
  role: 'salesStaff',
};

function createBillDocument() {
  return {
    _id: BILL_OBJECT_ID,
    leadId: { toString: () => LEAD_ID },
    originalFileName: 'electricity-bill.pdf',
    documentSize: file.buffer.length,
    documentType: 'application/pdf',
    verificationStatus: 'pending',
    createdAt: new Date('2026-11-09T00:00:00.000Z'),
    updatedAt: new Date('2026-11-09T00:00:00.000Z'),
    encryption,
  };
}

describe('Bill Upload Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    getAuthorizedBillLead.mockResolvedValue({
      _id: LEAD_ID,
      homeownerId: HOMEOWNER_ID,
      assignedSalesStaffId: STAFF_ID,
      billAnalysisId: null,
    });

    encryptDocument.mockReturnValue({
      encryptedBuffer,
      encryption,
    });

    uploadEncryptedDocument.mockResolvedValue(storageResult);

    BillAnalysis.create.mockResolvedValue(createBillDocument());
    BillAnalysis.deleteOne.mockResolvedValue({ deletedCount: 1 });

    Lead.findOneAndUpdate.mockResolvedValue({
      _id: LEAD_ID,
      billAnalysisId: BILL_ID,
    });

    deleteStoredDocument.mockResolvedValue(undefined);
  });

  it('should encrypt, privately upload, and link a homeowner bill', async () => {
    const result = await uploadBillDocument(
      homeowner,
      LEAD_ID,
      file
    );

    expect(getAuthorizedBillLead).toHaveBeenCalledWith(
      homeowner,
      LEAD_ID
    );

    expect(encryptDocument).toHaveBeenCalledWith(file.buffer);

    expect(uploadEncryptedDocument).toHaveBeenCalledWith(
      encryptedBuffer,
      'pdf'
    );

    expect(BillAnalysis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: LEAD_ID,
        storageProvider: 'imagekit',
        storageFileId: 'imagekit-file-123',
        storagePath: storageResult.storagePath,
        originalFileName: 'electricity-bill.pdf',
        documentSize: file.buffer.length,
        encryption,
        documentType: 'application/pdf',
        verificationStatus: 'pending',
      })
    );

    expect(Lead.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: LEAD_ID,
        homeownerId: HOMEOWNER_ID,
        billAnalysisId: null,
      },
      {
        $set: {
          billAnalysisId: BILL_OBJECT_ID,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    expect(result).toEqual({
      id: BILL_ID,
      leadId: LEAD_ID,
      originalFileName: 'electricity-bill.pdf',
      documentSize: file.buffer.length,
      documentType: 'application/pdf',
      verificationStatus: 'pending',
      createdAt: new Date('2026-11-09T00:00:00.000Z'),
      updatedAt: new Date('2026-11-09T00:00:00.000Z'),
    });

    expect(result).not.toHaveProperty('storageFileId');
    expect(result).not.toHaveProperty('storagePath');
    expect(result).not.toHaveProperty('encryption');
  });

  it('should restrict the bill link to the assigned Sales Staff member', async () => {
    await uploadBillDocument(salesStaff, LEAD_ID, file);

    expect(Lead.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: LEAD_ID,
        assignedSalesStaffId: STAFF_ID,
        billAnalysisId: null,
      },
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should reject uploads when a bill already exists', async () => {
    getAuthorizedBillLead.mockResolvedValue({
      _id: LEAD_ID,
      billAnalysisId: BILL_ID,
    });

    await expect(
      uploadBillDocument(homeowner, LEAD_ID, file)
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(encryptDocument).not.toHaveBeenCalled();
    expect(uploadEncryptedDocument).not.toHaveBeenCalled();
    expect(BillAnalysis.create).not.toHaveBeenCalled();
  });

  it('should reject invalid file content', async () => {
    await expect(
      uploadBillDocument(homeowner, LEAD_ID, {
        ...file,
        buffer: 'not a buffer',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(uploadEncryptedDocument).not.toHaveBeenCalled();
  });

  it('should reject untrusted MIME and extension metadata', async () => {
    await expect(
      uploadBillDocument(homeowner, LEAD_ID, {
        ...file,
        detectedMimeType: 'application/zip',
        detectedExtension: 'zip',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(encryptDocument).not.toHaveBeenCalled();
  });

  it('should sanitize directory information from the original filename', async () => {
    await uploadBillDocument(homeowner, LEAD_ID, {
      ...file,
      originalname: 'C:\\fakepath\\electricity-bill.pdf',
    });

    expect(BillAnalysis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        originalFileName: 'electricity-bill.pdf',
      })
    );
  });

  it('should delete the ImageKit file if MongoDB creation fails', async () => {
    const databaseError = new Error('MongoDB write failed');

    BillAnalysis.create.mockRejectedValue(databaseError);

    await expect(
      uploadBillDocument(homeowner, LEAD_ID, file)
    ).rejects.toBe(databaseError);

    expect(deleteStoredDocument).toHaveBeenCalledWith(
      storageResult.storageFileId
    );
  });

  it('should clean up MongoDB and ImageKit when lead linking fails', async () => {
    const conflict = {
      statusCode: 409,
      message: 'Lead state changed.',
    };

    Lead.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      uploadBillDocument(homeowner, LEAD_ID, file)
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(BillAnalysis.deleteOne).toHaveBeenCalledWith({
      _id: BILL_OBJECT_ID,
    });

    expect(deleteStoredDocument).toHaveBeenCalledWith(
      storageResult.storageFileId
    );

    expect(conflict.statusCode).toBe(409);
  });

  it('should report cleanup failures instead of hiding orphaned files', async () => {
    Lead.findOneAndUpdate.mockResolvedValue(null);

    deleteStoredDocument.mockRejectedValue(
      new Error('ImageKit cleanup failed')
    );

    await expect(
      uploadBillDocument(homeowner, LEAD_ID, file)
    ).rejects.toBeInstanceOf(AggregateError);
  });
});