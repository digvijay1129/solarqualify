import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import Lead from '../src/modules/leads/lead.model.js';

describe('Lead Model - Extended Fields', () => {
  const validLead = () => ({
    homeownerId: new mongoose.Types.ObjectId(),
    customerName: 'Test Homeowner',
    email: 'homeowner@example.com',
    phone: '9876543210',
    propertyAddress: 'Pune, Maharashtra',
    consent: true,
  });

  it('should generate a unique-format reference ID', () => {
    const firstLead = new Lead(validLead());
    const secondLead = new Lead(validLead());

    expect(firstLead.referenceId).toMatch(/^L-[A-F0-9]{8}$/);
    expect(secondLead.referenceId).toMatch(/^L-[A-F0-9]{8}$/);
    expect(firstLead.referenceId).not.toBe(secondLead.referenceId);
  });

  it('should default ownership to unknown', () => {
    const lead = new Lead(validLead());

    expect(lead.ownership).toBe('unknown');
  });

  it('should accept owner and tenant ownership values', async () => {
    for (const ownership of ['owner', 'tenant']) {
      const lead = new Lead({
        ...validLead(),
        ownership,
      });

      await expect(lead.validate()).resolves.toBeUndefined();
    }
  });

  it('should reject an unsupported ownership value', async () => {
    const lead = new Lead({
      ...validLead(),
      ownership: 'landlord',
    });

    await expect(lead.validate()).rejects.toHaveProperty(
      'errors.ownership'
    );
  });

  it('should allow monthly units to remain unknown', () => {
    const lead = new Lead(validLead());

    expect(lead.monthlyUnits).toBeNull();
  });

  it('should reject negative monthly electricity units', async () => {
    const lead = new Lead({
      ...validLead(),
      monthlyUnits: -50,
    });

    await expect(lead.validate()).rejects.toHaveProperty(
      'errors.monthlyUnits'
    );
  });

  it('should allow the recommended system capacity to remain unknown', () => {
    const lead = new Lead(validLead());

    expect(lead.recommendedSystemKw).toBeNull();
  });

  it('should reject a zero recommended system capacity', async () => {
    const lead = new Lead({
      ...validLead(),
      recommendedSystemKw: 0,
    });

    await expect(lead.validate()).rejects.toHaveProperty(
      'errors.recommendedSystemKw'
    );
  });
});