import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import GenerationRule from '../src/modules/generation/generation-rule.model.js';

describe('Generation Rule Model', () => {
  const validRule = () => ({
    ruleName: 'Standard Annual Solar Generation',
    unitsPerKWPerYear: 1400,
    effectiveFrom: new Date('2026-01-01'),
    version: 1,
    createdBy: new mongoose.Types.ObjectId(),
  });

  it('should create a valid generation rule with default values', async () => {
    const rule = new GenerationRule(validRule());

    await expect(rule.validate()).resolves.toBeUndefined();

    expect(rule.unitsPerKWPerYear).toBe(1400);
    expect(rule.status).toBe('draft');
    expect(rule.effectiveTo).toBeNull();
  });

  it('should reject zero annual generation units', async () => {
    const rule = new GenerationRule({
      ...validRule(),
      unitsPerKWPerYear: 0,
    });

    await expect(rule.validate()).rejects.toHaveProperty(
      'errors.unitsPerKWPerYear'
    );
  });

  it('should reject negative annual generation units', async () => {
    const rule = new GenerationRule({
      ...validRule(),
      unitsPerKWPerYear: -500,
    });

    await expect(rule.validate()).rejects.toHaveProperty(
      'errors.unitsPerKWPerYear'
    );
  });

  it('should reject a version below 1', async () => {
    const rule = new GenerationRule({
      ...validRule(),
      version: 0,
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.version');
  });

  it('should reject an unsupported status', async () => {
    const rule = new GenerationRule({
      ...validRule(),
      status: 'approved',
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.status');
  });

  it('should reject an end date earlier than the start date', async () => {
    const rule = new GenerationRule({
      ...validRule(),
      effectiveTo: new Date('2025-12-31'),
    });

    await expect(rule.validate()).rejects.toHaveProperty('errors.effectiveTo');
  });

  it('should require a creator ID', async () => {
    const data = validRule();
    delete data.createdBy;

    const rule = new GenerationRule(data);

    await expect(rule.validate()).rejects.toHaveProperty('errors.createdBy');
  });
});
