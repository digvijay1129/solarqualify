import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const calculations = vi.hoisted(() => ({
  createSolarCalculation: vi.fn(),
  getSolarCalculations: vi.fn(),
  getSolarCalculation: vi.fn(),
}));

vi.mock('../src/modules/solar-calculations/solar-calculation.service.js', () => ({
  ...calculations,
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
const CALCULATION_ID = '507f1f77bcf86cd799439019';

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

function auth(id, role = 'homeowner') {
  return { Authorization: 'Bearer ' + token(id, role) };
}

const calculation = {
  id: CALCULATION_ID,
  leadId: LEAD_ID,
  systemCapacityKW: 3,
  estimatedAnnualGeneration: 4200,
  annualConsumptionUnits: 4080,
  consumptionCoveragePercent: 100,
  totalInstallationCost: 205000,
  applicableSubsidy: 78000,
  netInstallationCost: 127000,
  estimatedAnnualSavings: 38400,
  estimatedPaybackYears: 3.31,
  calculationVersion: '1.0.0',
};

describe('Solar Calculation HTTP API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication to create a solar calculation', async () => {
    await request(app)
      .post('/api/v1/leads/' + LEAD_ID + '/solar-calculations')
      .send({})
      .expect(401);

    expect(calculations.createSolarCalculation).not.toHaveBeenCalled();
  });

  it('allows assigned Sales Staff to create a draft calculation', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    calculations.createSolarCalculation.mockResolvedValue(calculation);

    const response = await request(app)
      .post('/api/v1/leads/' + LEAD_ID + '/solar-calculations')
      .set(auth(STAFF_ID, 'salesStaff'))
      .send({ effectiveOn: '2026-11-09' })
      .expect(201);

    expect(response.body.data.calculation.systemCapacityKW).toBe(3);
    expect(calculations.createSolarCalculation).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      LEAD_ID,
      { effectiveOn: '2026-11-09' }
    );
  });

  it('prevents Homeowners from creating calculation records', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');

    await request(app)
      .post('/api/v1/leads/' + LEAD_ID + '/solar-calculations')
      .set(auth(HOMEOWNER_ID))
      .send({})
      .expect(403);

    expect(calculations.createSolarCalculation).not.toHaveBeenCalled();
  });

  it('returns a rule conflict as a conflict response', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    calculations.createSolarCalculation.mockRejectedValue(
      Object.assign(new Error('No active pricing rule.'), { statusCode: 409 })
    );

    await request(app)
      .post('/api/v1/leads/' + LEAD_ID + '/solar-calculations')
      .set(auth(STAFF_ID, 'salesStaff'))
      .send({})
      .expect(409);
  });

  it('requires authentication to retrieve calculation history', async () => {
    await request(app)
      .get('/api/v1/leads/' + LEAD_ID + '/solar-calculations')
      .expect(401);

    expect(calculations.getSolarCalculations).not.toHaveBeenCalled();
  });

  it('allows a Homeowner to retrieve their calculation history', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    calculations.getSolarCalculations.mockResolvedValue({
      calculations: [calculation],
      count: 1,
      limit: 20,
    });

    const response = await request(app)
      .get('/api/v1/leads/' + LEAD_ID + '/solar-calculations')
      .set(auth(HOMEOWNER_ID))
      .expect(200);

    expect(response.body.data.calculations[0].id).toBe(CALCULATION_ID);
  });

  it('allows Sales Staff to retrieve a specific calculation', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    calculations.getSolarCalculation.mockResolvedValue(calculation);

    const response = await request(app)
      .get('/api/v1/leads/' + LEAD_ID + '/solar-calculations/' + CALCULATION_ID)
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(response.body.data.calculation.systemCapacityKW).toBe(3);
    expect(calculations.getSolarCalculation).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      LEAD_ID,
      CALCULATION_ID
    );
  });
});
