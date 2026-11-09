import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const analytics = vi.hoisted(() => ({
  getDashboardAnalytics: vi.fn(),
}));

vi.mock('../src/modules/analytics/analytics.service.js', () => ({
  ...analytics,
}));
vi.mock('../src/modules/users/user.model.js', () => ({
  default: { findById: vi.fn() },
}));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';

function token(id, role = 'homeowner') {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: id,
    expiresIn: '1h',
    issuer: 'solarqualify-api',
  });
}

function auth(id, role = 'homeowner') {
  return { Authorization: 'Bearer ' + token(id, role) };
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

describe('Dashboard Analytics HTTP API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication', async () => {
    await request(app).get('/api/v1/analytics/dashboard').expect(401);
    expect(analytics.getDashboardAnalytics).not.toHaveBeenCalled();
  });

  it('allows a homeowner to retrieve date-filtered analytics', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    analytics.getDashboardAnalytics.mockResolvedValue({
      dataMode: 'live',
      scope: 'homeowner',
      leads: { totalLeads: 2 },
      quotations: { generatedQuotations: 1 },
      projects: { totalProjects: 1 },
      financials: { realizedRevenue: null, realizedRevenueStatus: 'not_tracked' },
    });

    const response = await request(app)
      .get('/api/v1/analytics/dashboard?startDate=2026-01-01&endDate=2026-03-31')
      .set(auth(HOMEOWNER_ID))
      .expect(200);

    expect(response.body.data.analytics.scope).toBe('homeowner');
    expect(analytics.getDashboardAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ id: HOMEOWNER_ID, role: 'homeowner' }),
      { startDate: '2026-01-01', endDate: '2026-03-31' }
    );
  });

  it('allows Sales Staff to retrieve analytics', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    analytics.getDashboardAnalytics.mockResolvedValue({
      dataMode: 'live',
      scope: 'sales_staff',
      leads: { totalLeads: 12 },
      quotations: { generatedQuotations: 4 },
      projects: { totalProjects: 3 },
      financials: { realizedRevenue: null, realizedRevenueStatus: 'not_tracked' },
    });

    const response = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(response.body.data.analytics.scope).toBe('sales_staff');
    expect(analytics.getDashboardAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      {}
    );
  });

  it('rejects unsupported database roles', async () => {
    mockUser(HOMEOWNER_ID, 'installer');

    await request(app)
      .get('/api/v1/analytics/dashboard')
      .set(auth(HOMEOWNER_ID))
      .expect(403);

    expect(analytics.getDashboardAnalytics).not.toHaveBeenCalled();
  });
});
