export const quotationBuilderFixture = {
  dataMode: "demo",
  dataLabel: "Illustrative demo quotation. Verify customer, pricing and policy data before use.",
  customer: {
    leadId: "demo-lead-001",
    referenceId: "L-1076",
    name: "Prashant Wankhede",
    monthlyUnits: 340,
    monthlyBill: 3200,
    source: "Sales Enquiry",
    recordType: "Illustrative demo lead",
  },
  generation: {
    unitsPerKwPerYear: 1400,
    assumptionLabel: "Generation assumption: 1,400 units per kW annually",
    sourceLabel: "Project-provided illustrative assumption",
  },
  systemOptions: [
    { capacityKw: 1, recommended: false },
    { capacityKw: 2, recommended: false },
    { capacityKw: 3, recommended: true },
  ],
  pricing: {
    status: "not-configured",
    currency: "INR",
    effectiveFrom: null,
    effectiveTo: null,
    equipmentCost: null,
    installationCharges: null,
    source: "Admin-managed effective-dated pricing table",
    message: "Approved equipment and installation rates have not been configured.",
  },
  subsidyRule: {
    status: "unverified-demo",
    firstTwoKwPerKw: 30000,
    thirdKw: 18000,
    maximumAmount: 78000,
    effectiveFrom: null,
    effectiveTo: null,
    source: "Project-provided demo rule; official policy verification pending",
  },
  economics: {
    estimatedSavings: null,
    paybackYears: null,
    tariffRate: null,
    status: "awaiting-verified-input",
  },
};

export default quotationBuilderFixture;
