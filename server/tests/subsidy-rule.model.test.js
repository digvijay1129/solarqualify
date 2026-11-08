import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import SubsidyRule from '../src/modules/subsidies/subsidy-rule.model.js';

describe('Subsidy Rule Model', () => {
  const validRule = () => ({
    ruleName: 'Demo Residential Subsidy',
    slabs: [
      { upToKW: 2, amountPerKW: 30000 },
      { upToKW: 3, amountPerKW: 18000 },
    ],
    maximumSubsidy: 78000,
    effectiveFrom: new Date('2026-01-01'),
    version: 1,
    createdBy: new mongoose.Types.ObjectId(),
  });

  it('should create a valid subsidy rule with default values', async () => {
    const rule = new SubsidyRule(validRule());

    await expect(rule.validate()).resolves.toBeUndefined();

    expect(rule.verificationStatus).toBe('unverified');
    expect(rule.status).toBe('draft');
    expect(rule.slabs).toHaveLength(2);
    expect(rule.maximumSubsidy).toBe(78000);
  });

  it('should accept slabs with increasing capacity limits', async () => {
    const rule = new SubsidyRule(validRule());

    await expect(rule.validate()).resolves.toBeUndefined();
  });

  it('should reject slabs that are not in increasing capacity order', async () => {
    const rule = new SubsidyRule({
      ...validRule(),
      slabs: [
        { upToKW: 3, amountPerKW: 18000 },
        { upToKW: 2, amountPerKW: 30000 },
      ],
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.slabs');
  });

  it('should reject an empty slab list', async () => {
    const rule = new SubsidyRule({
      ...validRule(),
      slabs: [],
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.slabs');
  });

  it('should reject a negative maximum subsidy', async () => {
    const rule = new SubsidyRule({
      ...validRule(),
      maximumSubsidy: -1000,
    });

    await expect(rule.validate()).rejects.toHaveProperty(
      'errors.maximumSubsidy'
    );
  });

  it('should reject an effective end date earlier than the start date', async () => {
    const rule = new SubsidyRule({
      ...validRule(),
      effectiveTo: new Date('2025-12-31'),
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.effectiveTo');
  });

  it('should reject an unsupported verification status', async () => {
    const rule = new SubsidyRule({
      ...validRule(),
      verificationStatus: 'approved',
    });

    await expect(rule.validate()).rejects.toHaveProperty(
      'errors.verificationStatus'
    );
  });
});
