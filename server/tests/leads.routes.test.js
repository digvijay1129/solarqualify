import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const leadService = vi.hoisted(() => ({
  createLead: vi.fn(),
  getLeads: vi.fn(),
  getLeadById: vi.fn(),
  getLeadsOverview: vi.fn(),
  updateLead: vi.fn(),
  assignLead: vi.fn(),
}));

vi.mock('../src/modules/leads/lead.service.js', () => ({
  ...leadService,
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
const TARGET_STAFF_ID = '507f1f77bcf86cd799439014';

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

function authenticate(userId, role) {
  return {
    Authorization: `Bearer ${createToken(userId, role)}`,
  };
}

const leadResult = {
  id: LEAD_ID,
  referenceId: 'L-A12B34CD',
  name: 'Test Homeowner',
  email: 'homeowner@example.com',
  phone: '9876543210',
  location: 'Pune, Maharashtra',
  monthlyBill: 3200,
  monthlyUnits: 340,
  recommendedSystemKw: null,
  priority: 'Low',
  status: 'New',
};

describe('Leads HTTP API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without authentication', async () => {
    const response = await request(app)
      .get('/api/v1/leads')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(leadService.getLeads).not.toHaveBeenCalled();
  });

  it('should list permitted leads using the requested filters', async () => {
    mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

    leadService.getLeads.mockResolvedValue({
      items: [leadResult],
      pagination: {
        page: 2,
        pageSize: 10,
        totalItems: 12,
        totalPages: 2,
      },
    });

    const response = await request(app)
      .get('/api/v1/leads')
      .query({
        status: 'in-progress',
        priority: 'high',
        location: 'Pune',
        search: 'Test',
        page: 2,
        pageSize: 10,
      })
      .set(authenticate(HOMEOWNER_ID))
      .expect(200);

    expect(leadService.getLeads).toHaveBeenCalledWith(
      expect.objectContaining({
        id: HOMEOWNER_ID,
        role: 'homeowner',
      }),
      expect.objectContaining({
        status: 'in-progress',
        priority: 'high',
        location: 'Pune',
        search: 'Test',
      })
    );

    expect(response.body.data.items[0]).toMatchObject({
      id: LEAD_ID,
      referenceId: 'L-A12B34CD',
      name: 'Test Homeowner',
    });

    expect(response.body.data.pagination.totalItems).toBe(12);
  });

  it('should return the authenticated user lead overview', async () => {
    mockAuthenticatedUser(STAFF_ID, 'salesStaff');

    leadService.getLeadsOverview.mockResolvedValue({
      dataMode: 'live',
      summary: {
        totalLeads: 10,
        newLeads: 3,
        qualifiedLeads: 2,
        inProgressLeads: 4,
        growth: {
          totalLeads: null,
          newLeads: null,
          qualifiedLeads: null,
          inProgressLeads: null,
        },
      },
      statusCounts: {},
      statuses: [],
      priorities: [],
    });

    const response = await request(app)
      .get('/api/v1/leads/overview')
      .set(authenticate(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(leadService.getLeadsOverview).toHaveBeenCalledWith(
      expect.objectContaining({
        id: STAFF_ID,
        role: 'salesStaff',
      })
    );

    expect(response.body.data.summary.totalLeads).toBe(10);
  });

  it('should create a homeowner lead', async () => {
    mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');
    leadService.createLead.mockResolvedValue(leadResult);

    const payload = {
      customerName: 'Test Homeowner',
      email: 'homeowner@example.com',
      phone: '9876543210',
      propertyAddress: 'Pune, Maharashtra',
      propertyType: 'residential',
      ownership: 'owner',
      consent: true,
    };

    const response = await request(app)
      .post('/api/v1/leads')
      .set(authenticate(HOMEOWNER_ID))
      .send(payload)
      .expect(201);

    expect(leadService.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        id: HOMEOWNER_ID,
        role: 'homeowner',
      }),
      payload
    );

    expect(response.body).toMatchObject({
      success: true,
      message: 'Lead created successfully.',
      data: {
        lead: leadResult,
      },
    });
  });

  it('should retrieve a single permitted lead', async () => {
    mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');
    leadService.getLeadById.mockResolvedValue(leadResult);

    const response = await request(app)
      .get(`/api/v1/leads/${LEAD_ID}`)
      .set(authenticate(HOMEOWNER_ID))
      .expect(200);

    expect(leadService.getLeadById).toHaveBeenCalledWith(
      expect.objectContaining({ id: HOMEOWNER_ID }),
      LEAD_ID
    );

    expect(response.body.data.lead.id).toBe(LEAD_ID);
  });

  it('should update permitted lead information', async () => {
    mockAuthenticatedUser(STAFF_ID, 'salesStaff');

    const updatedLead = {
      ...leadResult,
      status: 'Qualified',
      priority: 'High',
    };

    leadService.updateLead.mockResolvedValue(updatedLead);

    const payload = {
      status: 'qualified',
      priority: 'high',
    };

    const response = await request(app)
      .patch(`/api/v1/leads/${LEAD_ID}`)
      .set(authenticate(STAFF_ID, 'salesStaff'))
      .send(payload)
      .expect(200);

    expect(leadService.updateLead).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      LEAD_ID,
      payload
    );

    expect(response.body.data.lead.status).toBe('Qualified');
  });

  it('should prevent homeowners from assigning leads', async () => {
    mockAuthenticatedUser(HOMEOWNER_ID, 'homeowner');

    const response = await request(app)
      .patch(`/api/v1/leads/${LEAD_ID}/assignment`)
      .set(authenticate(HOMEOWNER_ID))
      .send({ salesStaffId: TARGET_STAFF_ID })
      .expect(403);

    expect(response.body.message).toBe(
      'You do not have permission to perform this action.'
    );

    expect(leadService.assignLead).not.toHaveBeenCalled();
  });

  it('should allow an authenticated Sales Staff user to assign a lead', async () => {
    mockAuthenticatedUser(STAFF_ID, 'salesStaff');

    leadService.assignLead.mockResolvedValue(leadResult);

    const response = await request(app)
      .patch(`/api/v1/leads/${LEAD_ID}/assignment`)
      // The database role must be authoritative, not the JWT role claim.
      .set(authenticate(STAFF_ID, 'homeowner'))
      .send({ salesStaffId: TARGET_STAFF_ID })
      .expect(200);

    expect(leadService.assignLead).toHaveBeenCalledWith(
      expect.objectContaining({
        id: STAFF_ID,
        role: 'salesStaff',
      }),
      LEAD_ID,
      TARGET_STAFF_ID
    );

    expect(response.body).toMatchObject({
      success: true,
      message: 'Lead assigned successfully.',
    });
  });
});