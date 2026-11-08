import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/leads/lead.model.js', () => ({
  default: {
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
  assignLead,
  getLeadById,
  getLeads,
  updateLead,
} from '../src/modules/leads/lead.service.js';

const STAFF_ID = '507f1f77bcf86cd799439012';
const OTHER_STAFF_ID = '507f1f77bcf86cd799439013';
const LEAD_ID = '507f1f77bcf86cd799439014';

const salesStaff = {
  id: STAFF_ID,
  role: 'salesStaff',
  name: 'Test Sales Staff',
};

describe('Lead Access Control Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should restrict Sales Staff lead listings to their own assignments', async () => {
    Lead.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    Lead.countDocuments.mockResolvedValue(0);

    await getLeads(salesStaff);

    expect(Lead.find).toHaveBeenCalledWith({
      $and: [
        {
          $or: [
            { assignedSalesStaffId: STAFF_ID },
            { assignedSalesStaffId: null },
          ],
        },
      ],
    });

    expect(Lead.countDocuments).toHaveBeenCalledWith({
      $and: [
        {
          $or: [
            { assignedSalesStaffId: STAFF_ID },
            { assignedSalesStaffId: null },
          ],
        },
      ],
    });
  });

  it('should restrict Sales Staff lead details to their assignments', async () => {
    Lead.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      getLeadById(salesStaff, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Lead not found.',
    });

    expect(Lead.findOne).toHaveBeenCalledWith({
      _id: LEAD_ID,
      $or: [
        { assignedSalesStaffId: STAFF_ID },
        { assignedSalesStaffId: null },
      ],
    });
  });

  it('should reject malformed lead IDs before database access', async () => {
    await expect(
      getLeadById(salesStaff, 'invalid-id')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid lead ID.',
    });

    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('should prevent updating a lead outside the Sales Staff assignment', async () => {
    Lead.findOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      updateLead(salesStaff, LEAD_ID, {
        status: 'qualified',
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Lead not found.',
    });

    expect(Lead.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: LEAD_ID,
        assignedSalesStaffId: STAFF_ID,
      },
      { $set: { status: 'qualified' } },
      expect.objectContaining({
        new: true,
        runValidators: true,
      })
    );
  });

  it('should reject assignment to an inactive or non-staff account', async () => {
    const lead = {
      assignedSalesStaffId: STAFF_ID,
      save: vi.fn(),
    };

    Lead.findOne.mockResolvedValue(lead);

    User.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await expect(
      assignLead(salesStaff, LEAD_ID, OTHER_STAFF_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
      message:
        'The selected Sales Staff account does not exist or is inactive.',
    });

    expect(lead.save).not.toHaveBeenCalled();
  });

  it('should prevent reassignment of a lead outside the current staff scope', async () => {
    Lead.findOne.mockResolvedValue(null);

    await expect(
      assignLead(salesStaff, LEAD_ID, OTHER_STAFF_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Lead not found.',
    });

    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('should safely escape regular-expression search characters', async () => {
    Lead.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    Lead.countDocuments.mockResolvedValue(0);

    await getLeads(salesStaff, {
      search: '.*',
    });

    const query = Lead.find.mock.calls[0][0];

    expect(query.$and[0].$or).toEqual([
      { assignedSalesStaffId: STAFF_ID },
      { assignedSalesStaffId: null },
    ]);

    expect(query.$and[1].$or[0].customerName.$regex).toBe('\\.\\*');
  });

  it('should allow Sales Staff to view unassigned leads in their queue', async () => {
    Lead.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    Lead.countDocuments.mockResolvedValue(0);

    await getLeads(salesStaff);

    expect(Lead.find).toHaveBeenCalledWith({
      $and: [
        {
          $or: [
            { assignedSalesStaffId: STAFF_ID },
            { assignedSalesStaffId: null },
          ],
        },
      ],
    });
  });
});