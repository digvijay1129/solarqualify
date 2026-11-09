
import mongoose from 'mongoose';

const billAnalysisSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },

    storageProvider: {
      type: String,
      enum: ['imagekit'],
      default: 'imagekit',
      required: true,
    },

    storageFileId: {
      type: String,
      required: true,
      trim: true,
    },

    storagePath: {
      type: String,
      required: true,
      trim: true,
    },

    originalFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    documentSize: {
      type: Number,
      required: true,
      min: 1,
    },

    encryption: {
      algorithm: {
        type: String,
        enum: ['aes-256-gcm'],
        required: true,
      },
      iv: {
        type: String,
        required: true,
        select: false,
      },
      authTag: {
        type: String,
        required: true,
        select: false,
      },
    },

    documentType: {
      type: String,
      enum: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ],
      required: true,
    },

    extractedText: {
      type: String,
      default: '',
      select: false,
    },

    ocrStatus: {
      type: String,
      enum: [
        'not_started',
        'processing',
        'completed',
        'failed',
      ],
      default: 'not_started',
      index: true,
    },

    ocrAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    ocrStartedAt: {
      type: Date,
      default: null,
    },

    ocrCompletedAt: {
      type: Date,
      default: null,
    },

    ocrLockId: {
      type: String,
      default: null,
      select: false,
    },

    ocrErrorCode: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
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

    sanctionedLoadUnit: {
      type: String,
      enum: ['kW', 'kVA', 'HP'],
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
      enum: [
        'pending',
        'needs_review',
        'verified',
        'rejected',
      ],
      default: 'pending',
      index: true,
    },

    // Reason or notes entered by Sales Staff during review.
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    deletionStatus: {
      type: String,
      enum: [
        'active',
        'deleting',
        'storage_deleted',
      ],
      default: 'active',
      index: true,
    },

    deletionStartedAt: {
      type: Date,
      default: null,
    },

    deletionLockId: {
      type: String,
      default: null,
      select: false,
    },

    storageDeletedAt: {
      type: Date,
      default: null,
    },

    // Contains only fields manually corrected by Sales Staff.
    // Each correction stores its original and corrected value.
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

billAnalysisSchema.index({
  leadId: 1,
  createdAt: -1,
});

billAnalysisSchema.index(
  { storageFileId: 1 },
  { unique: true }
);

billAnalysisSchema.index({
  leadId: 1,
  deletionStatus: 1,
});

billAnalysisSchema.index({
  leadId: 1,
  ocrStatus: 1,
});

const BillAnalysis = mongoose.model(
  'BillAnalysis',
  billAnalysisSchema
);

export default BillAnalysis;
