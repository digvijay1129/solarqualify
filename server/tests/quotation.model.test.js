import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import Quotation from '../src/modules/quotations/quotation.model.js';

describe('Quotation Model', () => {
  const validQuotation = () => ({
    leadId: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId(),
    systemCapacityKW: 3,
    estimatedAnnualGeneration: 4200,
    totalInstallationCost: 210000,
    applicableSubsidy: 78000,
    netInstallationCost: 132000,
    estimatedAnnualSavings: 20000,
    estimatedPaybackYears: 6.6,

    pricingSnapshot: {
      ruleId: new mongoose.Types.ObjectId(),
      ruleName: 'Residential Pricing',
      version: 1,
      pricePerKW: 65000,
      installationCharges: 15000,
    },

    subsidySnapshot: {
      ruleId: new mongoose.Types.ObjectId(),
      ruleName: 'Demo Residential Subsidy',
      version: 1,
      slabs: [
        { upToKW: 2, amountPerKW: 30000 },
        { upToKW: 3, amountPerKW: 18000 },
      ],
      maximumSubsidy: 78000,
      verificationStatus: 'unverified',
    },

    generationSnapshot: {
      ruleId: new mongoose.Types.ObjectId(),
      ruleName: 'Standard Annual Generation',
      version: 1,
      unitsPerKWPerYear: 1400,
    },
  });

  it('should create a valid quotation with default values', async () => {
    const quotation = new Quotation(validQuotation());

    await expect(quotation.validate()).resolves.toBeUndefined();

    expect(quotation.quotationStatus).toBe('draft');
    expect(quotation.calculationInputs).toEqual({});
    expect(quotation.pdfDocumentKey).toBeNull();
    expect(quotation.systemCapacityKW).toBe(3);
  });

  it('allows savings to remain unavailable when the monthly bill is missing', async () => {
    const data = validQuotation();
    data.estimatedAnnualSavings = null;
    data.estimatedPaybackYears = null;
    data.annualConsumptionUnits = 4080;
    data.consumptionCoveragePercent = 100;
    data.calculationVersion = '1.0.0';
    data.calculationReasons = [
      { code: 'ANNUAL_SAVINGS_UNAVAILABLE', output: null },
    ];

    const quotation = new Quotation(data);

    await expect(quotation.validate()).resolves.toBeUndefined();
    expect(quotation.estimatedAnnualSavings).toBeNull();
    expect(quotation.estimatedPaybackYears).toBeNull();
  });

  it('preserves the selected rule effective periods in quotation snapshots', async () => {
    const data = validQuotation();
    const effectiveFrom = new Date('2026-01-01T00:00:00.000Z');
    const effectiveTo = new Date('2026-12-31T00:00:00.000Z');
    data.pricingSnapshot.effectiveFrom = effectiveFrom;
    data.pricingSnapshot.effectiveTo = effectiveTo;
    data.subsidySnapshot.effectiveFrom = effectiveFrom;
    data.subsidySnapshot.effectiveTo = effectiveTo;
    data.generationSnapshot.effectiveFrom = effectiveFrom;
    data.generationSnapshot.effectiveTo = effectiveTo;

    const quotation = new Quotation(data);
    await expect(quotation.validate()).resolves.toBeUndefined();

    expect(quotation.pricingSnapshot.effectiveFrom).toEqual(effectiveFrom);
    expect(quotation.subsidySnapshot.effectiveTo).toEqual(effectiveTo);
    expect(quotation.generationSnapshot.effectiveFrom).toEqual(effectiveFrom);
  });

  it('should reject a quotation without a lead ID', async () => {
    const data = validQuotation();
    delete data.leadId;

    const quotation = new Quotation(data);

    await expect(quotation.validate()).rejects.toHaveProperty('errors.leadId');
  });

  it('should reject a quotation with zero system capacity', async () => {
    const quotation = new Quotation({
      ...validQuotation(),
      systemCapacityKW: 0,
    });

    await expect(quotation.validate()).rejects.toHaveProperty(
      'errors.systemCapacityKW'
    );
  });

  it('should reject negative installation cost', async () => {
    const quotation = new Quotation({
      ...validQuotation(),
      totalInstallationCost: -1000,
    });

    await expect(quotation.validate()).rejects.toHaveProperty(
      'errors.totalInstallationCost'
    );
  });

  it('should reject negative applicable subsidy', async () => {
    const quotation = new Quotation({
      ...validQuotation(),
      applicableSubsidy: -5000,
    });

    await expect(quotation.validate()).rejects.toHaveProperty(
      'errors.applicableSubsidy'
    );
  });

  it('should reject a missing pricing snapshot', async () => {
    const data = validQuotation();
    delete data.pricingSnapshot;

    const quotation = new Quotation(data);

    await expect(quotation.validate()).rejects.toHaveProperty(
      'errors.pricingSnapshot'
    );
  });

  it('should reject an invalid pricing snapshot version', async () => {
    const quotation = new Quotation({
      ...validQuotation(),
      pricingSnapshot: {
        ...validQuotation().pricingSnapshot,
        version: 0,
      },
    });

    const validationError = await quotation.validate().catch((error) => error);
    expect(validationError.errors['pricingSnapshot.version']).toBeDefined();
  });

  it('should reject an unsupported quotation status', async () => {
    const quotation = new Quotation({
      ...validQuotation(),
      quotationStatus: 'approved',
    });

    await expect(quotation.validate()).rejects.toHaveProperty(
      'errors.quotationStatus'
    );
  });
});
