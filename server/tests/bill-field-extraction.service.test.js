import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  extractBillFields,
} from '../src/modules/bill-analysis/bill-field-extraction.service.js';

describe('Bill Field Extraction Service', () => {
  it('should extract all supported fields from bill text', () => {
    const text = `
      ELECTRICITY DISTRIBUTION BILL

      Consumer No: ABC123456
      Tariff Category: LT-I Domestic
      Sanctioned Load (kW): 3.5
      Units Consumed: 340
    `;

    const result = extractBillFields(text);

    expect(result).toEqual({
      consumerNumber: 'ABC123456',
      tariff: 'LT-I Domestic',
      sanctionedLoad: 3.5,
      sanctionedLoadUnit: 'kW',
      monthlyUnits: 340,
      missingFields: [],
    });
  });

  it('should extract a consumer number using account number label', () => {
    const result = extractBillFields(
      'Account Number: 123456789012'
    );

    expect(result.consumerNumber).toBe(
      '123456789012'
    );
  });

  it('should extract a consumer number using customer ID label', () => {
    const result = extractBillFields(
      'Customer ID: CUST-123456'
    );

    expect(result.consumerNumber).toBe(
      'CUST-123456'
    );
  });

  it('should extract sanctioned load with kVA unit', () => {
    const result = extractBillFields(
      'Connected Load (kVA): 5'
    );

    expect(result.sanctionedLoad).toBe(5);
    expect(result.sanctionedLoadUnit).toBe('kVA');
  });

  it('should extract sanctioned load with HP unit', () => {
    const result = extractBillFields(
      'Sanctioned Load: 2 HP'
    );

    expect(result.sanctionedLoad).toBe(2);
    expect(result.sanctionedLoadUnit).toBe('HP');
  });

  it('should extract monthly units containing commas and decimals', () => {
    const result = extractBillFields(
      'Units Consumed: 1,250.50'
    );

    expect(result.monthlyUnits).toBe(1250.5);
  });

  it('should return null for fields that are not present', () => {
    const result = extractBillFields(
      'Electricity Distribution Company'
    );

    expect(result).toEqual({
      consumerNumber: null,
      tariff: null,
      sanctionedLoad: null,
      sanctionedLoadUnit: null,
      monthlyUnits: null,
      missingFields: [
        'consumerNumber',
        'tariff',
        'sanctionedLoad',
        'monthlyUnits',
      ],
    });
  });

  it('should not invent values from unrelated numbers', () => {
    const result = extractBillFields(`
      Invoice Number: 123456
      Total Amount: 3200
      Meter Reading: 4567
    `);

    expect(result.consumerNumber).toBeNull();
    expect(result.sanctionedLoad).toBeNull();
    expect(result.monthlyUnits).toBeNull();
  });

  it('should handle empty OCR text', () => {
    const result = extractBillFields('');

    expect(result.missingFields).toHaveLength(4);
    expect(result.consumerNumber).toBeNull();
    expect(result.tariff).toBeNull();
    expect(result.sanctionedLoad).toBeNull();
    expect(result.monthlyUnits).toBeNull();
  });

  it('should reject non-string OCR input', () => {
    expect(() => extractBillFields(null)).toThrow(
      'OCR text must be a string.'
    );

    expect(() => extractBillFields(Buffer.from('text'))).toThrow(
      'OCR text must be a string.'
    );
  });
});