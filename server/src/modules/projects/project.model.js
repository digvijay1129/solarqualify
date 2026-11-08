import mongoose from 'mongoose';

const projectStages = [
  'site_survey',
  'system_design',
  'customer_approval',
  'installation_scheduled',
  'installation_in_progress',
  'inspection',
  'net_metering',
  'completed',
];

const milestoneSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: projectStages,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
    },

    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const projectDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: [
        'identity',
        'electricity_bill',
        'site_survey',
        'quotation',
        'installation_photo',
        'inspection_certificate',
        'other',
      ],
      required: true,
    },

    documentKey: {
      type: String,
      required: true,
      trim: true,
    },

    originalFileName: {
      type: String,
      trim: true,
      maxlength: 255,
      default: '',
    },

    contentType: {
      type: String,
      trim: true,
      default: '',
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const projectSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },

    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true,
    },

    assignedSalesStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    currentStage: {
      type: String,
      enum: projectStages,
      default: 'site_survey',
      index: true,
    },

    projectStatus: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },

    milestoneHistory: {
      type: [milestoneSchema],
      default: [],
    },

    projectDocuments: {
      type: [projectDocumentSchema],
      default: [],
    },

    statusTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

projectSchema.index({ assignedSalesStaffId: 1, projectStatus: 1 });
projectSchema.index({ currentStage: 1, updatedAt: -1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;