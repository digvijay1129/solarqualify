import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';

describe('Bill Analysis Model', () => {
  const validBill = () => ({
    leadId: new mongoose.Types.ObjectId(),
    documentKey: 'private/bills/test-bill.jpg',
    documentType: 'image/jpeg',
  });

  it('should create a valid bill analysis with default values', async () => {
    const bill = new BillAnalysis(validBill());

    await expect(bill.validate()).resolves.toBeUndefined();

    expect(bill.verificationStatus).toBe('pending');
    expect(bill.extractedText).toBe('');
    expect(bill.corrections).toEqual({});
    expect(bill.reviewedBy).toBeNull();
    expect(bill.reviewedAt).toBeNull();
  });

  it('should accept supported document types', async () => {
    for (const documentType of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]) {
      const bill = new BillAnalysis({
        ...validBill(),
        documentType,
      });

      await expect(bill.validate()).resolves.toBeUndefined();
    }
  });

  it('should reject an unsupported document type', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      documentType: 'text/plain',
    });

    await expect(bill.validate()).rejects.toHaveProperty('errors.documentType');
  });

  it('should reject a missing lead ID', async () => {
    const data = validBill();
    delete data.leadId;

    const bill = new BillAnalysis(data);

    await expect(bill.validate()).rejects.toHaveProperty('errors.leadId');
  });

  it('should reject an extraction confidence above 1', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      extractionConfidence: 1.5,
    });

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.extractionConfidence'
    );
  });

  it('should reject a negative monthly unit value', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      monthlyUnits: -100,
    });

    await expect(bill.validate()).rejects.toHaveProperty('errors.monthlyUnits');
  });

  it('should reject an unsupported verification status', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      verificationStatus: 'approved',
    });

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.verificationStatus'
    );
  });

  it('should exclude extracted OCR text from query results by default', () => {
    expect(BillAnalysis.schema.path('extractedText').options.select).toBe(false);
  });
});
