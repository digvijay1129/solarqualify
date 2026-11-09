import mongoose from 'mongoose';

const customerSnapshotSchema = new mongoose.Schema({
  referenceId: { type: String, trim: true, maxlength: 20, default: null },
  customerName: { type: String, trim: true, maxlength: 100, required: true },
  email: { type: String, trim: true, maxlength: 254, default: null },
  phone: { type: String, trim: true, maxlength: 20, default: null },
  propertyAddress: { type: String, trim: true, maxlength: 500, default: null },
  propertyType: { type: String, enum: ['residential','commercial','industrial','other'], default: 'other' },
}, { _id: false });

const pricingSnapshotSchema = new mongoose.Schema({
  ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingRule', required: true },
  ruleName: { type: String, required: true },
  version: { type: Number, required: true, min: 1 },
  pricePerKW: { type: Number, required: true, min: 0 },
  installationCharges: { type: Number, required: true, min: 0 },
  effectiveFrom: { type: Date, default: null },
  effectiveTo: { type: Date, default: null },
}, { _id: false });

const subsidySnapshotSchema = new mongoose.Schema({
  ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubsidyRule', required: true },
  ruleName: { type: String, required: true },
  version: { type: Number, required: true, min: 1 },
  slabs: { type: [{ upToKW: { type: Number, required: true, min: 0.1 }, amountPerKW: { type: Number, required: true, min: 0 } }], default: [] },
  maximumSubsidy: { type: Number, required: true, min: 0 },
  verificationStatus: { type: String, enum: ['unverified','verified','rejected'], required: true },
  effectiveFrom: { type: Date, default: null },
  effectiveTo: { type: Date, default: null },
}, { _id: false });

const generationSnapshotSchema = new mongoose.Schema({
  ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'GenerationRule', required: true },
  ruleName: { type: String, required: true },
  version: { type: Number, required: true, min: 1 },
  unitsPerKWPerYear: { type: Number, required: true, min: 0.1 },
  effectiveFrom: { type: Date, default: null },
  effectiveTo: { type: Date, default: null },
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quotationNumber: { type: String, trim: true, maxlength: 24, default: null },
  customerSnapshot: { type: customerSnapshotSchema, default: null },
  generatedAt: { type: Date, default: null },
  systemCapacityKW: { type: Number, required: true, min: 0.1 },
  estimatedAnnualGeneration: { type: Number, required: true, min: 0 },
  annualConsumptionUnits: { type: Number, min: 0, default: null },
  consumptionCoveragePercent: { type: Number, min: 0, max: 100, default: null },
  equipmentCost: { type: Number, min: 0, default: null },
  installationCharges: { type: Number, min: 0, default: null },
  totalInstallationCost: { type: Number, required: true, min: 0 },
  applicableSubsidy: { type: Number, required: true, min: 0 },
  netInstallationCost: { type: Number, required: true, min: 0 },
  estimatedAnnualSavings: { type: Number, min: 0, default: null },
  calculationVersion: { type: String, trim: true, maxlength: 20, default: '1.0.0' },
  calculationReasons: { type: [mongoose.Schema.Types.Mixed], default: [] },
  estimatedPaybackYears: { type: Number, min: 0, default: null },
  pricingSnapshot: { type: pricingSnapshotSchema, required: true },
  subsidySnapshot: { type: subsidySnapshotSchema, default: null },
  generationSnapshot: { type: generationSnapshotSchema, required: true },
  calculationInputs: { type: mongoose.Schema.Types.Mixed, default: {} },
  pdfDocumentKey: { type: String, trim: true, default: null },
  quotationStatus: { type: String, enum: ['draft','generated','sent','accepted','rejected','expired'], default: 'draft', index: true },
}, { timestamps: true, versionKey: false });

quotationSchema.index({ leadId: 1, createdAt: -1 });
quotationSchema.index({ quotationStatus: 1, createdAt: -1 });
quotationSchema.index(
  { quotationNumber: 1 },
  { unique: true, partialFilterExpression: { quotationNumber: { $type: 'string' } } }
);

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;