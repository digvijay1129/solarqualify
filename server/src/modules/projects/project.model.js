import mongoose from 'mongoose';

export const PROJECT_STAGES = Object.freeze([
  'site_survey',
  'system_design',
  'customer_approval',
  'installation_scheduled',
  'installation_in_progress',
  'inspection',
  'net_metering',
  'completed',
]);

const milestoneSchema = new mongoose.Schema(
  {
    stage: { type: String, enum: PROJECT_STAGES, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
    },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const projectHistorySchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'project_created',
        'milestone_updated',
        'project_status_changed',
        'public_token_issued',
        'public_token_revoked',
      ],
      required: true,
    },
    fromStage: { type: String, enum: PROJECT_STAGES, default: null },
    toStage: { type: String, enum: PROJECT_STAGES, default: null },
    milestoneStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: null,
    },
    fromProjectStatus: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'cancelled'],
      default: null,
    },
    toProjectStatus: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'cancelled'],
      default: null,
    },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { _id: true, versionKey: false }
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
    documentKey: { type: String, required: true, trim: true },
    originalFileName: { type: String, trim: true, maxlength: 255, default: '' },
    contentType: { type: String, trim: true, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    customerName: { type: String, trim: true, maxlength: 100, required: true },
    email: { type: String, trim: true, maxlength: 254, default: null },
    phone: { type: String, trim: true, maxlength: 20, default: null },
    propertyAddress: { type: String, trim: true, maxlength: 500, default: null },
    propertyType: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'other'],
      default: 'other',
    },
  },
  { _id: false }
);

const quotationSnapshotSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, trim: true, maxlength: 24, default: null },
    systemCapacityKW: { type: Number, min: 0.1, required: true },
    estimatedAnnualGeneration: { type: Number, min: 0, required: true },
    netInstallationCost: { type: Number, min: 0, required: true },
    applicableSubsidy: { type: Number, min: 0, required: true },
  },
  { _id: false }
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
    customerSnapshot: { type: customerSnapshotSchema, required: true },
    quotationSnapshot: { type: quotationSnapshotSchema, required: true },
    currentStage: {
      type: String,
      enum: PROJECT_STAGES,
      default: 'site_survey',
      index: true,
    },
    projectStatus: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    milestoneHistory: { type: [milestoneSchema], default: [] },
    projectHistory: { type: [projectHistorySchema], default: [] },
    projectDocuments: { type: [projectDocumentSchema], default: [] },
    statusTokenHash: { type: String, default: null, select: false },
    statusTokenIssuedAt: { type: Date, default: null, select: false },
    statusTokenExpiresAt: { type: Date, default: null, select: false },
    statusTokenRevokedAt: { type: Date, default: null, select: false },
  },
  { timestamps: true, versionKey: false }
);

projectSchema.index({ quotationId: 1 }, { unique: true });
projectSchema.index({ assignedSalesStaffId: 1, projectStatus: 1 });
projectSchema.index({ homeownerId: 1, projectStatus: 1 });
projectSchema.index({ currentStage: 1, updatedAt: -1 });
projectSchema.index(
  { statusTokenHash: 1 },
  { unique: true, partialFilterExpression: { statusTokenHash: { $type: 'string' } } }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;