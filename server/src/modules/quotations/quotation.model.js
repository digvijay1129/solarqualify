import mongoose from 'mongoose';

const pricingSnapshotSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PricingRule',
      required: true,
    },

    ruleName: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
    },

    pricePerKW: {
      type: Number,
      required: true,
      min: 0,
    },

    installationCharges: {
      type: Number,
      required: true,
      min: 0,
    },

    effectiveFrom: {
      type: Date,
      default: null,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const subsidySnapshotSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubsidyRule',
      required: true,
    },

    ruleName: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
    },

    slabs: {
      type: [
        {
          upToKW: { type: Number, required: true, min: 0.1 },
          amountPerKW: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },

    maximumSubsidy: {
      type: Number,
      required: true,
      min: 0,
    },

    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'rejected'],
      required: true,
    },

    effectiveFrom: {
      type: Date,
      default: null,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const generationSnapshotSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GenerationRule',
      required: true,
    },

    ruleName: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
    },

    unitsPerKWPerYear: {
      type: Number,
      required: true,
      min: 0.1,
    },

    effectiveFrom: {
      type: Date,
      default: null,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    systemCapacityKW: {
      type: Number,
      required: true,
      min: 0.1,
    },

    estimatedAnnualGeneration: {
      type: Number,
      required: true,
      min: 0,
    },

    totalInstallationCost: {
      type: Number,
      required: true,
      min: 0,
    },

    applicableSubsidy: {
      type: Number,
      required: true,
      min: 0,
    },

    netInstallationCost: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedAnnualSavings: {
      type: Number,
      min: 0,
      default: null,
    },

    annualConsumptionUnits: {
      type: Number,
      min: 0,
      default: null,
    },

    consumptionCoveragePercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    calculationVersion: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '1.0.0',
    },

    calculationReasons: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    estimatedPaybackYears: {
      type: Number,
      min: 0,
      default: null,
    },

    pricingSnapshot: {
      type: pricingSnapshotSchema,
      required: true,
    },

    subsidySnapshot: {
      type: subsidySnapshotSchema,
      default: null,
    },

    generationSnapshot: {
      type: generationSnapshotSchema,
      required: true,
    },

    calculationInputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    pdfDocumentKey: {
      type: String,
      trim: true,
      default: null,
    },

    quotationStatus: {
      type: String,
      enum: ['draft', 'generated', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

quotationSchema.index({ leadId: 1, createdAt: -1 });
quotationSchema.index({ quotationStatus: 1, createdAt: -1 });

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;