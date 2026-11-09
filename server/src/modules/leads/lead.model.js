import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      immutable: true,
      default: () => `L-${randomBytes(4).toString('hex').toUpperCase()}`,
      maxlength: 20,
    },

    homeownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    assignedSalesStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    propertyAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    propertyType: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'other'],
      default: 'residential',
    },

    ownership: {
      type: String,
      enum: ['owner', 'tenant', 'other', 'unknown'],
      default: 'unknown',
    },

    monthlyElectricityBill: {
      type: Number,
      min: 0,
      default: null,
    },

    monthlyUnits: {
      type: Number,
      min: 0,
      default: null,
    },

    recommendedSystemKw: {
      type: Number,
      min: 0.1,
      default: null,
    },

    billAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillAnalysis',
      default: null,
    },

    leadScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },

    qualificationReasons: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    qualificationScoringVersion: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
    },

    qualificationEvaluatedAt: {
      type: Date,
      default: null,
    },

    qualificationDataGaps: {
      type: [String],
      default: [],
    },

    qualificationInputs: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: [
        'new',
        'contacted',
        'qualified',
        'quotation_created',
        'converted',
        'lost',
      ],
      default: 'new',
      index: true,
    },

    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

leadSchema.pre('validate', function () {
  if (!this.homeownerId && !this.assignedSalesStaffId) {
    this.invalidate(
      'assignedSalesStaffId',
      'A lead must belong to a homeowner or be assigned to sales staff.'
    );
  }
});

leadSchema.index({ referenceId: 1 }, { unique: true });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ assignedSalesStaffId: 1, status: 1 });
leadSchema.index({ homeownerId: 1, createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;