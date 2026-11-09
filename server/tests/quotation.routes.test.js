import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const quotations = vi.hoisted(() => ({
  createQuotation: vi.fn(),
  getLeadQuotations: vi.fn(),
  getQuotation: vi.fn(),
  downloadQuotationPdf: vi.fn(),
}));

vi.mock('../src/modules/quotations/quotation.service.js', () => ({ ...quotations }));
vi.mock('../src/modules/users/user.model.js', () => ({ default: { findById: vi.fn() } }));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const LEAD_ID = '507f1f77bcf86cd799439014';
const QUOTATION_ID = '507f1f77bcf86cd799439016';

function token(id, role = 'homeowner') {
  return jwt.sign({ role }, env.JWT_SECRET, { subject: id, expiresIn: '1h', issuer: 'solarqualify-api' });
}
function auth(id, role = 'homeowner') { return { Authorization: 'Bearer ' + token(id, role) }; }
function mockUser(id, role) {
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      _id: { toString: () => id }, name: 'Test User', email: 'test@example.com',
      role, phone: '9876543210', isActive: true,
    }),
  });
}
const quote = {
  id: QUOTATION_ID,
  quotationNumber: 'SQ-' + QUOTATION_ID.slice(-8).toUpperCase(),
  quotationStatus: 'generated',
  systemCapacityKW: 3,
};

describe('Quotation HTTP API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication to create quotations', async () => {
    await request(app).post('/api/v1/leads/' + LEAD_ID + '/quotations').send({}).expect(401);
    expect(quotations.createQuotation).not.toHaveBeenCalled();
  });

  it('allows Sales Staff to generate quotations', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    quotations.createQuotation.mockResolvedValue(quote);
    const response = await request(app).post('/api/v1/leads/' + LEAD_ID + '/quotations')
      .set(auth(STAFF_ID, 'salesStaff')).send({ effectiveOn: '2026-11-09' }).expect(201);
    expect(response.body.data.quotation.quotationNumber).toBe(quote.quotationNumber);
    expect(quotations.createQuotation).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      LEAD_ID,
      { effectiveOn: '2026-11-09' }
    );
  });

  it('prevents Homeowners from generating quotations', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    await request(app).post('/api/v1/leads/' + LEAD_ID + '/quotations')
      .set(auth(HOMEOWNER_ID)).send({}).expect(403);
    expect(quotations.createQuotation).not.toHaveBeenCalled();
  });

  it('requires authentication to retrieve lead quotation history', async () => {
    await request(app).get('/api/v1/leads/' + LEAD_ID + '/quotations').expect(401);
  });

  it('allows a homeowner to retrieve quotation history', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    quotations.getLeadQuotations.mockResolvedValue({ quotations: [quote], count: 1, limit: 20 });
    const response = await request(app).get('/api/v1/leads/' + LEAD_ID + '/quotations')
      .set(auth(HOMEOWNER_ID)).expect(200);
    expect(response.body.data.quotations[0].quotationNumber).toBe(quote.quotationNumber);
  });

  it('requires authentication to retrieve quotation details', async () => {
    await request(app).get('/api/v1/quotations/' + QUOTATION_ID).expect(401);
  });

  it('allows an authorized homeowner to retrieve quotation details', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    quotations.getQuotation.mockResolvedValue(quote);
    const response = await request(app).get('/api/v1/quotations/' + QUOTATION_ID)
      .set(auth(HOMEOWNER_ID)).expect(200);
    expect(response.body.data.quotation.systemCapacityKW).toBe(3);
  });

  it('returns PDF downloads with private attachment headers', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    quotations.downloadQuotationPdf.mockResolvedValue({
      buffer: Buffer.from('%PDF-1.4\nPDF content\n%%EOF'),
      fileName: 'SolarQualify-' + quote.quotationNumber + '.pdf',
    });
    const response = await request(app).get('/api/v1/quotations/' + QUOTATION_ID + '/pdf')
      .set(auth(HOMEOWNER_ID)).buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      }).expect(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.body.toString()).toContain('%PDF-1.4');
  });

  it('rejects unsupported database roles', async () => {
    mockUser(HOMEOWNER_ID, 'installer');
    await request(app).get('/api/v1/quotations/' + QUOTATION_ID)
      .set(auth(HOMEOWNER_ID)).expect(403);
    expect(quotations.getQuotation).not.toHaveBeenCalled();
  });
});
