import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import PricingRule from '../src/modules/pricing/pricing-rule.model.js';

describe('Pricing Rule Model', () => {
  const validRule = () => ({
    ruleName: 'Residential Solar Pricing',
    pricePerKW: 65000,
    installationCharges: 10000,
    effectiveFrom: new Date('2026-01-01'),
    version: 1,
    createdBy: new mongoose.Types.ObjectId(),
  });

  it('should create a valid pricing rule with default values', async () => {
    const rule = new PricingRule(validRule());

    await expect(rule.validate()).resolves.toBeUndefined();

    expect(rule.status).toBe('draft');
    expect(rule.installationCharges).toBe(10000);
    expect(rule.effectiveTo).toBeNull();
  });

  it('should reject a negative price per kW', async () => {
    const rule = new PricingRule({
      ...validRule(),
      pricePerKW: -1000,
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.pricePerKW');
  });

  it('should reject negative installation charges', async () => {
    const rule = new PricingRule({
      ...validRule(),
      installationCharges: -500,
    });

    await expect(rule.validate()).rejects.toHaveProperty(
      'errors.installationCharges'
    );
  });

  it('should reject a version below 1', async () => {
    const rule = new PricingRule({
      ...validRule(),
      version: 0,
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.version');
  });

  it('should reject an unsupported status', async () => {
    const rule = new PricingRule({
      ...validRule(),
      status: 'approved',
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.status');
  });

  it('should require a creator ID', async () => {
    const data = validRule();
    delete data.createdBy;

    const rule = new PricingRule(data);

    await expect(rule.validate()).rejects.toHaveProperty('errors.createdBy');
  });

  it('should reject a missing effective start date', async () => {
    const data = validRule();
    delete data.effectiveFrom;

    const rule = new PricingRule(data);

    await expect(rule.validate()).rejects.toHaveProperty('errors.effectiveFrom');
  });
});
