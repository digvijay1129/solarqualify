
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import jwt from 'jsonwebtoken';
import request from 'supertest';

const services = vi.hoisted(() => ({
  getBillAnalysisForReview: vi.fn(),
  verifyBillAnalysis: vi.fn(),
}));

vi.mock(
  '../src/modules/bill-analysis/bill-verification.service.js',
  () => ({
    getBillAnalysisForReview:
      services.getBillAnalysisForReview,
    verifyBillAnalysis:
      services.verifyBillAnalysis,
  })
);

vi.mock('../src/modules/users/user.model.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const LEAD_ID = '507f1f77bcf86cd799439013';
const BILL_ID = '507f1f77bcf86cd799439014';

const reviewResult = {
  billId: BILL_ID,
  leadId: LEAD_ID,
  originalFileName: 'electricity-bill.pdf',
  documentType: 'application/pdf',
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
  corrections: {},
  reviewNotes: '',
  reviewedBy: null,
  reviewedAt: null,
};

const verifiedResult = {
  ...reviewResult,
  verificationStatus: 'verified',
  fields: {
    consumerNumber: 'CORRECT12345',
    tariff: 'LT-I Domestic',
    sanctionedLoad: 3,
    sanctionedLoadUnit: 'kW',
    monthlyUnits: 340,
  },
  corrections: {
    consumerNumber: {
      original: 'OCR12345',
      corrected: 'CORRECT12345',
    },
  },
  reviewNotes: 'Checked against the original bill.',
  reviewedBy: STAFF_ID,
  reviewedAt: new Date('2026-11-09T12:00:00.000Z'),
};

function createToken(userId, role = 'homeowner') {
  return jwt.sign(
    { role },
    env.JWT_SECRET,
    {
      subject: userId,
      expiresIn: '1h',
      issuer: 'solarqualify-api',
    }
  );
}

function authenticate(userId, role = 'homeowner') {
  return {
    Authorization: `Bearer ${createToken(userId, role)}`,
  };
}

function mockAuthenticatedUser(userId, role) {
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      _id: {
        toString: () => userId,
      },
      name: 'Test User',
      email: 'test@example.com',
      role,
      phone: '9876543210',
      isActive: true,
    }),
  });
}

describe('Bill Verification HTTP API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/leads/:leadId/bill/review', () => {
    it('should reject review requests without authentication', async () => {
      await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill/review`)
        .expect(401);

      expect(
        services.getBillAnalysisForReview
      ).not.toHaveBeenCalled();
    });

    it('should allow Sales Staff to retrieve bill analysis', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      services.getBillAnalysisForReview.mockResolvedValue(
        reviewResult
      );

      const response = await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill/review`)
        .set(authenticate(STAFF_ID, 'homeowner'))
        .expect(200);

      expect(
        services.getBillAnalysisForReview
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: STAFF_ID,
          role: 'salesStaff',
        }),
        LEAD_ID
      );

      expect(response.body).toMatchObject({
        success: true,
        message: 'Bill analysis retrieved for manual review.',
        data: {
          analysis: {
            billId: BILL_ID,
            leadId: LEAD_ID,
            ocrStatus: 'completed',
            verificationStatus: 'needs_review',
            fields: reviewResult.fields,
          },
        },
      });

      expect(
        response.body.data.analysis
      ).not.toHaveProperty('extractedText');

      expect(
        response.body.data.analysis
      ).not.toHaveProperty('storagePath');

      expect(
        response.body.data.analysis
      ).not.toHaveProperty('encryption');
    });

    it('should reject homeowners from accessing the review endpoint', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

      await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill/review`)
        .set(authenticate(HOMEOWNER_ID))
        .expect(403);

      expect(
        services.getBillAnalysisForReview
      ).not.toHaveBeenCalled();
    });

    it('should reject users with unauthorized database roles', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'installer');

      await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill/review`)
        .set(authenticate(HOMEOWNER_ID, 'salesStaff'))
        .expect(403);

      expect(
        services.getBillAnalysisForReview
      ).not.toHaveBeenCalled();
    });

    it('should pass missing bill errors through the error handler', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      const error = new Error('Bill document not found.');
      error.statusCode = 404;

      services.getBillAnalysisForReview.mockRejectedValue(
        error
      );

      await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill/review`)
        .set(authenticate(STAFF_ID, 'salesStaff'))
        .expect(404);
    });
  });

  describe('PATCH /api/v1/leads/:leadId/bill/verification', () => {
    it('should reject verification requests without authentication', async () => {
      await request(app)
        .patch(`/api/v1/leads/${LEAD_ID}/bill/verification`)
        .send({
          decision: 'verified',
        })
        .expect(401);

      expect(
        services.verifyBillAnalysis
      ).not.toHaveBeenCalled();
    });

    it('should allow Sales Staff to verify a bill with corrections', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      services.verifyBillAnalysis.mockResolvedValue(
        verifiedResult
      );

      const payload = {
        decision: 'verified',
        fields: {
          consumerNumber: 'CORRECT12345',
        },
        reviewNotes: 'Checked against the original bill.',
      };

      const response = await request(app)
        .patch(`/api/v1/leads/${LEAD_ID}/bill/verification`)
        .set(authenticate(STAFF_ID, 'homeowner'))
        .send(payload)
        .expect(200);

      expect(
        services.verifyBillAnalysis
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: STAFF_ID,
          role: 'salesStaff',
        }),
        LEAD_ID,
        payload
      );

      expect(response.body).toMatchObject({
        success: true,
        message: 'Bill verified successfully.',
        data: {
          analysis: {
            billId: BILL_ID,
            verificationStatus: 'verified',
            fields: {
              consumerNumber: 'CORRECT12345',
            },
          },
        },
      });
    });

    it('should allow Sales Staff to reject a bill', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      const rejectedResult = {
        ...reviewResult,
        verificationStatus: 'rejected',
        reviewNotes: 'Uploaded document is unreadable.',
      };

      services.verifyBillAnalysis.mockResolvedValue(
        rejectedResult
      );

      const payload = {
        decision: 'rejected',
        reviewNotes: 'Uploaded document is unreadable.',
      };

      const response = await request(app)
        .patch(`/api/v1/leads/${LEAD_ID}/bill/verification`)
        .set(authenticate(STAFF_ID, 'salesStaff'))
        .send(payload)
        .expect(200);

      expect(
        services.verifyBillAnalysis
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: STAFF_ID,
          role: 'salesStaff',
        }),
        LEAD_ID,
        payload
      );

      expect(response.body).toMatchObject({
        success: true,
        message: 'Bill rejected successfully.',
        data: {
          analysis: {
            verificationStatus: 'rejected',
          },
        },
      });
    });

    it('should reject homeowners attempting to verify bills', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

      await request(app)
        .patch(`/api/v1/leads/${LEAD_ID}/bill/verification`)
        .set(authenticate(HOMEOWNER_ID))
        .send({
          decision: 'verified',
        })
        .expect(403);

      expect(
        services.verifyBillAnalysis
      ).not.toHaveBeenCalled();
    });

    it('should reject users with unauthorized database roles', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'installer');

      await request(app)
        .patch(`/api/v1/leads/${LEAD_ID}/bill/verification`)
        .set(authenticate(HOMEOWNER_ID, 'salesStaff'))
        .send({
          decision: 'verified',
        })
        .expect(403);

      expect(
        services.verifyBillAnalysis
      ).not.toHaveBeenCalled();
    });

    it('should pass verification conflicts through the error handler', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      const error = new Error(
        'Bill verification state changed. Refresh and try again.'
      );

      error.statusCode = 409;

      services.verifyBillAnalysis.mockRejectedValue(
        error
      );

      await request(app)
        .patch(`/api/v1/leads/${LEAD_ID}/bill/verification`)
        .set(authenticate(STAFF_ID, 'salesStaff'))
        .send({
          decision: 'verified',
        })
        .expect(409);
    });

    it('should pass invalid verification payload errors through the error handler', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      const error = new Error(
        'Decision must be verified or rejected.'
      );

      error.statusCode = 400;

      services.verifyBillAnalysis.mockRejectedValue(
        error
      );

      await request(app)
        .patch(`/api/v1/leads/${LEAD_ID}/bill/verification`)
        .set(authenticate(STAFF_ID, 'salesStaff'))
        .send({
          decision: 'approved',
        })
        .expect(400);
    });
  });
});
