import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import Lead from '../src/modules/leads/lead.model.js';

describe('Lead Model', () => {
  const validLead = () => ({
    homeownerId: new mongoose.Types.ObjectId(),
    customerName: 'Test Homeowner',
    email: 'HOMEOWNER@example.com',
    phone: '9876543210',
    propertyAddress: 'Pune, Maharashtra',
    consent: true,
  });

  it('should create a valid lead with default values', async () => {
    const lead = new Lead(validLead());

    await expect(lead.validate()).resolves.toBeUndefined();

    expect(lead.status).toBe('new');
    expect(lead.priority).toBe('low');
    expect(lead.leadScore).toBeNull();
    expect(lead.consent).toBe(true);
    expect(lead.propertyType).toBe('residential');
  });

  it('should normalize the email address', () => {
    const lead = new Lead(validLead());

    expect(lead.email).toBe('homeowner@example.com');
  });

  it('should reject a lead without a homeowner ID', async () => {
    const data = validLead();
    delete data.homeownerId;

    const lead = new Lead(data);

    await expect(lead.validate()).rejects.toHaveProperty('errors.homeownerId');
  });

  it('should reject an unsupported property type', async () => {
    const lead = new Lead({
      ...validLead(),
      propertyType: 'unsupported',
    });

    await expect(lead.validate()).rejects.toHaveProperty('errors.propertyType');
  });

  it('should reject a lead score above 100', async () => {
    const lead = new Lead({
      ...validLead(),
      leadScore: 120,
    });

    await expect(lead.validate()).rejects.toHaveProperty('errors.leadScore');
  });

  it('should reject a negative monthly electricity bill', async () => {
    const lead = new Lead({
      ...validLead(),
      monthlyElectricityBill: -100,
    });

    await expect(lead.validate()).rejects.toHaveProperty(
      'errors.monthlyElectricityBill'
    );
  });

  it('should reject an unsupported lead status', async () => {
    const lead = new Lead({
      ...validLead(),
      status: 'pending',
    });

    await expect(lead.validate()).rejects.toHaveProperty('errors.status');
  });
});
