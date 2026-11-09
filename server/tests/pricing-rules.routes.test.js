import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const ruleService = vi.hoisted(() => ({
  createRuleVersion: vi.fn(),
  getRuleVersions: vi.fn(),
  getRuleVersion: vi.fn(),
  updateRuleStatus: vi.fn(),
  verifySubsidyRule: vi.fn(),
}));

vi.mock('../src/modules/pricing-rules/rule-management.service.js', () => ({
  ...ruleService,
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
const RULE_ID = '507f1f77bcf86cd799439014';

function token(userId, role = 'homeowner') {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: '1h',
    issuer: 'solarqualify-api',
  });
}

function mockUser(userId, role) {
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

function auth(userId, role) {
  return {
    Authorization: `Bearer ${token(userId, role)}`,
  };
}

const rule = {
  id: RULE_ID,
  ruleName: 'Residential Standard',
  version: 1,
  status: 'draft',
};

describe('Business Rule Management HTTP API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication to list rule versions', async () => {
    await request(app).get('/api/v1/rules/pricing').expect(401);
    expect(ruleService.getRuleVersions).not.toHaveBeenCalled();
  });

  it('allows Homeowners to retrieve pricing versions', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    ruleService.getRuleVersions.mockResolvedValue({
      rules: [rule],
      count: 1,
      limit: 50,
    });

    const response = await request(app)
      .get('/api/v1/rules/pricing')
      .set(auth(HOMEOWNER_ID))
      .expect(200);

    expect(ruleService.getRuleVersions).toHaveBeenCalledWith(
      expect.objectContaining({ id: HOMEOWNER_ID, role: 'homeowner' }),
      'pricing',
      {}
    );
    expect(response.body.data.rules[0].version).toBe(1);
  });

  it('allows Sales Staff to create a pricing version', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    ruleService.createRuleVersion.mockResolvedValue(rule);

    const payload = {
      ruleName: 'Residential Standard',
      pricePerKW: 65000,
      installationCharges: 10000,
      effectiveFrom: '2026-12-01',
    };

    const response = await request(app)
      .post('/api/v1/rules/pricing')
      .set(auth(STAFF_ID, 'salesStaff'))
      .send(payload)
      .expect(201);

    expect(ruleService.createRuleVersion).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      'pricing',
      payload
    );
    expect(response.body.data.rule.id).toBe(RULE_ID);
  });

  it('prevents Homeowners from creating business rules', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');

    await request(app)
      .post('/api/v1/rules/pricing')
      .set(auth(HOMEOWNER_ID))
      .send({ ruleName: 'Not allowed' })
      .expect(403);

    expect(ruleService.createRuleVersion).not.toHaveBeenCalled();
  });

  it('retrieves a specific historical subsidy version', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    ruleService.getRuleVersion.mockResolvedValue({
      ...rule,
      verificationStatus: 'verified',
    });

    const response = await request(app)
      .get(`/api/v1/rules/subsidies/${RULE_ID}`)
      .set(auth(HOMEOWNER_ID))
      .expect(200);

    expect(ruleService.getRuleVersion).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'homeowner' }),
      'subsidies',
      RULE_ID
    );
    expect(response.body.data.rule.verificationStatus).toBe('verified');
  });

  it('allows Sales Staff to activate a rule version', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    ruleService.updateRuleStatus.mockResolvedValue({
      ...rule,
      status: 'active',
    });

    const response = await request(app)
      .patch(`/api/v1/rules/generation/${RULE_ID}/status`)
      .set(auth(STAFF_ID, 'salesStaff'))
      .send({ status: 'active' })
      .expect(200);

    expect(ruleService.updateRuleStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      'generation',
      RULE_ID,
      { status: 'active' }
    );
    expect(response.body.data.rule.status).toBe('active');
  });

  it('prevents Homeowners from changing rule status', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');

    await request(app)
      .patch(`/api/v1/rules/pricing/${RULE_ID}/status`)
      .set(auth(HOMEOWNER_ID))
      .send({ status: 'inactive' })
      .expect(403);

    expect(ruleService.updateRuleStatus).not.toHaveBeenCalled();
  });

  it('allows Sales Staff to verify a subsidy rule', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    ruleService.verifySubsidyRule.mockResolvedValue({
      ...rule,
      verificationStatus: 'verified',
    });

    await request(app)
      .patch(`/api/v1/rules/subsidies/${RULE_ID}/verification`)
      .set(auth(STAFF_ID, 'salesStaff'))
      .send({ decision: 'verified' })
      .expect(200);

    expect(ruleService.verifySubsidyRule).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      RULE_ID,
      { decision: 'verified' }
    );
  });

  it('rejects an unauthorized database role', async () => {
    mockUser(HOMEOWNER_ID, 'installer');

    await request(app)
      .get('/api/v1/rules/generation')
      .set(auth(HOMEOWNER_ID))
      .expect(403);

    expect(ruleService.getRuleVersions).not.toHaveBeenCalled();
  });
});
