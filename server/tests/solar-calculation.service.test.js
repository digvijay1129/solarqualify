import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lead: { findOne: vi.fn() },
  bill: { findOne: vi.fn() },
  pricing: { find: vi.fn(), findOne: vi.fn() },
  subsidy: { find: vi.fn(), findOne: vi.fn() },
  generation: { find: vi.fn(), findOne: vi.fn() },
  quotation: { create: vi.fn(), find: vi.fn(), findOne: vi.fn() },
}));

vi.mock('../src/modules/leads/lead.model.js', () => ({ default: mocks.lead }));
vi.mock('../src/modules/bills/bill-analysis.model.js', () => ({ default: mocks.bill }));
vi.mock('../src/modules/pricing/pricing-rule.model.js', () => ({ default: mocks.pricing }));
vi.mock('../src/modules/subsidies/subsidy-rule.model.js', () => ({ default: mocks.subsidy }));
vi.mock('../src/modules/generation/generation-rule.model.js', () => ({ default: mocks.generation }));
vi.mock('../src/modules/quotations/quotation.model.js', () => ({ default: mocks.quotation }));

import Lead from '../src/modules/leads/lead.model.js';
import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';
import PricingRule from '../src/modules/pricing/pricing-rule.model.js';
import SubsidyRule from '../src/modules/subsidies/subsidy-rule.model.js';
import GenerationRule from '../src/modules/generation/generation-rule.model.js';
import Quotation from '../src/modules/quotations/quotation.model.js';
import {
  createSolarCalculation,
  getSolarCalculations,
  getSolarCalculation,
  SOLAR_CALCULATION_VERSION,
} from '../src/modules/solar-calculations/solar-calculation.service.js';

const STAFF_ID = '507f1f77bcf86cd799439012';
const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const OTHER_STAFF_ID = '507f1f77bcf86cd799439013';
const LEAD_ID = '507f1f77bcf86cd799439014';
const BILL_ID = '507f1f77bcf86cd799439015';
const PRICING_ID = '507f1f77bcf86cd799439016';
const SUBSIDY_ID = '507f1f77bcf86cd799439017';
const GENERATION_ID = '507f1f77bcf86cd799439018';
const CALCULATION_ID = '507f1f77bcf86cd799439019';

const staff = { id: STAFF_ID, role: 'salesStaff' };
const homeowner = { id: HOMEOWNER_ID, role: 'homeowner' };

function chain(value) {
  return {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

function baseLead(overrides = {}) {
  return {
    _id: LEAD_ID,
    homeownerId: HOMEOWNER_ID,
    assignedSalesStaffId: STAFF_ID,
    customerName: 'Test Homeowner',
    propertyType: 'residential',
    monthlyElectricityBill: 3200,
    monthlyUnits: 340,
    billAnalysisId: BILL_ID,
    ...overrides,
  };
}

function pricingRule(overrides = {}) {
  return {
    _id: PRICING_ID,
    ruleName: 'Residential Pricing',
    version: 2,
    pricePerKW: 65000,
    installationCharges: 10000,
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: null,
    status: 'active',
    ...overrides,
  };
}

function subsidyRule(overrides = {}) {
  return {
    _id: SUBSIDY_ID,
    ruleName: 'Residential Subsidy',
    version: 3,
    slabs: [
      { upToKW: 2, amountPerKW: 30000 },
      { upToKW: 3, amountPerKW: 18000 },
    ],
    maximumSubsidy: 78000,
    verificationStatus: 'verified',
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: null,
    status: 'active',
    ...overrides,
  };
}

function generationRule(overrides = {}) {
  return {
    _id: GENERATION_ID,
    ruleName: 'Standard Annual Generation',
    version: 4,
    unitsPerKWPerYear: 1400,
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: null,
    status: 'active',
    ...overrides,
  };
}

function mockRule(model, rule) {
  model.find.mockReturnValue(chain(rule ? [rule] : []));
}

function mockCommon({ lead = baseLead(), bill = null } = {}) {
  Lead.findOne.mockReturnValue(chain(lead));
  BillAnalysis.findOne.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(bill),
  });
  mockRule(PricingRule, pricingRule());
  mockRule(GenerationRule, generationRule());
  mockRule(SubsidyRule, subsidyRule());
  Quotation.create.mockImplementation(async (data) => ({
    _id: CALCULATION_ID,
    createdAt: new Date('2026-11-09T00:00:00.000Z'),
    updatedAt: new Date('2026-11-09T00:00:00.000Z'),
    ...data,
  }));
}

describe('Solar Calculation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommon();
  });

  it('calculates capacity, generation, coverage, cost, subsidy, savings and payback deterministically', async () => {
    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.systemCapacityKW).toBe(3);
    expect(result.annualConsumptionUnits).toBe(4080);
    expect(result.estimatedAnnualGeneration).toBe(4200);
    expect(result.consumptionCoveragePercent).toBe(100);
    expect(result.equipmentCost).toBe(195000);
    expect(result.installationCharges).toBe(10000);
    expect(result.totalInstallationCost).toBe(205000);
    expect(result.applicableSubsidy).toBe(78000);
    expect(result.netInstallationCost).toBe(127000);
    expect(result.estimatedAnnualSavings).toBe(38400);
    expect(result.estimatedPaybackYears).toBe(3.31);
    expect(result.calculationVersion).toBe(SOLAR_CALCULATION_VERSION);
    expect(result.pricingSnapshot.version).toBe(2);
    expect(result.subsidySnapshot.version).toBe(3);
    expect(result.generationSnapshot.version).toBe(4);
    expect(result.calculationReasons.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'RECOMMENDED_CAPACITY',
        'ANNUAL_GENERATION',
        'CONSUMPTION_COVERAGE',
        'SYSTEM_COST',
        'SUBSIDY',
        'ANNUAL_SAVINGS',
        'PAYBACK_PERIOD',
      ])
    );
    expect(Quotation.create).toHaveBeenCalledWith(expect.objectContaining({
      systemCapacityKW: 3,
      annualConsumptionUnits: 4080,
      consumptionCoveragePercent: 100,
      equipmentCost: 195000,
      installationCharges: 10000,
      totalInstallationCost: 205000,
      applicableSubsidy: 78000,
      netInstallationCost: 127000,
      estimatedAnnualSavings: 38400,
      estimatedPaybackYears: 3.31,
      quotationStatus: 'draft',
    }));
  });

  it('queries bill data only from the linked active, OCR-completed, manually verified document', async () => {
    await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(BillAnalysis.findOne).toHaveBeenCalledWith({
      _id: BILL_ID,
      leadId: LEAD_ID,
      deletionStatus: 'active',
      ocrStatus: 'completed',
      verificationStatus: 'verified',
    });
    expect(BillAnalysis.findOne.mock.results[0].value.select).toHaveBeenCalledWith(
      'monthlyUnits sanctionedLoad sanctionedLoadUnit verificationStatus ocrStatus'
    );
  });

  it('selects an explicitly requested subsidy rule by ID and verifies its active period', async () => {
    SubsidyRule.findOne.mockReturnValue(chain(subsidyRule()));

    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
      subsidyRuleId: SUBSIDY_ID,
    });

    expect(SubsidyRule.findOne).toHaveBeenCalledWith(expect.objectContaining({
      _id: SUBSIDY_ID,
      status: 'active',
      verificationStatus: 'verified',
    }));
    expect(result.subsidySnapshot.version).toBe(3);
  });

  it('rejects an invalid effective date', async () => {
    await expect(createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-02-30',
    })).rejects.toMatchObject({ statusCode: 400 });

    expect(PricingRule.find).not.toHaveBeenCalled();
  });

  it('uses verified bill consumption and clamps recommendation to verified kW sanctioned load', async () => {
    mockCommon({
      bill: {
        monthlyUnits: 340,
        sanctionedLoad: 2,
        sanctionedLoadUnit: 'kW',
      },
    });

    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.systemCapacityKW).toBe(2);
    expect(result.estimatedAnnualGeneration).toBe(2800);
    expect(result.consumptionCoveragePercent).toBe(68.63);
    expect(result.calculationInputs.monthlyConsumptionSource).toBe('verified_bill');
    expect(result.calculationReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SANCTIONED_LOAD_LIMIT' }),
    ]));
  });

  it('does not convert kVA or HP sanctioned load into kW', async () => {
    mockCommon({
      bill: {
        monthlyUnits: 340,
        sanctionedLoad: 4,
        sanctionedLoadUnit: 'kVA',
      },
    });

    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.systemCapacityKW).toBe(3);
    expect(result.calculationReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SANCTIONED_LOAD_NOT_CONVERTED' }),
    ]));
  });

  it('uses lead-form units if the verified bill does not contain a positive monthly units value', async () => {
    mockCommon({
      lead: baseLead({ monthlyUnits: 250 }),
      bill: { monthlyUnits: null, sanctionedLoad: null, sanctionedLoadUnit: null },
    });

    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.calculationInputs.monthlyConsumptionSource).toBe('lead_form');
    expect(result.annualConsumptionUnits).toBe(3000);
  });

  it('stores effective dates with each immutable business-rule snapshot', async () => {
    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.pricingSnapshot.effectiveFrom).toEqual(
      new Date('2026-01-01T00:00:00.000Z')
    );
    expect(result.pricingSnapshot.effectiveTo).toBeNull();
    expect(result.subsidySnapshot.effectiveFrom).toEqual(
      new Date('2026-01-01T00:00:00.000Z')
    );
    expect(result.generationSnapshot.effectiveFrom).toEqual(
      new Date('2026-01-01T00:00:00.000Z')
    );
  });

  it('does not apply unverified subsidy rules', async () => {
    mockRule(SubsidyRule, null);

    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.applicableSubsidy).toBe(0);
    expect(result.subsidySnapshot).toBeNull();
    expect(result.calculationReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'SUBSIDY',
        detail: expect.stringContaining('No active, verified subsidy rule'),
      }),
    ]));
  });

  it('caps subsidy at the configured maximum and never above gross cost', async () => {
    mockRule(SubsidyRule, subsidyRule({ maximumSubsidy: 50000 }));
    mockRule(PricingRule, pricingRule({ pricePerKW: 1000, installationCharges: 0 }));

    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.totalInstallationCost).toBe(3000);
    expect(result.applicableSubsidy).toBe(3000);
    expect(result.netInstallationCost).toBe(0);
  });

  it('returns null savings and payback when monthly electricity bill is unavailable', async () => {
    mockCommon({ lead: baseLead({ monthlyElectricityBill: null }) });

    const result = await createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    });

    expect(result.estimatedAnnualSavings).toBeNull();
    expect(result.estimatedPaybackYears).toBeNull();
    expect(result.calculationReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ANNUAL_SAVINGS_UNAVAILABLE', output: null }),
    ]));
  });

  it('rejects a lead without any positive monthly consumption', async () => {
    mockCommon({
      lead: baseLead({ monthlyUnits: null }),
      bill: null,
    });

    await expect(createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    })).rejects.toMatchObject({ statusCode: 422 });

    expect(Quotation.create).not.toHaveBeenCalled();
  });

  it('requires an active effective pricing rule', async () => {
    mockRule(PricingRule, null);

    await expect(createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects ambiguous active pricing rules unless a rule ID is supplied', async () => {
    PricingRule.find.mockReturnValue(chain([
      pricingRule(),
      pricingRule({ _id: '507f1f77bcf86cd799439021', version: 3 }),
    ]));

    await expect(createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('requires selected rule IDs to be active and effective on the requested date', async () => {
    PricingRule.findOne.mockReturnValue(chain(null));

    await expect(createSolarCalculation(staff, LEAD_ID, {
      effectiveOn: '2026-11-09',
      pricingRuleId: PRICING_ID,
    })).rejects.toMatchObject({ statusCode: 409 });

    expect(PricingRule.findOne).toHaveBeenCalledWith(expect.objectContaining({
      _id: PRICING_ID,
      status: 'active',
    }));
  });

  it('requires Sales Staff to create calculation records', async () => {
    await expect(createSolarCalculation(homeowner, LEAD_ID, {}))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('does not permit Sales Staff to calculate another staff member lead', async () => {
    Lead.findOne.mockReturnValue(chain(null));

    await expect(createSolarCalculation({
      id: OTHER_STAFF_ID,
      role: 'salesStaff',
    }, LEAD_ID, {})).rejects.toMatchObject({ statusCode: 404 });

    expect(Lead.findOne).toHaveBeenCalledWith({
      _id: LEAD_ID,
      assignedSalesStaffId: OTHER_STAFF_ID,
    });
  });

  it('rejects invalid IDs and unsupported calculation properties', async () => {
    await expect(createSolarCalculation(staff, 'invalid', {}))
      .rejects.toMatchObject({ statusCode: 400 });
    await expect(createSolarCalculation(staff, LEAD_ID, {
      capacityOverride: 10,
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns calculation history without recalculating it', async () => {
    const record = {
      _id: CALCULATION_ID,
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
      pricingSnapshot: { version: 2 },
      subsidySnapshot: { version: 3 },
      generationSnapshot: { version: 4 },
      calculationReasons: [],
      calculationInputs: {},
    };
    Quotation.find.mockReturnValue(chain([record]));

    const result = await getSolarCalculations(homeowner, LEAD_ID, { limit: '5' });

    expect(result.count).toBe(1);
    expect(result.calculations[0].id).toBe(CALCULATION_ID);
    expect(Quotation.find).toHaveBeenCalledWith({ leadId: LEAD_ID });
    expect(Quotation.create).not.toHaveBeenCalled();
  });

  it('retrieves one calculation only when it belongs to the authorized lead', async () => {
    Quotation.findOne.mockReturnValue(chain({
      _id: CALCULATION_ID,
      leadId: LEAD_ID,
      systemCapacityKW: 3,
      pricingSnapshot: { version: 2 },
      generationSnapshot: { version: 4 },
    }));

    const result = await getSolarCalculation(homeowner, LEAD_ID, CALCULATION_ID);

    expect(result.id).toBe(CALCULATION_ID);
    expect(Quotation.findOne).toHaveBeenCalledWith({
      _id: CALCULATION_ID,
      leadId: LEAD_ID,
    });
  });

  it('rejects access to a calculation belonging to another lead', async () => {
    Quotation.findOne.mockReturnValue(chain(null));

    await expect(getSolarCalculation(homeowner, LEAD_ID, CALCULATION_ID))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
