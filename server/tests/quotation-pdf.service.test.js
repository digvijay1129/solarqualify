import { describe, expect, it } from 'vitest';
import { generateQuotationPdf, getQuotationPdfFileName } from '../src/infrastructure/pdf/quotation-pdf.service.js';

const quotation = {
  _id: '507f1f77bcf86cd799439016',
  quotationNumber: 'SQ-9439016',
  quotationStatus: 'generated',
  generatedAt: new Date('2026-11-09T00:00:00.000Z'),
  customerSnapshot: {
    customerName: 'Test Customer', email: 'customer@example.com',
    phone: '9876543210', propertyAddress: 'Pune, Maharashtra',
    propertyType: 'residential', referenceId: 'L-TEST1001',
  },
  systemCapacityKW: 3, estimatedAnnualGeneration: 4200,
  annualConsumptionUnits: 4080, consumptionCoveragePercent: 100,
  equipmentCost: 195000, installationCharges: 10000,
  totalInstallationCost: 205000, applicableSubsidy: 78000,
  netInstallationCost: 127000, estimatedAnnualSavings: 38400,
  estimatedPaybackYears: 3.31,
  pricingSnapshot: { ruleName: 'Residential Pricing', version: 2, pricePerKW: 65000, installationCharges: 10000, effectiveFrom: new Date('2026-01-01') },
  subsidySnapshot: { ruleName: 'Residential Subsidy', version: 3, verificationStatus: 'verified', maximumSubsidy: 78000 },
  generationSnapshot: { ruleName: 'Standard Generation', version: 4, unitsPerKWPerYear: 1400 },
  calculationInputs: { subsidySlabCalculation: [{ fromKW: 0, upToKW: 2, eligibleCapacityKW: 2, amountPerKW: 30000, amount: 60000 }] },
  calculationReasons: [{ label: 'Annual consumption', detail: 'Monthly units multiplied by twelve.', formula: 'Monthly units x 12' }],
};

describe('Quotation PDF Generation', () => {
  it('creates a PDF with header, page tree, xref and EOF marker', () => {
    const pdf = generateQuotationPdf(quotation).toString('ascii');
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('/Type /Catalog');
    expect(pdf).toContain('/Type /Page');
    expect(pdf).toContain('xref');
    expect(pdf.endsWith('%%EOF')).toBe(true);
  });

  it('includes customer, system, financial and rule snapshot information', () => {
    const pdf = generateQuotationPdf(quotation).toString('ascii');
    for (const value of ['Test Customer', 'RECOMMENDED SOLAR SYSTEM', 'Equipment cost',
      'Installation charges', 'Residential Pricing', 'Residential Subsidy',
      'Standard Generation', 'Annual consumption']) {
      expect(pdf).toContain(value);
    }
  });

  it('creates multiple pages when calculation explanations are extensive', () => {
    const large = {
      ...quotation,
      calculationReasons: Array.from({ length: 80 }, (_, i) => ({
        label: 'Explanation ' + i,
        detail: 'Detailed explanation for each business formula and saved input.',
        formula: 'Input multiplied by configured factor',
      })),
    };
    const pdf = generateQuotationPdf(large).toString('ascii');
    expect(pdf.match(/\/Type \/Page /g)?.length).toBeGreaterThan(1);
  });

  it('sanitizes attachment filenames', () => {
    expect(getQuotationPdfFileName(quotation)).toBe('SolarQualify-SQ-9439016.pdf');
    expect(getQuotationPdfFileName({ quotationNumber: 'SQ-123/evil\r\n.pdf' }))
      .toBe('SolarQualify-SQ-123evilpdf.pdf');
  });

  it('rejects a missing quotation object', () => {
    expect(() => generateQuotationPdf(null)).toThrow(TypeError);
  });
});
