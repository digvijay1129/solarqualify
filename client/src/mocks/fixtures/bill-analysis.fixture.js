/**
 * SolarQualify Bill Analysis demo fixture.
 *
 * Uses only information already available in the demo lead record.
 * No consumer number, tariff, sanctioned load, address or bill date
 * is fabricated.
 *
 * OCR is not connected in the frontend demonstration.
 * Extracted values must be reviewed and confirmed manually.
 */

export const billAnalysisFixture = {
  dataMode: "demo",
  dataLabel: "Illustrative bill-analysis workflow",

  lead: {
    id: "demo-lead-001",
    referenceId: "L-1076",
    name: "Prashant Wankhede",
    monthlyBill: 3200,
    monthlyUnits: 340,
    ownership: "Owner",
  },

  workflow: {
    currentStep: 1,
    steps: [
      { id: 1, label: "Upload Bill" },
      { id: 2, label: "Extract Information" },
      { id: 3, label: "Verify & Edit" },
      { id: 4, label: "Use for Quotation" },
    ],
  },

  upload: {
    status: "awaiting-upload",
    fileName: null,
    mimeType: null,
    fileSizeBytes: null,
    previewUrl: null,
    acceptedFormats: ["application/pdf", "image/jpeg", "image/png"],
    maxFileSizeMB: 5,
  },

  extraction: {
    status: "not-started",
    provider: "not-connected",
    manualReviewRequired: true,

    fields: [
      {
        id: "consumerNumber",
        label: "Consumer Number",
        value: null,
        required: true,
        source: "not-detected",
        confidence: null,
      },
      {
        id: "tariff",
        label: "Tariff",
        value: null,
        required: true,
        source: "not-detected",
        confidence: null,
      },
      {
        id: "sanctionedLoadKw",
        label: "Sanctioned Load (kW)",
        value: null,
        required: true,
        source: "not-detected",
        confidence: null,
      },
      {
        id: "monthlyUnits",
        label: "Monthly Units Consumed",
        value: null,
        required: true,
        source: "not-detected",
        confidence: null,
      },
      {
        id: "billAmount",
        label: "Bill Amount (₹)",
        value: null,
        required: true,
        source: "not-detected",
        confidence: null,
      },
      {
        id: "billMonth",
        label: "Bill Month",
        value: null,
        required: false,
        source: "not-detected",
        confidence: null,
      },
    ],
  },

  verification: {
    status: "pending",
    reviewedByUser: false,
    confirmedAt: null,
    canProceed: false,
  },

  quotation: {
    ready: false,
    message: "Bill details must be reviewed and confirmed before quotation use.",
  },
};