
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthorizedBillLead: vi.fn(),
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  recordBillAuditEvent: vi.fn(),
}));

vi.mock('../src/modules/bills/bill-analysis.model.js', () => ({
  default: {
    findOne: mocks.findOne,
    findOneAndUpdate: mocks.findOneAndUpdate,
  },
}));

vi.mock('../src/modules/bills/bill-access.service.js', () => ({
  getAuthorizedBillLead: mocks.getAuthorizedBillLead,
}));

vi.mock('../src/modules/bills/bill-audit.service.js', () => ({
  recordBillAuditEvent: mocks.recordBillAuditEvent,
}));

import {
  getBillAnalysisForReview,
  verifyBillAnalysis,
} from '../src/modules/bill-analysis/bill-verification.service.js';

const STAFF_ID = '507f1f77bcf86cd799439011';
const HOMEOWNER_ID = '507f1f77bcf86cd799439012';
const LEAD_ID = '507f1f77bcf86cd799439013';
const BILL_ID = '507f1f77bcf86cd799439014';

const staff = {
  id: STAFF_ID,
  role: 'salesStaff',
};

const homeowner = {
  id: HOMEOWNER_ID,
  role: 'homeowner',
};

const lead = {
  _id: LEAD_ID,
  billAnalysisId: BILL_ID,
};

const bill = {
  _id: BILL_ID,
  leadId: LEAD_ID,
  originalFileName: 'electricity-bill.pdf',
  documentType: 'application/pdf',
  documentSize: 2048,
  ocrStatus: 'completed',
  verificationStatus: 'needs_review',
  deletionStatus: 'active',
  extractionConfidence: 0.91,
  consumerNumber: 'OCR12345',
  tariff: 'LT-I Domestic',
  sanctionedLoad: 3,
  sanctionedLoadUnit: 'kW',
  monthlyUnits: 340,
  corrections: {},
  reviewNotes: '',
  reviewedBy: null,
  reviewedAt: null,
  createdAt: new Date('2026-11-09T08:00:00.000Z'),
  updatedAt: new Date('2026-11-09T08:00:00.000Z'),
};

const completeCorrection = {
  decision: 'verified',
  fields: {
    consumerNumber: 'CORRECT12345',
    tariff: 'LT-II Commercial',
    sanctionedLoad: 5,
    sanctionedLoadUnit: 'kVA',
    monthlyUnits: 350,
  },
  reviewNotes: 'Checked against the original bill.',
};

function mockBillQuery(result) {
  mocks.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue(result),
  });
}

function mockUpdatedBillQuery(result) {
  mocks.findOneAndUpdate.mockReturnValue({
    lean: vi.fn().mockResolvedValue(result),
  });
}

describe('Bill Verification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getAuthorizedBillLead.mockResolvedValue(lead);

    mocks.recordBillAuditEvent.mockResolvedValue({
      _id: 'test-audit-event',
    });

    mockBillQuery(bill);
  });

  describe('getBillAnalysisForReview', () => {
    it('should return bill analysis to assigned Sales Staff', async () => {
      const result = await getBillAnalysisForReview(
        staff,
        LEAD_ID
      );

      expect(
        mocks.getAuthorizedBillLead
      ).toHaveBeenCalledWith(staff, LEAD_ID);

      expect(mocks.findOne).toHaveBeenCalledWith({
        _id: BILL_ID,
        leadId: LEAD_ID,
      });

      expect(result).toMatchObject({
        billId: BILL_ID,
        leadId: LEAD_ID,
        ocrStatus: 'completed',
        verificationStatus: 'needs_review',
        extractionConfidence: 0.91,
        fields: {
          consumerNumber: 'OCR12345',
          tariff: 'LT-I Domestic',
          sanctionedLoad: 3,
          sanctionedLoadUnit: 'kW',
          monthlyUnits: 340,
        },
        missingFields: [],
      });

      expect(result).not.toHaveProperty('extractedText');
      expect(result).not.toHaveProperty('storagePath');
      expect(result).not.toHaveProperty('storageFileId');
      expect(result).not.toHaveProperty('encryption');

      expect(
        mocks.recordBillAuditEvent
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: STAFF_ID,
          action: 'BILL_VERIFICATION_VIEWED',
          billId: BILL_ID,
          leadId: LEAD_ID,
        })
      );
    });

    it('should reject homeowners attempting to review bills', async () => {
      await expect(
        getBillAnalysisForReview(homeowner, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 403,
      });

      expect(
        mocks.getAuthorizedBillLead
      ).not.toHaveBeenCalled();
    });

    it('should return 404 when a lead has no bill', async () => {
      mocks.getAuthorizedBillLead.mockResolvedValue({
        ...lead,
        billAnalysisId: null,
      });

      await expect(
        getBillAnalysisForReview(staff, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(mocks.findOne).not.toHaveBeenCalled();
    });

    it('should reject a bill that is being deleted', async () => {
      mockBillQuery({
        ...bill,
        deletionStatus: 'deleting',
      });

      await expect(
        getBillAnalysisForReview(staff, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should reject review before OCR is completed', async () => {
      mockBillQuery({
        ...bill,
        ocrStatus: 'processing',
      });

      await expect(
        getBillAnalysisForReview(staff, LEAD_ID)
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should include missing fields in the review response', async () => {
      mockBillQuery({
        ...bill,
        consumerNumber: '',
        tariff: '',
        sanctionedLoad: null,
        sanctionedLoadUnit: null,
        monthlyUnits: null,
      });

      const result = await getBillAnalysisForReview(
        staff,
        LEAD_ID
      );

      expect(result.missingFields).toEqual([
        'consumerNumber',
        'tariff',
        'sanctionedLoad',
        'sanctionedLoadUnit',
        'monthlyUnits',
      ]);
    });
  });

  describe('verifyBillAnalysis', () => {
    it('should verify a bill and retain original OCR corrections', async () => {
      const updatedBill = {
        ...bill,
        verificationStatus: 'verified',
        consumerNumber: 'CORRECT12345',
        tariff: 'LT-II Commercial',
        sanctionedLoad: 5,
        sanctionedLoadUnit: 'kVA',
        monthlyUnits: 350,
        corrections: {
          consumerNumber: {
            original: 'OCR12345',
            corrected: 'CORRECT12345',
          },
          tariff: {
            original: 'LT-I Domestic',
            corrected: 'LT-II Commercial',
          },
          sanctionedLoad: {
            original: 3,
            corrected: 5,
          },
          sanctionedLoadUnit: {
            original: 'kW',
            corrected: 'kVA',
          },
          monthlyUnits: {
            original: 340,
            corrected: 350,
          },
        },
        reviewedBy: STAFF_ID,
        reviewedAt: new Date(),
      };

      mockUpdatedBillQuery(updatedBill);

      const result = await verifyBillAnalysis(
        staff,
        LEAD_ID,
        completeCorrection
      );

      expect(
        mocks.findOneAndUpdate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: BILL_ID,
          leadId: LEAD_ID,
          deletionStatus: 'active',
          ocrStatus: 'completed',
          verificationStatus: {
            $in: ['pending', 'needs_review'],
          },
        }),
        {
          $set: expect.objectContaining({
            verificationStatus: 'verified',
            consumerNumber: 'CORRECT12345',
            tariff: 'LT-II Commercial',
            sanctionedLoad: 5,
            sanctionedLoadUnit: 'kVA',
            monthlyUnits: 350,
            reviewedBy: STAFF_ID,
            reviewNotes: completeCorrection.reviewNotes,
            corrections: expect.objectContaining({
              consumerNumber: {
                original: 'OCR12345',
                corrected: 'CORRECT12345',
              },
            }),
          }),
        },
        {
          new: true,
          runValidators: true,
        }
      );

      expect(result.verificationStatus).toBe('verified');

      expect(result.fields.consumerNumber).toBe(
        'CORRECT12345'
      );

      expect(
        mocks.recordBillAuditEvent
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BILL_VERIFIED',
          actorId: STAFF_ID,
          billId: BILL_ID,
        })
      );
    });

    it('should allow verification without changing already correct fields', async () => {
      mockUpdatedBillQuery({
        ...bill,
        verificationStatus: 'verified',
        reviewedBy: STAFF_ID,
        reviewedAt: new Date(),
      });

      await verifyBillAnalysis(staff, LEAD_ID, {
        decision: 'verified',
      });

      const update =
        mocks.findOneAndUpdate.mock.calls[0][1];

      expect(update.$set.consumerNumber).toBe(
        'OCR12345'
      );

      expect(update.$set.tariff).toBe(
        'LT-I Domestic'
      );
    });

    it('should reject verification when required fields are missing', async () => {
      mockBillQuery({
        ...bill,
        consumerNumber: '',
        monthlyUnits: null,
      });

      await expect(
        verifyBillAnalysis(staff, LEAD_ID, {
          decision: 'verified',
        })
      ).rejects.toMatchObject({
        statusCode: 422,
        details: {
          missingFields: [
            'consumerNumber',
            'monthlyUnits',
          ],
        },
      });

      expect(
        mocks.findOneAndUpdate
      ).not.toHaveBeenCalled();
    });

    it('should reject a bill with a reason', async () => {
      mockUpdatedBillQuery({
        ...bill,
        verificationStatus: 'rejected',
        reviewNotes: 'The bill image is unreadable.',
        reviewedBy: STAFF_ID,
      });

      const result = await verifyBillAnalysis(
        staff,
        LEAD_ID,
        {
          decision: 'rejected',
          reviewNotes: 'The bill image is unreadable.',
        }
      );

      expect(result.verificationStatus).toBe('rejected');

      expect(
        mocks.recordBillAuditEvent
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BILL_REJECTED',
        })
      );
    });

    it('should reject a rejection without a reason', async () => {
      await expect(
        verifyBillAnalysis(staff, LEAD_ID, {
          decision: 'rejected',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
      });

      expect(
        mocks.findOneAndUpdate
      ).not.toHaveBeenCalled();
    });

    it('should prevent homeowners from verifying bills', async () => {
      await expect(
        verifyBillAnalysis(homeowner, LEAD_ID, completeCorrection)
      ).rejects.toMatchObject({
        statusCode: 403,
      });

      expect(
        mocks.getAuthorizedBillLead
      ).not.toHaveBeenCalled();
    });

    it('should reject unsupported verification decisions', async () => {
      await expect(
        verifyBillAnalysis(staff, LEAD_ID, {
          decision: 'approved',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
      });

      expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should reject unsupported field names', async () => {
      await expect(
        verifyBillAnalysis(staff, LEAD_ID, {
          decision: 'verified',
          fields: {
            consumerNumber: 'ABC12345',
            encryptionKey: 'not-allowed',
          },
        })
      ).rejects.toMatchObject({
        statusCode: 400,
      });

      expect(
        mocks.findOneAndUpdate
      ).not.toHaveBeenCalled();
    });

    it('should reject invalid sanctioned load values', async () => {
      await expect(
        verifyBillAnalysis(staff, LEAD_ID, {
          decision: 'verified',
          fields: {
            sanctionedLoad: -3,
          },
        })
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should reject an invalid sanctioned load unit', async () => {
      await expect(
        verifyBillAnalysis(staff, LEAD_ID, {
          decision: 'verified',
          fields: {
            sanctionedLoadUnit: 'MW',
          },
        })
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should reject review notes longer than 500 characters', async () => {
      await expect(
        verifyBillAnalysis(staff, LEAD_ID, {
          decision: 'rejected',
          reviewNotes: 'A'.repeat(501),
        })
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should prevent changing an already verified bill', async () => {
      mockBillQuery({
        ...bill,
        verificationStatus: 'verified',
      });

      await expect(
        verifyBillAnalysis(staff, LEAD_ID, completeCorrection)
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(
        mocks.findOneAndUpdate
      ).not.toHaveBeenCalled();
    });

    it('should prevent a second concurrent final decision', async () => {
      mocks.findOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(
        verifyBillAnalysis(staff, LEAD_ID, completeCorrection)
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });
});
