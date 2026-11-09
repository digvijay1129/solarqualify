import mongoose from 'mongoose';

const SAFE_METADATA_KEYS = new Set([
  'leadId',
  'projectId',
  'quotationId',
  'documentType',
  'documentSize',
  'stage',
  'milestoneStatus',
  'fromProjectStatus',
  'toProjectStatus',
  'notificationType',
  'recipientCount',
  'channel',
  'source',
]);

const SAFE_METADATA_PATTERNS = Object.freeze({
  leadId: /^[a-f0-9]{24}$/i,
  projectId: /^[a-f0-9]{24}$/i,
  quotationId: /^[a-f0-9]{24}$/i,
  documentType: /^(application\/pdf|image\/(jpeg|png|webp))$/,
  stage: /^(site_survey|system_design|customer_approval|installation_scheduled|installation_in_progress|inspection|net_metering|completed)$/,
  milestoneStatus: /^(pending|in_progress|completed|skipped)$/,
  fromProjectStatus: /^(active|on_hold|completed|cancelled)$/,
  toProjectStatus: /^(active|on_hold|completed|cancelled)$/,
  notificationType: /^(project_created|project_stage_updated|project_status_changed)$/,
  channel: /^in_app$/,
  source: /^(sales_dashboard|admin_console|mobile_app|api)$/,
});

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const safe = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_METADATA_KEYS.has(key)) continue;

    if (SAFE_METADATA_PATTERNS[key]) {
      if (typeof value === 'string' && SAFE_METADATA_PATTERNS[key].test(value)) {
        safe[key] = value;
      }
    } else if (
      typeof value === 'number' &&
      Number.isSafeInteger(value) &&
      value >= 0
    ) {
      safe[key] = value;
    }
  }
  return safe;
}

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      set: sanitizeMetadata,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { versionKey: false }
);

auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;