import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lead: { findOne: vi.fn() },
  quotation: { findById: vi.fn(), findOneAndUpdate: vi.fn(), find: vi.fn() },
  createSolarCalculation: vi.fn(),
  generateQuotationPdf: vi.fn(),
  getQuotationPdfFileName: vi.fn(),
}));

vi.mock('../src/modules/leads/lead.model.js', () => ({ default: mocks.lead }));
vi.mock('../src/modules/quotations/quotation.model.js', () => ({ default: mocks.quotation }));
vi.mock('../src/modules/solar-calculations/solar-calculation.service.js', () => ({
  createSolarCalculation: mocks.createSolarCalculation,
}));
vi.mock('../src/infrastructure/pdf/quotation-pdf.service.js', () => ({
  generateQuotationPdf: mocks.generateQuotationPdf,
  getQuotationPdfFileName: mocks.getQuotationPdfFileName,
}));

import Lead from '../src/modules/leads/lead.model.js';
import Quotation from '../src/modules/quotations/quotation.model.js';
import {
  createQuotation,
  getLeadQuotations,
  getQuotation,
  downloadQuotationPdf,
  decideQuotation,
} from '../src/modules/quotations/quotation.service.js';

const STAFF_ID = '507f1f77bcf86cd799439012';
const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const OTHER_STAFF_ID = '507f1f77bcf86cd799439013';
const LEAD_ID = '507f1f77bcf86cd799439014';
const QUOTATION_ID = '507f1f77bcf86cd799439016';
const NUMBER = 'SQ-' + QUOTATION_ID.slice(-8).toUpperCase();
const staff = { id: STAFF_ID, role: 'salesStaff' };
const homeowner = { id: HOMEOWNER_ID, role: 'homeowner' };

const qualifiedLead = {
  _id: LEAD_ID, homeownerId: HOMEOWNER_ID, assignedSalesStaffId: STAFF_ID,
  referenceId: 'L-TEST1001', customerName: 'Test Customer',
  email: 'customer@example.com', phone: '9876543210',
  propertyAddress: 'Pune, Maharashtra', propertyType: 'residential',
  status: 'qualified', leadScore: 82, qualificationScoringVersion: '1.0.0',
};

const calculation = { id: QUOTATION_ID, systemCapacityKW: 3 };
const quotation = {
  _id: QUOTATION_ID, leadId: LEAD_ID, createdBy: STAFF_ID,
  quotationNumber: NUMBER, customerSnapshot: { customerName: 'Test Customer' },
  quotationStatus: 'generated', systemCapacityKW: 3,
  estimatedAnnualGeneration: 4200, annualConsumptionUnits: 4080,
  consumptionCoveragePercent: 100, equipmentCost: 195000,
  installationCharges: 10000, totalInstallationCost: 205000,
  applicableSubsidy: 78000, netInstallationCost: 127000,
  pricingSnapshot: { version: 1 }, subsidySnapshot: null,
  generationSnapshot: { version: 1 }, calculationReasons: [],
};

function query(value) {
  const result = {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return result;
}
function mockLead(value) { Lead.findOne.mockReturnValue(query(value)); }

describe('Quotation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLead(qualifiedLead);
    mocks.createSolarCalculation.mockResolvedValue(calculation);
    mocks.quotation.findOneAndUpdate.mockReturnValue(query(quotation));
    mocks.quotation.findById.mockReturnValue(query(quotation));
    mocks.quotation.find.mockReturnValue(query([quotation]));
    mocks.generateQuotationPdf.mockReturnValue(Buffer.from('%PDF-1.4'));
    mocks.getQuotationPdfFileName.mockReturnValue('SolarQualify-' + NUMBER + '.pdf');
  });

  it('requires Sales Staff to create quotations', async () => {
    await expect(createQuotation(homeowner, LEAD_ID, {})).rejects.toMatchObject({ statusCode: 403 });
    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('requires the lead workflow status to be qualified', async () => {
    mockLead({ ...qualifiedLead, status: 'contacted' });
    await expect(createQuotation(staff, LEAD_ID, {})).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.createSolarCalculation).not.toHaveBeenCalled();
  });

  it('requires a completed qualification score', async () => {
    mockLead({ ...qualifiedLead, leadScore: null });
    await expect(createQuotation(staff, LEAD_ID, {})).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.createSolarCalculation).not.toHaveBeenCalled();
  });

  it('uses the deterministic engine and saves customer details as a snapshot', async () => {
    const result = await createQuotation(staff, LEAD_ID, { effectiveOn: '2026-11-09' });
    expect(mocks.createSolarCalculation).toHaveBeenCalledWith(staff, LEAD_ID, { effectiveOn: '2026-11-09' });
    expect(Quotation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: QUOTATION_ID, leadId: LEAD_ID, createdBy: STAFF_ID, quotationStatus: 'draft' }),
      { $set: expect.objectContaining({
        quotationNumber: NUMBER,
        customerSnapshot: expect.objectContaining({ customerName: 'Test Customer', email: 'customer@example.com' }),
        quotationStatus: 'generated',
        generatedAt: expect.any(Date),
      }) },
      expect.objectContaining({ new: true, runValidators: true })
    );
    expect(result.quotationStatus).toBe('generated');
  });

  it('returns a conflict if a draft cannot be finalized', async () => {
    Quotation.findOneAndUpdate.mockReturnValue(query(null));
    await expect(createQuotation(staff, LEAD_ID, {})).rejects.toMatchObject({ statusCode: 409 });
  });

  it('returns quotation history for an authorized homeowner', async () => {
    mockLead({ _id: LEAD_ID });
    const result = await getLeadQuotations(homeowner, LEAD_ID, { limit: '10' });
    expect(Quotation.find).toHaveBeenCalledWith({ leadId: LEAD_ID });
    expect(result.quotations[0].id).toBe(QUOTATION_ID);
  });

  it('rejects excessive quotation history limits', async () => {
    await expect(getLeadQuotations(homeowner, LEAD_ID, { limit: '1000' })).rejects.toMatchObject({ statusCode: 400 });
    expect(Quotation.find).not.toHaveBeenCalled();
  });

  it('retrieves quotations only when the parent lead is accessible', async () => {
    Quotation.findById.mockReturnValue(query(quotation));
    mockLead({ _id: LEAD_ID });
    expect((await getQuotation(homeowner, QUOTATION_ID)).id).toBe(QUOTATION_ID);
    expect(Lead.findOne).toHaveBeenCalledWith({ _id: LEAD_ID, homeownerId: HOMEOWNER_ID });
  });

  it('returns 404 for another staff member quotation', async () => {
    Quotation.findById.mockReturnValue(query(quotation));
    mockLead(null);
    await expect(getQuotation({ id: OTHER_STAFF_ID, role: 'salesStaff' }, QUOTATION_ID))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows the owning homeowner to accept a generated quotation', async () => {
    Quotation.findById.mockReturnValue(query(quotation));
    mockLead({ _id: LEAD_ID });

    const result = await decideQuotation(homeowner, QUOTATION_ID, { decision: 'accepted' });

    expect(Quotation.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: QUOTATION_ID,
        leadId: LEAD_ID,
        quotationStatus: { $in: ['generated', 'sent'] },
      }),
      { $set: expect.objectContaining({
        quotationStatus: 'accepted',
        customerDecisionAt: expect.any(Date),
      }) },
      expect.objectContaining({ new: true, runValidators: true })
    );
    expect(result.quotationStatus).toBe('accepted');
  });

  it('does not allow Sales Staff to make a customer quotation decision', async () => {
    await expect(decideQuotation(staff, QUOTATION_ID, { decision: 'accepted' }))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(Quotation.findById).not.toHaveBeenCalled();
  });

  it('rejects unsupported or invalid customer quotation decisions', async () => {
    await expect(decideQuotation(homeowner, QUOTATION_ID, { decision: 'maybe' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(Quotation.findById).not.toHaveBeenCalled();
  });

  it('downloads a PDF for a formal quotation', async () => {
    Quotation.findById.mockReturnValue(query(quotation));
    mockLead({ _id: LEAD_ID });
    const result = await downloadQuotationPdf(homeowner, QUOTATION_ID);
    expect(mocks.generateQuotationPdf).toHaveBeenCalledWith(quotation);
    expect(result.buffer.toString()).toContain('%PDF');
    expect(result.fileName).toBe('SolarQualify-' + NUMBER + '.pdf');
  });

  it('does not generate a formal PDF for a draft calculation', async () => {
    Quotation.findById.mockReturnValue(query({ ...quotation, quotationStatus: 'draft' }));
    mockLead({ _id: LEAD_ID });
    await expect(downloadQuotationPdf(homeowner, QUOTATION_ID)).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.generateQuotationPdf).not.toHaveBeenCalled();
  });
});
