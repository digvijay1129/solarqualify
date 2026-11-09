
import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';

describe('Bill Analysis Model', () => {
  const validBill = () => ({
    leadId: new mongoose.Types.ObjectId(),
    storageProvider: 'imagekit',
    storageFileId: 'test-imagekit-file-id',
    storagePath: '/solarqualify/bills/test-bill.jpg',
    originalFileName: 'electricity-bill.jpg',
    documentSize: 1024,
    documentType: 'image/jpeg',
    encryption: {
      algorithm: 'aes-256-gcm',
      iv: Buffer.alloc(12).toString('base64'),
      authTag: Buffer.alloc(16).toString('base64'),
    },
  });

  it('should create a valid bill analysis with default values', async () => {
    const bill = new BillAnalysis(validBill());

    await expect(bill.validate()).resolves.toBeUndefined();

    expect(bill.verificationStatus).toBe('pending');
    expect(bill.extractedText).toBe('');
    expect(bill.sanctionedLoadUnit).toBeNull();
    expect(bill.reviewNotes).toBe('');
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

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.documentType'
    );
  });

  it('should reject a missing lead ID', async () => {
    const data = validBill();
    delete data.leadId;

    const bill = new BillAnalysis(data);

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.leadId'
    );
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

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.monthlyUnits'
    );
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
    expect(
      BillAnalysis.schema.path('extractedText').options.select
    ).toBe(false);
  });

  it('should reject a missing ImageKit file ID', async () => {
    const data = validBill();
    delete data.storageFileId;

    const bill = new BillAnalysis(data);

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.storageFileId'
    );
  });

  it('should reject a missing encryption authentication tag', async () => {
    const data = validBill();
    delete data.encryption.authTag;

    const bill = new BillAnalysis(data);

    const error = await bill
      .validate()
      .catch((validationError) => validationError);

    expect(error.errors['encryption.authTag']).toBeDefined();
  });

  it('should accept supported sanctioned load units', async () => {
    for (const unit of ['kW', 'kVA', 'HP']) {
      const bill = new BillAnalysis({
        ...validBill(),
        sanctionedLoad: 3,
        sanctionedLoadUnit: unit,
      });

      await expect(bill.validate()).resolves.toBeUndefined();
    }
  });

  it('should reject an unsupported sanctioned load unit', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      sanctionedLoad: 3,
      sanctionedLoadUnit: 'MW',
    });

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.sanctionedLoadUnit'
    );
  });

  it('should initialize OCR processing with default values', async () => {
    const bill = new BillAnalysis(validBill());

    await bill.validate();

    expect(bill.ocrStatus).toBe('not_started');
    expect(bill.ocrAttempts).toBe(0);
    expect(bill.ocrStartedAt).toBeNull();
    expect(bill.ocrCompletedAt).toBeNull();
    expect(bill.ocrLockId).toBeNull();
    expect(bill.ocrErrorCode).toBeNull();
  });

  it('should accept all supported OCR processing statuses', async () => {
    for (const status of [
      'not_started',
      'processing',
      'completed',
      'failed',
    ]) {
      const bill = new BillAnalysis({
        ...validBill(),
        ocrStatus: status,
      });

      await expect(bill.validate()).resolves.toBeUndefined();
    }
  });

  it('should reject an unsupported OCR processing status', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      ocrStatus: 'approved',
    });

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.ocrStatus'
    );
  });

  it('should reject negative OCR attempt counts', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      ocrAttempts: -1,
    });

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.ocrAttempts'
    );
  });

  it('should exclude the OCR concurrency lock from normal queries', () => {
    expect(
      BillAnalysis.schema.path('ocrLockId').options.select
    ).toBe(false);
  });

  it('should accept OCR processing timestamps and error codes', async () => {
    const startedAt = new Date('2026-11-09T06:00:00.000Z');
    const completedAt = new Date('2026-11-09T06:01:00.000Z');

    const bill = new BillAnalysis({
      ...validBill(),
      ocrStatus: 'completed',
      ocrAttempts: 1,
      ocrStartedAt: startedAt,
      ocrCompletedAt: completedAt,
      ocrErrorCode: null,
    });

    await expect(bill.validate()).resolves.toBeUndefined();

    expect(bill.ocrStartedAt).toEqual(startedAt);
    expect(bill.ocrCompletedAt).toEqual(completedAt);
  });

  it('should accept manual verification notes', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      verificationStatus: 'rejected',
      reviewNotes: 'The uploaded bill is unclear.',
      reviewedBy: new mongoose.Types.ObjectId(),
      reviewedAt: new Date(),
    });

    await expect(bill.validate()).resolves.toBeUndefined();

    expect(bill.reviewNotes).toBe(
      'The uploaded bill is unclear.'
    );
  });

  it('should trim manual verification notes', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      reviewNotes: '  Information manually checked.  ',
    });

    await bill.validate();

    expect(bill.reviewNotes).toBe(
      'Information manually checked.'
    );
  });

  it('should reject review notes longer than 500 characters', async () => {
    const bill = new BillAnalysis({
      ...validBill(),
      reviewNotes: 'A'.repeat(501),
    });

    await expect(bill.validate()).rejects.toHaveProperty(
      'errors.reviewNotes'
    );
  });
});
