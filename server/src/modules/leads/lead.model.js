import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    homeownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
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

    monthlyElectricityBill: {
      type: Number,
      min: 0,
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
      type: [String],
      default: [],
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

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ assignedSalesStaffId: 1, status: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;