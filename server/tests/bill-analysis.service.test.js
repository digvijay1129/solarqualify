
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthorizedBillLead: vi.fn(),

  findOneAndUpdate: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),

  downloadEncryptedDocument: vi.fn(),
  decryptDocument: vi.fn(),
  fileTypeFromBuffer: vi.fn(),

  recognizeBillImage: vi.fn(),
  processBillPdf: vi.fn(),

  recordBillAuditEvent: vi.fn(),
}));

vi.mock('../src/modules/bills/bill-analysis.model.js', () => ({
  default: {
    findOneAndUpdate: mocks.findOneAndUpdate,
    findOne: mocks.findOne,
    updateOne: mocks.updateOne,
  },
}));

vi.mock('../src/modules/bills/bill-access.service.js', () => ({
  getAuthorizedBillLead: mocks.getAuthorizedBillLead,
}));

vi.mock('../src/modules/bills/document-crypto.service.js', () => ({
  decryptDocument: mocks.decryptDocument,
}));

vi.mock('../src/modules/bills/imagekit-storage.service.js', () => ({
  downloadEncryptedDocument: mocks.downloadEncryptedDocument,
}));

vi.mock('file-type', () => ({
  fileTypeFromBuffer: mocks.fileTypeFromBuffer,
}));

vi.mock('../src/modules/bill-analysis/bill-ocr.service.js', () => ({
  recognizeBillImage: mocks.recognizeBillImage,
}));

vi.mock('../src/modules/bill-analysis/bill-pdf.service.js', () => ({
  recognizeBillImage: mocks.recognizeBillImage,

  processBillPdf: mocks.processBillPdf,

  BillPdfProcessingError: class BillPdfProcessingError extends Error {
    constructor(message, code, cause) {
      super(message, cause ? { cause } : undefined);
      this.name = 'BillPdfProcessingError';
      this.code = code;
    }
  },
}));

vi.mock('../src/modules/bills/bill-audit.service.js', () => ({
  recordBillAuditEvent: mocks.recordBillAuditEvent,
}));

import {
  analyzeBillDocument,
} from '../src/modules/bill-analysis/bill-analysis.service.js';

const USER_ID = '507f1f77bcf86cd799439011';
const LEAD_ID = '507f1f77bcf86cd799439012';
const BILL_ID = '507f1f77bcf86cd799439013';

const user = {
  id: USER_ID,
  role: 'homeowner',
};

const documentBuffer = Buffer.from('image-file');

const encryptedBuffer = Buffer.from('image-file');

const imageOcrText = `
  Consumer No: ABC123456
  Tariff Category: LT-I Domestic
  Sanctioned Load: 3 kW
  Units Consumed: 340
`;

const baseBill = {
  _id: BILL_ID,
  leadId: LEAD_ID,
  storageProvider: 'imagekit',
  storageFileId: 'imagekit-test-file',
  storagePath: '/solarqualify/bills/test.jpg',
  documentSize: documentBuffer.length,
  documentType: 'image/jpeg',

  encryption: {
    algorithm: 'aes-256-gcm',
    iv: 'test-iv',
    authTag: 'test-auth-tag',
  },

  deletionStatus: 'active',
  ocrStatus: 'processing',
  ocrAttempts: 1,
};

function mockClaimedBill(overrides = {}) {
  const query = {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue({
      ...baseBill,
      ...overrides,
    }),
  };

  mocks.findOneAndUpdate.mockReturnValue(query);

  return query;
}

function mockExistingBill(result) {
  const query = {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };

  mocks.findOne.mockReturnValue(query);

  return query;
}

function mockSuccessfulImagePipeline() {
  mocks.downloadEncryptedDocument.mockResolvedValue(
    encryptedBuffer
  );

  mocks.decryptDocument.mockReturnValue(
    documentBuffer
  );

  mocks.fileTypeFromBuffer.mockResolvedValue({
    mime: 'image/jpeg',
    ext: 'jpg',
  });

  mocks.recognizeBillImage.mockResolvedValue({
    text: imageOcrText,
    confidence: 0.92,
  });

  mocks.updateOne.mockResolvedValue({
    matchedCount: 1,
    modifiedCount: 1,
  });
}

describe('Bill Analysis Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getAuthorizedBillLead.mockResolvedValue({
      _id: LEAD_ID,
      billAnalysisId: BILL_ID,
    });

    mocks.recordBillAuditEvent.mockResolvedValue({
      _id: 'test-audit-id',
    });

    mockClaimedBill();
    mockSuccessfulImagePipeline();
  });

  it('should process an image bill and persist extracted fields', async () => {
    const result = await analyzeBillDocument(
      user,
      LEAD_ID
    );

    expect(
      mocks.getAuthorizedBillLead
    ).toHaveBeenCalledWith(user, LEAD_ID);

    expect(
      mocks.findOneAndUpdate
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: BILL_ID,
        leadId: LEAD_ID,
        deletionStatus: 'active',
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          ocrStatus: 'processing',
        }),
        $inc: {
          ocrAttempts: 1,
        },
      }),
      expect.objectContaining({
        new: true,
        runValidators: true,
      })
    );

    expect(
      mocks.decryptDocument
    ).toHaveBeenCalledWith(
      encryptedBuffer,
      baseBill.encryption
    );

    expect(
      mocks.recognizeBillImage
    ).toHaveBeenCalledWith(
      documentBuffer,
      'image/jpeg'
    );

    expect(mocks.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: BILL_ID,
        leadId: LEAD_ID,
        ocrStatus: 'processing',
        deletionStatus: 'active',
        ocrLockId: expect.any(String),
      }),
      {
        $set: expect.objectContaining({
          extractedText: imageOcrText,
          consumerNumber: 'ABC123456',
          tariff: 'LT-I Domestic',
          sanctionedLoad: 3,
          sanctionedLoadUnit: 'kW',
          monthlyUnits: 340,
          extractionConfidence: 0.92,
          ocrStatus: 'completed',
          verificationStatus: 'needs_review',
          reviewedBy: null,
          reviewedAt: null,
          ocrLockId: null,
        }),
      },
      expect.objectContaining({
        runValidators: true,
      })
    );

    expect(result).toMatchObject({
      billId: BILL_ID,
      leadId: LEAD_ID,
      ocrStatus: 'completed',
      verificationStatus: 'needs_review',
      extractionMethod: 'ocr',
      extractionConfidence: 0.92,
      fields: {
        consumerNumber: 'ABC123456',
        tariff: 'LT-I Domestic',
        sanctionedLoad: 3,
        sanctionedLoadUnit: 'kW',
        monthlyUnits: 340,
      },
      missingFields: [],
    });

    expect(result).not.toHaveProperty('extractedText');
  });

  it('should process PDF documents using the PDF processing service', async () => {
    const pdfBill = {
      ...baseBill,
      documentType: 'application/pdf',
      storagePath: '/solarqualify/bills/test.pdf',
    };

    mockClaimedBill(pdfBill);

    mocks.fileTypeFromBuffer.mockResolvedValue({
      mime: 'application/pdf',
      ext: 'pdf',
    });

    mocks.processBillPdf.mockResolvedValue({
      text: imageOcrText,
      pageCount: 1,
      extractionMethod: 'embedded_text',
      ocrConfidence: null,
      pages: [],
    });

    const result = await analyzeBillDocument(
      user,
      LEAD_ID
    );

    expect(
      mocks.processBillPdf
    ).toHaveBeenCalledWith(documentBuffer);

    expect(
      mocks.recognizeBillImage
    ).not.toHaveBeenCalled();

    expect(result.extractionMethod).toBe(
      'embedded_text'
    );

    expect(result.extractionConfidence).toBeNull();
  });

  it('should reject a lead without an attached bill', async () => {
    mocks.getAuthorizedBillLead.mockResolvedValue({
      _id: LEAD_ID,
      billAnalysisId: null,
    });

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(
      mocks.findOneAndUpdate
    ).not.toHaveBeenCalled();
  });

  it('should return 404 when the linked bill record does not exist', async () => {
    mockClaimedBill();
    mockClaimedBill();

    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    };

    mocks.findOneAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    mocks.findOne.mockReturnValue(query);

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('should reject concurrent OCR requests', async () => {
    mocks.findOneAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    mockExistingBill({
      ocrStatus: 'processing',
      deletionStatus: 'active',
    });

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(
      mocks.downloadEncryptedDocument
    ).not.toHaveBeenCalled();
  });

  it('should reject processing when the bill is being deleted', async () => {
    mocks.findOneAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    mockExistingBill({
      ocrStatus: 'not_started',
      deletionStatus: 'deleting',
    });

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(
      mocks.downloadEncryptedDocument
    ).not.toHaveBeenCalled();
  });

  it('should reject already completed OCR jobs', async () => {
    mocks.findOneAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    mockExistingBill({
      ocrStatus: 'completed',
      deletionStatus: 'active',
    });

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('should retry failed OCR jobs through the atomic claim', async () => {
    await analyzeBillDocument(user, LEAD_ID);

    const filter = mocks.findOneAndUpdate.mock.calls[0][0];

    expect(filter.$or).toEqual(
      expect.arrayContaining([
        { ocrStatus: 'failed' },
        { ocrStatus: 'not_started' },
      ])
    );
  });

  it('should report document storage failures and save a failed state', async () => {
    mocks.downloadEncryptedDocument.mockRejectedValue(
      new Error('Remote storage unavailable')
    );

    const result = await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 502,
      details: {
        code: 'DOCUMENT_STORAGE_UNAVAILABLE',
      },
    });

    expect(result).toBeDefined();

    expect(mocks.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: BILL_ID,
        ocrStatus: 'processing',
        ocrLockId: expect.any(String),
      }),
      {
        $set: expect.objectContaining({
          ocrStatus: 'failed',
          ocrErrorCode: 'DOCUMENT_STORAGE_UNAVAILABLE',
          ocrLockId: null,
        }),
      },
      expect.any(Object)
    );

    expect(
      mocks.recordBillAuditEvent
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BILL_OCR_FAILED',
      })
    );
  });

  it('should reject encrypted documents with unexpected size', async () => {
    mocks.downloadEncryptedDocument.mockResolvedValue(
      Buffer.from('unexpected-length')
    );

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 500,
      details: {
        code: 'DOCUMENT_INTEGRITY_FAILED',
      },
    });

    expect(mocks.decryptDocument).not.toHaveBeenCalled();
  });

  it('should reject documents whose actual type does not match stored metadata', async () => {
    mocks.fileTypeFromBuffer.mockResolvedValue({
      mime: 'application/pdf',
      ext: 'pdf',
    });

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 500,
      details: {
        code: 'DOCUMENT_TYPE_MISMATCH',
      },
    });

    expect(
      mocks.recognizeBillImage
    ).not.toHaveBeenCalled();
  });

  it('should mark OCR engine failures and allow future retries', async () => {
    mocks.recognizeBillImage.mockRejectedValue(
      new Error('OCR engine unavailable')
    );

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 502,
      details: {
        code: 'OCR_PROCESSING_FAILED',
      },
    });

    const failureUpdate = mocks.updateOne.mock.calls[0];

    expect(failureUpdate[1].$set).toMatchObject({
      ocrStatus: 'failed',
      ocrErrorCode: 'OCR_PROCESSING_FAILED',
      ocrLockId: null,
    });
  });

  it('should not persist results if the worker loses its lock', async () => {
    mocks.updateOne.mockResolvedValueOnce({
      matchedCount: 0,
      modifiedCount: 0,
    });

    await expect(
      analyzeBillDocument(user, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 409,
      details: {
        code: 'OCR_CLAIM_LOST',
      },
    });

    expect(
      mocks.recordBillAuditEvent
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BILL_OCR_REQUESTED',
      })
    );
  });

  it('should record an OCR completion audit event after persistence', async () => {
    await analyzeBillDocument(user, LEAD_ID);

    const actions = mocks.recordBillAuditEvent.mock.calls.map(
      ([event]) => event.action
    );

    expect(actions).toEqual([
      'BILL_OCR_REQUESTED',
      'BILL_OCR_COMPLETED',
    ]);
  });
});
