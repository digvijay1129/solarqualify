import mongoose from 'mongoose';

const billAnalysisSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },

    documentKey: {
      type: String,
      required: true,
      trim: true,
    },

    documentType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      required: true,
    },

    extractedText: {
      type: String,
      default: '',
      select: false,
    },

    consumerNumber: {
      type: String,
      trim: true,
      default: '',
    },

    tariff: {
      type: String,
      trim: true,
      default: '',
    },

    sanctionedLoad: {
      type: Number,
      min: 0,
      default: null,
    },

    monthlyUnits: {
      type: Number,
      min: 0,
      default: null,
    },

    extractionConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    verificationStatus: {
      type: String,
      enum: ['pending', 'needs_review', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },

    corrections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

billAnalysisSchema.index({ leadId: 1, createdAt: -1 });

const BillAnalysis = mongoose.model('BillAnalysis', billAnalysisSchema);

export default BillAnalysis;