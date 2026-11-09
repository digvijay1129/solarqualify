import mongoose from 'mongoose';

import AuditLog from './audit-log.model.js';
import Project from '../projects/project.model.js';
import { AppError } from '../../shared/errors/AppError.js';

const AUDIT_ACTIONS = new Set([
  'PROJECT_CREATED',
  'PROJECT_MILESTONE_UPDATED',
  'PROJECT_STATUS_CHANGED',
  'PROJECT_PUBLIC_TOKEN_ISSUED',
  'PROJECT_PUBLIC_TOKEN_REVOKED',
  'BILL_UPLOADED',
  'BILL_METADATA_VIEWED',
  'BILL_DOWNLOAD_REQUESTED',
  'BILL_DELETE_REQUESTED',
  'BILL_DELETED',
  'BILL_DELETE_FAILED',
  'BILL_OCR_REQUESTED',
  'BILL_OCR_COMPLETED',
  'BILL_OCR_FAILED',
  'BILL_VERIFICATION_VIEWED',
  'BILL_VERIFIED',
  'BILL_REJECTED',
]);

const RESOURCE_TYPES = new Set([
  'Project',
  'BillAnalysis',
  'NotificationLog',
  'Lead',
  'Quotation',
]);

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

export function sanitizeAuditMetadata(metadata = {}) {
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

function requireSalesStaff(user) {
  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    user.role !== 'salesStaff'
  ) {
    throw new AppError('Only Sales Staff can access audit logs.', 403);
  }
}

function validateId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError('Invalid ' + label + '.', 400);
  }
}

/**
 * Persist only an allowlisted action and metadata.
 * Request bodies, free-form notes, credentials, tokens and bill contents
 * are never copied into audit metadata.
 */
export async function recordAuditEvent({
  actorId,
  action,
  resourceType,
  resourceId = null,
  metadata = {},
}) {
  validateId(actorId, 'audit actor ID');
  if (!AUDIT_ACTIONS.has(action)) throw new TypeError('Unsupported audit action.');
  if (!RESOURCE_TYPES.has(resourceType)) throw new TypeError('Unsupported audit resource type.');
  if (resourceId !== null) validateId(resourceId, 'audit resource ID');

  return AuditLog.create({
    actorId,
    action,
    resourceType,
    resourceId,
    metadata: sanitizeAuditMetadata(metadata),
  });
}

function getAuditPagination(filters = {}) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    throw new AppError('Invalid audit log filters.', 400);
  }

  const allowed = ['page', 'pageSize', 'action', 'resourceType', 'projectId'];
  if (Object.keys(filters).some((key) => !allowed.includes(key))) {
    throw new AppError('Unsupported audit log filter.', 400);
  }

  const page = Number(filters.page ?? 1);
  const pageSize = Number(filters.pageSize ?? 20);
  if (!Number.isInteger(page) || page < 1 || page > 100000) {
    throw new AppError('Page must be a positive integer.', 400);
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new AppError('Page size must be an integer between 1 and 100.', 400);
  }
  if (
    filters.action !== undefined &&
    (typeof filters.action !== 'string' || !/^[A-Z0-9_]{1,120}$/.test(filters.action))
  ) {
    throw new AppError('Invalid audit action filter.', 400);
  }
  if (
    filters.resourceType !== undefined &&
    !RESOURCE_TYPES.has(filters.resourceType)
  ) {
    throw new AppError('Invalid audit resource type filter.', 400);
  }
  return { page, pageSize };
}

function toAuditDTO(log) {
  return {
    id: log._id.toString(),
    actorId: log.actorId.toString(),
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId?.toString?.() ?? null,
    metadata: sanitizeAuditMetadata(log.metadata),
    createdAt: log.createdAt,
  };
}

/**
 * Audit retrieval is restricted to Sales Staff and their own recorded actions.
 * A project filter is additionally verified against the caller's current project
 * assignment before querying audit records.
 */
export async function getAuditLogs(user, filters = {}) {
  requireSalesStaff(user);
  const { page, pageSize } = getAuditPagination(filters);
  const query = { actorId: user.id };

  if (filters.action) query.action = filters.action;
  if (filters.resourceType) query.resourceType = filters.resourceType;

  if (filters.projectId !== undefined) {
    validateId(filters.projectId, 'project ID');
    const project = await Project.findOne({
      _id: filters.projectId,
      assignedSalesStaffId: user.id,
    }).select('_id').lean();
    if (!project) throw new AppError('Project not found.', 404);
    query['metadata.projectId'] = String(filters.projectId);
  }

  const [items, totalItems] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs: items.map(toAuditDTO),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}