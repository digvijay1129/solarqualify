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
