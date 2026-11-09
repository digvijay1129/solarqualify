import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const scoring = vi.hoisted(() => ({
  qualifyLead: vi.fn(),
  getLeadQualification: vi.fn(),
}));

vi.mock('../src/modules/lead-scoring/lead-scoring.service.js', () => ({
  ...scoring,
}));

vi.mock('../src/modules/users/user.model.js', () => ({
  default: { findById: vi.fn() },
}));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const LEAD_ID = '507f1f77bcf86cd799439014';

function token(userId, role = 'homeowner') {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: '1h',
    issuer: 'solarqualify-api',
  });
}

function mockUser(id, role) {
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      _id: { toString: () => id },
      name: 'Test User',
      email: 'test@example.com',
      role,
      phone: '9876543210',
      isActive: true,
    }),
  });
}

function auth(id, role) {
  return { Authorization: `Bearer ${token(id, role)}` };
}

const qualification = {
  leadId: LEAD_ID,
  referenceId: 'L-TEST1234',
  leadStatus: 'new',
  leadScore: 76,
  priority: 'high',
  scoringVersion: '1.0.0',
  evaluatedAt: '2026-11-09T10:30:00.000Z',
  reasons: [],
  dataGaps: [],
  inputs: {},
};

describe('Lead Scoring HTTP API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication for score calculation', async () => {
    await request(app).post(`/api/v1/leads/${LEAD_ID}/qualify`).expect(401);
    expect(scoring.qualifyLead).not.toHaveBeenCalled();
  });

  it('prevents homeowners from triggering score calculation', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');

    await request(app)
      .post(`/api/v1/leads/${LEAD_ID}/qualify`)
      .set(auth(HOMEOWNER_ID))
      .expect(403);

    expect(scoring.qualifyLead).not.toHaveBeenCalled();
  });

  it('allows assigned Sales Staff to qualify a lead', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    scoring.qualifyLead.mockResolvedValue(qualification);

    await request(app)
      .post(`/api/v1/leads/${LEAD_ID}/qualify`)
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(scoring.qualifyLead).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      LEAD_ID
    );
  });

  it('rejects users whose database role is not allowed', async () => {
    mockUser(HOMEOWNER_ID, 'installer');
    await request(app)
      .post(`/api/v1/leads/${LEAD_ID}/qualify`)
      .set(auth(HOMEOWNER_ID))
      .expect(403);
    expect(scoring.qualifyLead).not.toHaveBeenCalled();
  });

  it('returns 404 for an inaccessible lead', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    scoring.qualifyLead.mockRejectedValue(Object.assign(new Error('Lead not found.'), { statusCode: 404 }));

    await request(app)
      .post(`/api/v1/leads/${LEAD_ID}/qualify`)
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(404);
  });

  it('requires authentication to retrieve a score', async () => {
    await request(app).get(`/api/v1/leads/${LEAD_ID}/qualification`).expect(401);
    expect(scoring.getLeadQualification).not.toHaveBeenCalled();
  });

  it('returns the current persisted qualification', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    scoring.getLeadQualification.mockResolvedValue(qualification);

    const response = await request(app)
      .get(`/api/v1/leads/${LEAD_ID}/qualification`)
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(scoring.getLeadQualification).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      LEAD_ID
    );
    expect(response.body.data.qualification.priority).toBe('high');
  });

  it('allows a homeowner to retrieve their own persisted qualification', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    scoring.getLeadQualification.mockResolvedValue(qualification);

    const response = await request(app)
      .get(`/api/v1/leads/${LEAD_ID}/qualification`)
      .set(auth(HOMEOWNER_ID))
      .expect(200);

    expect(scoring.getLeadQualification).toHaveBeenCalledWith(
      expect.objectContaining({ id: HOMEOWNER_ID, role: 'homeowner' }),
      LEAD_ID
    );
    expect(response.body.data.qualification.leadScore).toBe(76);
  });

  it('rejects an unsupported database role when retrieving a score', async () => {
    mockUser(HOMEOWNER_ID, 'installer');
    await request(app)
      .get(`/api/v1/leads/${LEAD_ID}/qualification`)
      .set(auth(HOMEOWNER_ID))
      .expect(403);
    expect(scoring.getLeadQualification).not.toHaveBeenCalled();
  });
});
