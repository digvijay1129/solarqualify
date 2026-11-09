import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const billServices = vi.hoisted(() => ({
  uploadBillDocument: vi.fn(),
  getBillDocumentMetadata: vi.fn(),
  downloadBillDocument: vi.fn(),
  deleteBillDocument: vi.fn(),
}));

vi.mock('../src/modules/bills/bill.service.js', () => ({
  uploadBillDocument: billServices.uploadBillDocument,
}));

vi.mock('../src/modules/bills/bill-read.service.js', () => ({
  getBillDocumentMetadata: billServices.getBillDocumentMetadata,
  downloadBillDocument: billServices.downloadBillDocument,
}));

vi.mock('../src/modules/bills/bill-deletion.service.js', () => ({
  deleteBillDocument: billServices.deleteBillDocument,
}));

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

const PDF_BUFFER = Buffer.from(
  '%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF'
);

const billResult = {
  id: '507f1f77bcf86cd799439014',
  leadId: LEAD_ID,
  originalFileName: 'electricity bill.pdf',
  documentSize: PDF_BUFFER.length,
  documentType: 'application/pdf',
  verificationStatus: 'pending',
  createdAt: new Date('2026-11-09T00:00:00.000Z'),
  updatedAt: new Date('2026-11-09T00:00:00.000Z'),
};

const deletionResult = {
  billId: billResult.id,
  leadId: LEAD_ID,
  deleted: true,
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

function mockAuthenticatedUser(userId, role) {
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      _id: { toString: () => userId },
      name: 'Test User',
      email: 'test@example.com',
      role,
      phone: '9876543210',
      isActive: true,
    }),
  });
}

function authenticate(userId, role = 'homeowner') {
  return {
    Authorization: `Bearer ${createToken(userId, role)}`,
  };
}

function parseBinary(response, callback) {
  const chunks = [];

  response.on('data', (chunk) => chunks.push(chunk));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
}

describe('Bills HTTP API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/leads/:leadId/bill', () => {
    it('should reject bill uploads without authentication', async () => {
      await request(app)
        .post(`/api/v1/leads/${LEAD_ID}/bill`)
        .expect(401);

      expect(
        billServices.uploadBillDocument
      ).not.toHaveBeenCalled();
    });

    it('should allow an authenticated homeowner to upload a valid PDF', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');
      billServices.uploadBillDocument.mockResolvedValue(
        billResult
      );

      const response = await request(app)
        .post(`/api/v1/leads/${LEAD_ID}/bill`)
        .set(authenticate(HOMEOWNER_ID))
        .attach('bill', PDF_BUFFER, {
          filename: 'electricity bill.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(
        billServices.uploadBillDocument
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: HOMEOWNER_ID,
          role: 'homeowner',
        }),
        LEAD_ID,
        expect.objectContaining({
          originalname: 'electricity bill.pdf',
          detectedMimeType: 'application/pdf',
          detectedExtension: 'pdf',
        })
      );

      expect(response.body).toMatchObject({
        success: true,
        message: 'Bill document uploaded successfully.',
        data: {
          bill: {
            id: billResult.id,
            leadId: LEAD_ID,
            documentType: 'application/pdf',
          },
        },
      });
    });

    it('should reject a file with an invalid PDF signature', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

      await request(app)
        .post(`/api/v1/leads/${LEAD_ID}/bill`)
        .set(authenticate(HOMEOWNER_ID))
        .attach('bill', Buffer.from('not a real PDF'), {
          filename: 'fake.pdf',
          contentType: 'application/pdf',
        })
        .expect(415);

      expect(
        billServices.uploadBillDocument
      ).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/leads/:leadId/bill', () => {
    it('should reject metadata requests without authentication', async () => {
      await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill`)
        .expect(401);

      expect(
        billServices.getBillDocumentMetadata
      ).not.toHaveBeenCalled();
    });

    it('should return bill metadata to an authorized homeowner', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

      billServices.getBillDocumentMetadata.mockResolvedValue(
        billResult
      );

      const response = await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill`)
        .set(authenticate(HOMEOWNER_ID))
        .expect(200);

      expect(
        billServices.getBillDocumentMetadata
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: HOMEOWNER_ID,
          role: 'homeowner',
        }),
        LEAD_ID
      );

      expect(response.body).toMatchObject({
        success: true,
        message: 'Bill metadata retrieved successfully.',
        data: {
          bill: {
            id: billResult.id,
            leadId: LEAD_ID,
            originalFileName: 'electricity bill.pdf',
            documentType: 'application/pdf',
          },
        },
      });

      expect(response.body.data.bill).not.toHaveProperty(
        'storageFileId'
      );
      expect(response.body.data.bill).not.toHaveProperty(
        'storagePath'
      );
      expect(response.body.data.bill).not.toHaveProperty(
        'encryption'
      );
    });
  });

  describe('GET /api/v1/leads/:leadId/bill/download', () => {
    it('should return the original document with secure download headers', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      billServices.downloadBillDocument.mockResolvedValue({
        billId: billResult.id,
        leadId: LEAD_ID,
        buffer: PDF_BUFFER,
        originalFileName: 'electricity bill.pdf',
        documentType: 'application/pdf',
        documentSize: PDF_BUFFER.length,
      });

      const response = await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill/download`)
        .set(authenticate(STAFF_ID, 'homeowner'))
        .buffer(true)
        .parse(parseBinary)
        .expect(200);

      expect(
        billServices.downloadBillDocument
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: STAFF_ID,
          role: 'salesStaff',
        }),
        LEAD_ID
      );

      expect(response.headers['content-type']).toContain(
        'application/pdf'
      );

      expect(response.headers['content-disposition']).toContain(
        'attachment'
      );

      expect(response.headers['content-disposition']).toContain(
        'filename="electricity bill.pdf"'
      );

      expect(response.headers['content-disposition']).toContain(
        "filename*=UTF-8''electricity%20bill.pdf"
      );

      expect(response.headers['content-length']).toBe(
        String(PDF_BUFFER.length)
      );

      expect(response.headers['cache-control']).toContain(
        'no-store'
      );

      expect(response.headers['x-content-type-options']).toBe(
        'nosniff'
      );

      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.equals(PDF_BUFFER)).toBe(true);
    });

    it('should reject users whose database role is not permitted', async () => {
      // The database role is authoritative, not the JWT role claim.
      mockAuthenticatedUser(HOMEOWNER_ID, 'installer');

      await request(app)
        .get(`/api/v1/leads/${LEAD_ID}/bill/download`)
        .set(authenticate(HOMEOWNER_ID, 'homeowner'))
        .expect(403);

      expect(
        billServices.downloadBillDocument
      ).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/leads/:leadId/bill', () => {
    it('should reject bill deletion without authentication', async () => {
      await request(app)
        .delete(`/api/v1/leads/${LEAD_ID}/bill`)
        .expect(401);

      expect(
        billServices.deleteBillDocument
      ).not.toHaveBeenCalled();
    });

    it('should allow an authenticated homeowner to delete a bill', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

      billServices.deleteBillDocument.mockResolvedValue(
        deletionResult
      );

      const response = await request(app)
        .delete(`/api/v1/leads/${LEAD_ID}/bill`)
        .set(authenticate(HOMEOWNER_ID))
        .expect(200);

      expect(
        billServices.deleteBillDocument
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: HOMEOWNER_ID,
          role: 'homeowner',
        }),
        LEAD_ID
      );

      expect(response.body).toMatchObject({
        success: true,
        message: 'Bill document deleted successfully.',
        data: {
          bill: {
            billId: billResult.id,
            leadId: LEAD_ID,
            deleted: true,
          },
        },
      });
    });

    it('should allow an authenticated Sales Staff user to request deletion', async () => {
      mockAuthenticatedUser(STAFF_ID, 'salesStaff');

      billServices.deleteBillDocument.mockResolvedValue(
        deletionResult
      );

      const response = await request(app)
        .delete(`/api/v1/leads/${LEAD_ID}/bill`)
        // Database role is authoritative over the JWT role claim.
        .set(authenticate(STAFF_ID, 'homeowner'))
        .expect(200);

      expect(
        billServices.deleteBillDocument
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: STAFF_ID,
          role: 'salesStaff',
        }),
        LEAD_ID
      );

      expect(response.body.data.bill).toEqual(
        deletionResult
      );
    });

    it('should reject users whose database role is not permitted', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'installer');

      await request(app)
        .delete(`/api/v1/leads/${LEAD_ID}/bill`)
        .set(authenticate(HOMEOWNER_ID, 'homeowner'))
        .expect(403);

      expect(
        billServices.deleteBillDocument
      ).not.toHaveBeenCalled();
    });

    it('should return the deletion service conflict status', async () => {
      mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

      const conflictError = new Error(
        'Bill document is already being deleted.'
      );
      conflictError.statusCode = 409;

      billServices.deleteBillDocument.mockRejectedValue(
        conflictError
      );

      await request(app)
        .delete(`/api/v1/leads/${LEAD_ID}/bill`)
        .set(authenticate(HOMEOWNER_ID))
        .expect(409);

      expect(
        billServices.deleteBillDocument
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: HOMEOWNER_ID,
          role: 'homeowner',
        }),
        LEAD_ID
      );
    });
  });
});