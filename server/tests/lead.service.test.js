import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

vi.mock('../src/modules/leads/lead.model.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../src/modules/users/user.model.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import Lead from '../src/modules/leads/lead.model.js';
import User from '../src/modules/users/user.model.js';

import {
  createLead,
  getLeads,
  getLeadById,
  getLeadsOverview,
  updateLead,
  assignLead,
} from '../src/modules/leads/lead.service.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const TARGET_STAFF_ID = '507f1f77bcf86cd799439013';
const LEAD_ID = '507f1f77bcf86cd799439014';

const homeowner = {
  id: HOMEOWNER_ID,
  name: 'Test Homeowner',
  email: 'homeowner@example.com',
  phone: '9876543210',
  role: 'homeowner',
};

const salesStaff = {
  id: STAFF_ID,
  name: 'Test Sales Staff',
  email: 'staff@example.com',
  phone: '9876543211',
  role: 'salesStaff',
};

function fakeLead(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(LEAD_ID),
    referenceId: 'L-A12B34CD',
    homeownerId: new mongoose.Types.ObjectId(HOMEOWNER_ID),
    assignedSalesStaffId: null,
    customerName: 'Test Homeowner',
    email: 'homeowner@example.com',
    phone: '9876543210',
    propertyAddress: 'Pune, Maharashtra',
    propertyType: 'residential',
    ownership: 'owner',
    monthlyElectricityBill: 3200,
    monthlyUnits: 340,
    recommendedSystemKw: null,
    priority: 'low',
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Lead Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a homeowner lead with server-controlled ownership', async () => {
    Lead.create.mockImplementation(async (input) => fakeLead(input));

    const result = await createLead(homeowner, {
      customerName: 'Customer Name',
      email: 'customer@example.com',
      phone: '9876543210',
      propertyAddress: 'Pune, Maharashtra',
      propertyType: 'residential',
      ownership: 'owner',
      consent: true,

      // These untrusted fields must not override server-controlled values.
      homeownerId: TARGET_STAFF_ID,
      assignedSalesStaffId: TARGET_STAFF_ID,
      priority: 'high',
      leadScore: 99,
      status: 'qualified',
      recommendedSystemKw: 10,
    });

    const savedInput = Lead.create.mock.calls[0][0];

    expect(savedInput.homeownerId).toBe(HOMEOWNER_ID);
    expect(savedInput.assignedSalesStaffId).toBeNull();
    expect(savedInput.consent).toBe(true);
    expect(savedInput).not.toHaveProperty('priority');
    expect(savedInput).not.toHaveProperty('leadScore');
    expect(savedInput).not.toHaveProperty('status');
    expect(savedInput).not.toHaveProperty('recommendedSystemKw');

    expect(result.referenceId).toBe('L-A12B34CD');
  });

  it('should assign Sales Staff-created leads to the creator', async () => {
    Lead.create.mockImplementation(async (input) => fakeLead(input));

    await createLead(salesStaff, {
      customerName: 'Prospective Customer',
      email: 'customer@example.com',
      phone: '9876543210',
      propertyAddress: 'Nashik, Maharashtra',
      consent: true,
    });

    expect(Lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        homeownerId: null,
        assignedSalesStaffId: STAFF_ID,
      })
    );
  });

  it('should reject lead creation without customer consent', async () => {
    await expect(
      createLead(homeowner, {
        propertyAddress: 'Pune, Maharashtra',
        consent: false,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Customer consent is required before creating a lead.',
    });

    expect(Lead.create).not.toHaveBeenCalled();
  });

  it('should list only the homeowner records with pagination', async () => {
    const records = [fakeLead()];

    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(records),
    };

    Lead.find.mockReturnValue(query);
    Lead.countDocuments.mockResolvedValue(12);

    const result = await getLeads(homeowner, {
      status: 'new',
      priority: 'high',
      page: 2,
      pageSize: 5,
    });

    expect(Lead.find).toHaveBeenCalledWith(
      expect.objectContaining({
        homeownerId: HOMEOWNER_ID,
        status: 'new',
        priority: 'high',
      })
    );

    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);

    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 5,
      totalItems: 12,
      totalPages: 3,
    });
  });

  it('should map in-progress filtering to both internal statuses', async () => {
    Lead.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    Lead.countDocuments.mockResolvedValue(0);

    await getLeads(salesStaff, {
      status: 'in-progress',
    });

    expect(Lead.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: [
          {
            $or: [
              { assignedSalesStaffId: STAFF_ID },
              { assignedSalesStaffId: null },
            ],
          },
        ],
        status: {
          $in: ['contacted', 'quotation_created'],
        },
      })
    );
  });

  it('should reject unsupported page sizes', async () => {
    await expect(
      getLeads(homeowner, { pageSize: 100 })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Page size must be 5, 10, or 20.',
    });

    expect(Lead.find).not.toHaveBeenCalled();
  });

  it('should return real overview counts without fabricated growth', async () => {
    Lead.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const result = await getLeadsOverview(homeowner);

    expect(result.dataMode).toBe('live');
    expect(result.summary.totalLeads).toBe(10);
    expect(result.summary.newLeads).toBe(3);
    expect(result.summary.qualifiedLeads).toBe(2);
    expect(result.summary.inProgressLeads).toBe(4);
    expect(result.statusCounts.converted).toBe(1);
    expect(result.summary.growth.totalLeads).toBeNull();
  });

  it('should not allow a homeowner to retrieve another user lead', async () => {
    Lead.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      getLeadById(homeowner, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Lead not found.',
    });

    expect(Lead.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: LEAD_ID,
        homeownerId: HOMEOWNER_ID,
      })
    );
  });

  it('should prevent homeowners from modifying Sales Staff-only fields', async () => {
    Lead.findOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(
        fakeLead({ customerName: 'Updated Customer' })
      ),
    });

    await updateLead(homeowner, LEAD_ID, {
      customerName: 'Updated Customer',
      status: 'qualified',
      priority: 'high',
      assignedSalesStaffId: TARGET_STAFF_ID,
    });

    const [query, update] = Lead.findOneAndUpdate.mock.calls[0];

    expect(query.homeownerId).toBe(HOMEOWNER_ID);
    expect(update.$set).toEqual({
      customerName: 'Updated Customer',
    });
  });

  it('should allow Sales Staff to update permitted lead status', async () => {
    Lead.findOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(
        fakeLead({ status: 'qualified' })
      ),
    });

    const result = await updateLead(salesStaff, LEAD_ID, {
      status: 'qualified',
      priority: 'high',
    });

    const [query, update] = Lead.findOneAndUpdate.mock.calls[0];

    expect(query.assignedSalesStaffId).toBe(STAFF_ID);
    expect(update.$set).toEqual({
      status: 'qualified',
      priority: 'high',
    });
    expect(result.status).toBe('Qualified');
  });

  it('should allow Sales Staff to assign a lead to another active Sales Staff account', async () => {
    const lead = fakeLead({
      assignedSalesStaffId: new mongoose.Types.ObjectId(STAFF_ID),
      save: vi.fn().mockResolvedValue(undefined),
    });

    Lead.findOne.mockResolvedValue(lead);

    User.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(TARGET_STAFF_ID),
      }),
    });

    // Mocking findOneAndUpdate to handle the atomic assignment update successfully
    Lead.findOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(fakeLead({ assignedSalesStaffId: TARGET_STAFF_ID })),
    });

    await assignLead(salesStaff, LEAD_ID, TARGET_STAFF_ID);

    expect(Lead.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: LEAD_ID,
        $or: [
          { assignedSalesStaffId: STAFF_ID },
          { assignedSalesStaffId: null },
        ],
      })
    );

    expect(User.findOne).toHaveBeenCalledWith({
      _id: TARGET_STAFF_ID,
      role: 'salesStaff',
      isActive: true,
    });
  });

  it('should prevent homeowners from assigning leads', async () => {
    await expect(
      assignLead(homeowner, LEAD_ID, TARGET_STAFF_ID)
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only sales staff can assign leads.',
    });

    expect(Lead.findOne).not.toHaveBeenCalled();
  });
});