
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/leads/lead.model.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import Lead from '../src/modules/leads/lead.model.js';
import {
  getAuthorizedBillLead,
} from '../src/modules/bills/bill-access.service.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const OTHER_STAFF_ID = '507f1f77bcf86cd799439013';
const LEAD_ID = '507f1f77bcf86cd799439014';

function mockLeadQuery(result) {
  const query = {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };

  Lead.findOne.mockReturnValue(query);

  return query;
}

describe('Bill Access Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow a homeowner to access their own lead bill', async () => {
    const lead = {
      _id: LEAD_ID,
      homeownerId: HOMEOWNER_ID,
      assignedSalesStaffId: null,
      billAnalysisId: null,
    };

    const query = mockLeadQuery(lead);

    const result = await getAuthorizedBillLead(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      LEAD_ID
    );

    expect(result).toEqual(lead);
    expect(Lead.findOne).toHaveBeenCalledWith({
      _id: LEAD_ID,
      homeownerId: HOMEOWNER_ID,
    });
    expect(query.select).toHaveBeenCalledWith(
      '_id homeownerId assignedSalesStaffId billAnalysisId'
    );
  });

  it('should reject a homeowner accessing another homeowner lead', async () => {
    mockLeadQuery(null);

    await expect(
      getAuthorizedBillLead(
        { id: HOMEOWNER_ID, role: 'homeowner' },
        LEAD_ID
      )
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Lead not found.',
    });
  });

  it('should allow assigned Sales Staff to access the lead bill', async () => {
    const lead = { _id: LEAD_ID };

    mockLeadQuery(lead);

    await expect(
      getAuthorizedBillLead(
        { id: STAFF_ID, role: 'salesStaff' },
        LEAD_ID
      )
    ).resolves.toEqual(lead);

    expect(Lead.findOne).toHaveBeenCalledWith({
      _id: LEAD_ID,
      assignedSalesStaffId: STAFF_ID,
    });
  });

  it('should reject Sales Staff accessing an unassigned lead', async () => {
    mockLeadQuery(null);

    await expect(
      getAuthorizedBillLead(
        { id: STAFF_ID, role: 'salesStaff' },
        LEAD_ID
      )
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Lead not found.',
    });
  });

  it('should reject Sales Staff accessing another staff member lead', async () => {
    mockLeadQuery(null);

    await expect(
      getAuthorizedBillLead(
        { id: STAFF_ID, role: 'salesStaff' },
        LEAD_ID
      )
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Lead not found.',
    });

    expect(Lead.findOne).toHaveBeenCalledWith({
      _id: LEAD_ID,
      assignedSalesStaffId: STAFF_ID,
    });

    expect(OTHER_STAFF_ID).not.toBe(STAFF_ID);
  });

  it('should reject malformed lead IDs before database access', async () => {
    await expect(
      getAuthorizedBillLead(
        { id: HOMEOWNER_ID, role: 'homeowner' },
        'invalid-id'
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid lead ID.',
    });

    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('should reject an unsupported role', async () => {
    await expect(
      getAuthorizedBillLead(
        { id: HOMEOWNER_ID, role: 'admin' },
        LEAD_ID
      )
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('should reject missing authentication context', async () => {
    await expect(
      getAuthorizedBillLead(null, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(Lead.findOne).not.toHaveBeenCalled();
  });
});
