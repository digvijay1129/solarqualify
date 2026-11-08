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
      required: true,
      min: 0,
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