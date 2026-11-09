import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

vi.mock('../src/modules/leads/lead.model.js', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../src/modules/bills/bill-analysis.model.js', () => ({
  default: { findOne: vi.fn() },
}));

import Lead from '../src/modules/leads/lead.model.js';
import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';
import {
  qualifyLead,
  getLeadQualification,
  LEAD_SCORING_VERSION,
} from '../src/modules/lead-scoring/lead-scoring.service.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const OTHER_STAFF_ID = '507f1f77bcf86cd799439013';
const LEAD_ID = '507f1f77bcf86cd799439014';
const BILL_ID = '507f1f77bcf86cd799439015';

const homeowner = { id: HOMEOWNER_ID, role: 'homeowner' };
const staff = { id: STAFF_ID, role: 'salesStaff' };

function lead(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(LEAD_ID),
    referenceId: 'L-TEST1234',
    homeownerId: new mongoose.Types.ObjectId(HOMEOWNER_ID),
    assignedSalesStaffId: new mongoose.Types.ObjectId(STAFF_ID),
    customerName: 'Test Homeowner',
    email: 'homeowner@example.com',
    phone: '9876543210',
    propertyAddress: 'Pune, Maharashtra',
    propertyType: 'residential',
    ownership: 'owner',
    monthlyElectricityBill: 3500,
    monthlyUnits: 340,
    billAnalysisId: new mongoose.Types.ObjectId(BILL_ID),
    status: 'new',
    updatedAt: new Date('2026-11-09T10:00:00.000Z'),
    leadScore: null,
    priority: 'low',
    qualificationReasons: [],
    ...overrides,
  };
}

function mockLeadQuery(value) {
  Lead.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(value) });
}

function mockBillQuery(value) {
  BillAnalysis.findOne.mockReturnValue({ select: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue(value) });
}

function mockUpdatedLead(value) {
  Lead.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue(value) });
}

describe('Lead Scoring Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scores a fully prepared lead with a verified bill and explains every component', async () => {
    const current = lead();
    mockLeadQuery(current);
    mockBillQuery({
      monthlyUnits: 340,
      extractionConfidence: 0.95,
      verificationStatus: 'verified',
      ocrStatus: 'completed',
    });
    mockUpdatedLead({
      ...current,
      leadScore: 93,
      priority: 'high',
    });

    const result = await qualifyLead(staff, LEAD_ID);

    expect(result.leadScore).toBe(93);
    expect(result.priority).toBe('high');
    expect(result.scoringVersion).toBe(LEAD_SCORING_VERSION);
    expect(result.reasons.map((reason) => reason.code)).toEqual(expect.arrayContaining([
      'CONTACT_COMPLETENESS',
      'PROPERTY_OWNERSHIP',
      'PROPERTY_TYPE',
      'MONTHLY_ELECTRICITY_BILL',
      'MONTHLY_ELECTRICITY_UNITS',
      'BILL_VERIFIED',
      'BILL_EXTRACTION_CONFIDENCE',
    ]));
    expect(Lead.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: current._id, assignedSalesStaffId: STAFF_ID }),
      expect.objectContaining({
        $set: expect.objectContaining({
          leadScore: 93,
          priority: 'high',
          qualificationScoringVersion: LEAD_SCORING_VERSION,
        }),
      }),
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  it('does not award verified bill points to a pending or rejected document', async () => {
    const current = lead();
    mockLeadQuery(current);
    mockBillQuery(null);
    mockUpdatedLead({ ...current, leadScore: 68, priority: 'medium' });

    await qualifyLead(staff, LEAD_ID);

    expect(BillAnalysis.findOne).toHaveBeenCalledWith({
      _id: current.billAnalysisId,
      leadId: current._id,
      deletionStatus: 'active',
      ocrStatus: 'completed',
      verificationStatus: 'verified',
    });
    const update = Lead.findOneAndUpdate.mock.calls[0][1].$set;
    expect(update.qualificationReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'BILL_NOT_VERIFIED', points: 0 }),
    ]));
  });

  it('scores using verified bill units rather than unverified lead-form units', async () => {
    const current = lead({ monthlyUnits: 50 });
    mockLeadQuery(current);
    mockBillQuery({ monthlyUnits: 600, extractionConfidence: 0.9 });
    mockUpdatedLead({ ...current, leadScore: 95, priority: 'high' });

    await qualifyLead(staff, LEAD_ID);
    const update = Lead.findOneAndUpdate.mock.calls[0][1].$set;
    expect(update.qualificationReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MONTHLY_ELECTRICITY_UNITS', points: 15, detail: expect.stringContaining('verified bill') }),
    ]));
  });

  it('returns low priority for a lead with minimal information', async () => {
    const current = lead({
      ownership: 'unknown',
      propertyType: 'other',
      monthlyElectricityBill: null,
      monthlyUnits: null,
      billAnalysisId: null,
    });
    mockLeadQuery(current);
    mockUpdatedLead({ ...current, leadScore: 15, priority: 'low' });

    const result = await qualifyLead(staff, LEAD_ID);
    expect(result.leadScore).toBe(15);
    expect(result.priority).toBe('low');
    expect(result.dataGaps.length).toBeGreaterThan(0);
  });

  it('keeps a score below the calibrated medium threshold at low priority', async () => {
    const current = lead({ ownership: 'tenant', propertyType: 'commercial', monthlyElectricityBill: 1500, monthlyUnits: 0, billAnalysisId: null });
    mockLeadQuery(current);
    mockUpdatedLead({ ...current, leadScore: 40, priority: 'medium' });

    const result = await qualifyLead(staff, LEAD_ID);
    expect(result.leadScore).toBe(40);
    expect(result.priority).toBe('low');
  });

  it('matches all three lead-priority anchors in the client sample data', async () => {
    const samples = [
      { ownership: 'owner', monthlyElectricityBill: 3200, monthlyUnits: 340, expectedScore: 68, expectedPriority: 'high' },
      { ownership: 'tenant', monthlyElectricityBill: 1900, monthlyUnits: 210, expectedScore: 51, expectedPriority: 'low' },
      { ownership: 'owner', monthlyElectricityBill: 650, monthlyUnits: 85, expectedScore: 51, expectedPriority: 'low' },
    ];

    for (const sample of samples) {
      const current = lead({
        ownership: sample.ownership,
        propertyType: 'residential',
        monthlyElectricityBill: sample.monthlyElectricityBill,
        monthlyUnits: sample.monthlyUnits,
        billAnalysisId: null,
      });
      mockLeadQuery(current);
      mockUpdatedLead({ ...current, leadScore: sample.expectedScore, priority: sample.expectedPriority });

      const result = await qualifyLead(staff, LEAD_ID);

      expect(result.leadScore).toBe(sample.expectedScore);
      expect(result.priority).toBe(sample.expectedPriority);
    }
  });

  it('rejects malformed lead IDs', async () => {
    await expect(qualifyLead(staff, 'invalid')).rejects.toMatchObject({ statusCode: 400 });
    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('rejects invalid user contexts', async () => {
    await expect(qualifyLead({ id: HOMEOWNER_ID, role: 'installer' }, LEAD_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('prevents homeowners from recalculating a lead score', async () => {
    await expect(qualifyLead(homeowner, LEAD_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(Lead.findOne).not.toHaveBeenCalled();
    expect(Lead.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('prevents Sales Staff from qualifying another staff member lead', async () => {
    mockLeadQuery(null);
    await expect(qualifyLead({ id: OTHER_STAFF_ID, role: 'salesStaff' }, LEAD_ID)).rejects.toMatchObject({ statusCode: 404 });
    expect(Lead.findOne).toHaveBeenCalledWith(expect.objectContaining({ assignedSalesStaffId: OTHER_STAFF_ID }));
  });

  it('rejects qualifying an unassigned lead for Sales Staff', async () => {
    mockLeadQuery(null);
    await expect(qualifyLead(staff, LEAD_ID)).rejects.toMatchObject({ statusCode: 404 });
    expect(Lead.findOne).toHaveBeenCalledWith(expect.objectContaining({ assignedSalesStaffId: STAFF_ID }));
  });

  it('detects concurrent lead modifications before storing a score', async () => {
    const current = lead();
    mockLeadQuery(current);
    mockBillQuery(null);
    mockUpdatedLead(null);

    await expect(qualifyLead(staff, LEAD_ID)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('returns the latest stored qualification without recalculating', async () => {
    const current = lead({
      leadScore: 78,
      priority: 'high',
      qualificationScoringVersion: '1.0.0',
      qualificationEvaluatedAt: new Date('2026-11-09T10:30:00.000Z'),
      qualificationReasons: [{ code: 'TEST', label: 'Test', points: 10, maxPoints: 10, detail: 'Reason' }],
      qualificationDataGaps: [],
    });
    mockLeadQuery(current);

    const result = await getLeadQualification(homeowner, LEAD_ID);

    expect(result.leadScore).toBe(78);
    expect(result.reasons[0].code).toBe('TEST');
    expect(Lead.findOne).toHaveBeenCalledWith({
      _id: LEAD_ID,
      homeownerId: HOMEOWNER_ID,
    });
    expect(BillAnalysis.findOne).not.toHaveBeenCalled();
    expect(Lead.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('identifies lead-form units when a verified bill has no usable units value', async () => {
    const current = lead({ monthlyUnits: 220 });
    mockLeadQuery(current);
    mockBillQuery({
      monthlyUnits: null,
      extractionConfidence: 0.9,
      verificationStatus: 'verified',
      ocrStatus: 'completed',
    });
    mockUpdatedLead({ ...current, leadScore: 89, priority: 'high' });

    const result = await qualifyLead(staff, LEAD_ID);

    expect(result.inputs.monthlyUnits).toBe(220);
    expect(result.inputs.monthlyUnitsSource).toBe('lead_form');
    expect(result.reasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'MONTHLY_ELECTRICITY_UNITS',
        detail: expect.stringContaining('lead form'),
      }),
    ]));
  });

  it('returns 404 when the lead has not yet been qualified', async () => {
    mockLeadQuery(lead());
    await expect(getLeadQualification(homeowner, LEAD_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});
