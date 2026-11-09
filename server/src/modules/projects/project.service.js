import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

import Project, { PROJECT_STAGES } from './project.model.js';
import Lead from '../leads/lead.model.js';
import Quotation from '../quotations/quotation.model.js';
import { AppError } from '../../shared/errors/AppError.js';

const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'cancelled'];
const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed', 'skipped'];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const PUBLIC_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function requireUser(user, write = false) {
  const roles = write ? ['salesStaff'] : ['homeowner', 'salesStaff'];

  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !roles.includes(user.role)
  ) {
    throw new AppError(
      write
        ? 'Only Sales Staff can change project operations.'
        : 'You are not authorized to access projects.',
      403
    );
  }
}

function validateId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError('Invalid ' + label + '.', 400);
  }
}

function getProjectScope(user) {
  return user.role === 'homeowner'
    ? { homeownerId: user.id }
    : { assignedSalesStaffId: user.id };
}

function validateNote(value, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new AppError('A note is required for this status change.', 400);
    return '';
  }

  if (typeof value !== 'string') {
    throw new AppError('Note must be a string.', 400);
  }

  const note = value.trim();
  if ((required && note.length === 0) || note.length > 1000) {
    throw new AppError('Note must contain between 1 and 1000 characters.', 400);
  }
  return note;
}

function toId(value) {
  return value?.toString?.() ?? null;
}

function toProjectDTO(project) {
  return {
    id: toId(project._id),
    leadId: toId(project.leadId),
    quotationId: toId(project.quotationId),
    homeownerId: toId(project.homeownerId),
    assignedSalesStaffId: toId(project.assignedSalesStaffId),
    customer: project.customerSnapshot,
    quotation: project.quotationSnapshot,
    currentStage: project.currentStage,
    projectStatus: project.projectStatus,
    milestones: (project.milestoneHistory ?? []).map((milestone) => ({
      id: toId(milestone._id),
      stage: milestone.stage,
      status: milestone.status,
      note: milestone.note ?? '',
      updatedBy: toId(milestone.updatedBy),
      completedAt: milestone.completedAt ?? null,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    })),
    history: (project.projectHistory ?? []).map((event) => ({
      id: toId(event._id),
      eventType: event.eventType,
      fromStage: event.fromStage ?? null,
      toStage: event.toStage ?? null,
      milestoneStatus: event.milestoneStatus ?? null,
      fromProjectStatus: event.fromProjectStatus ?? null,
      toProjectStatus: event.toProjectStatus ?? null,
      note: event.note ?? '',
      performedBy: toId(event.performedBy),
      createdAt: event.createdAt,
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

async function findAccessibleProject(user, projectId) {
  const project = await Project.findOne({
    _id: projectId,
    ...getProjectScope(user),
  })
    .select('+statusTokenIssuedAt +statusTokenRevokedAt')
    .lean();

  if (!project) throw new AppError('Project not found.', 404);
  return project;
}

function getPagination(filters = {}) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    throw new AppError('Invalid project filters.', 400);
  }

  const allowed = ['page', 'pageSize', 'status', 'stage'];
  if (Object.keys(filters).some((key) => !allowed.includes(key))) {
    throw new AppError('Unsupported project list filter.', 400);
  }

  const page = Number(filters.page ?? 1);
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE);

  if (!Number.isInteger(page) || page < 1 || page > 100000) {
    throw new AppError('Page must be a positive integer.', 400);
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new AppError('Page size must be an integer between 1 and 100.', 400);
  }
  if (
    filters.status !== undefined &&
    filters.status !== 'all' &&
    !PROJECT_STATUSES.includes(filters.status)
  ) {
    throw new AppError('Invalid project status filter.', 400);
  }
  if (
    filters.stage !== undefined &&
    filters.stage !== 'all' &&
    !PROJECT_STAGES.includes(filters.stage)
  ) {
    throw new AppError('Invalid project stage filter.', 400);
  }

  return { page, pageSize };
}

export async function createProjectFromAcceptedQuotation(user, quotationId) {
  requireUser(user, true);
  validateId(quotationId, 'quotation ID');

  const quotation = await Quotation.findById(quotationId).lean();
  if (!quotation) throw new AppError('Quotation not found.', 404);

  if (quotation.quotationStatus !== 'accepted') {
    throw new AppError('Only an accepted quotation can be converted into a project.', 409);
  }

  const lead = await Lead.findOne({
    _id: quotation.leadId,
    assignedSalesStaffId: user.id,
  }).lean();

  if (!lead) throw new AppError('Lead not found or not assigned to you.', 404);

  const customerSnapshot = quotation.customerSnapshot ?? {};
  const now = new Date();
  const milestones = PROJECT_STAGES.map((stage, index) => ({
    stage,
    status: index === 0 ? 'in_progress' : 'pending',
    note: '',
    updatedBy: user.id,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  try {
    const project = await Project.create({
      leadId: lead._id,
      quotationId: quotation._id,
      homeownerId: lead.homeownerId ?? null,
      assignedSalesStaffId: lead.assignedSalesStaffId,
      customerSnapshot: {
        customerName: customerSnapshot.customerName ?? lead.customerName,
        email: customerSnapshot.email ?? lead.email,
        phone: customerSnapshot.phone ?? lead.phone,
        propertyAddress: customerSnapshot.propertyAddress ?? lead.propertyAddress,
        propertyType: customerSnapshot.propertyType ?? lead.propertyType,
      },
      quotationSnapshot: {
        quotationNumber: quotation.quotationNumber,
        systemCapacityKW: quotation.systemCapacityKW,
        estimatedAnnualGeneration: quotation.estimatedAnnualGeneration,
        netInstallationCost: quotation.netInstallationCost,
        applicableSubsidy: quotation.applicableSubsidy,
      },
      currentStage: PROJECT_STAGES[0],
      projectStatus: 'active',
      milestoneHistory: milestones,
      projectHistory: [{
        eventType: 'project_created',
        fromStage: null,
        toStage: PROJECT_STAGES[0],
        fromProjectStatus: null,
        toProjectStatus: 'active',
        note: 'Project created from accepted quotation.',
        performedBy: user.id,
        createdAt: now,
      }],
    });

    return toProjectDTO(project.toObject());
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('A project already exists for this quotation.', 409);
    }
    throw error;
  }
}

export async function listProjects(user, filters = {}) {
  requireUser(user);
  const { page, pageSize } = getPagination(filters);
  const query = { ...getProjectScope(user) };

  if (filters.status && filters.status !== 'all') {
    query.projectStatus = filters.status;
  }
  if (filters.stage && filters.stage !== 'all') {
    query.currentStage = filters.stage;
  }

  const [records, totalItems] = await Promise.all([
    Project.find(query)
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Project.countDocuments(query),
  ]);

  return {
    projects: records.map(toProjectDTO),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

export async function getProject(user, projectId) {
  requireUser(user);
  validateId(projectId, 'project ID');
  const project = await findAccessibleProject(user, projectId);
  return toProjectDTO(project);
}

function validateStatusPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError('A valid project status request body is required.', 400);
  }

  const allowed = ['stage', 'milestoneStatus', 'projectStatus', 'note'];
  if (Object.keys(payload).some((key) => !allowed.includes(key))) {
    throw new AppError('The project status request contains unsupported properties.', 400);
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError('At least one project status field is required.', 400);
  }

  if (payload.stage !== undefined && !PROJECT_STAGES.includes(payload.stage)) {
    throw new AppError('Invalid project stage.', 400);
  }
  if (
    payload.milestoneStatus !== undefined &&
    !MILESTONE_STATUSES.includes(payload.milestoneStatus)
  ) {
    throw new AppError('Invalid milestone status.', 400);
  }
  if (
    payload.projectStatus !== undefined &&
    !PROJECT_STATUSES.includes(payload.projectStatus)
  ) {
    throw new AppError('Invalid project status.', 400);
  }

  if (
    payload.projectStatus !== undefined &&
    (payload.stage !== undefined || payload.milestoneStatus !== undefined)
  ) {
    throw new AppError('Update project status or a milestone in one request, not both.', 400);
  }

  return {
    ...payload,
    note: validateNote(payload.note, {
      required: payload.projectStatus === 'on_hold' || payload.projectStatus === 'cancelled',
    }),
  };
}

export async function updateProjectStatus(user, projectId, payload) {
  requireUser(user, true);
  validateId(projectId, 'project ID');
  const input = validateStatusPayload(payload);
  const project = await findAccessibleProject(user, projectId);

  if (['completed', 'cancelled'].includes(project.projectStatus)) {
    throw new AppError('Completed or cancelled projects are terminal and cannot be changed.', 409);
  }

  const now = new Date();
  let nextStage = project.currentStage;
  let nextStatus = project.projectStatus;
  const milestones = project.milestoneHistory.map((item) => ({
    ...item,
    _id: item._id,
  }));
  const events = [];

  if (input.projectStatus !== undefined) {
    const requested = input.projectStatus;

    if (
      (requested === 'on_hold' && project.projectStatus !== 'active') ||
      (requested === 'active' && project.projectStatus !== 'on_hold') ||
      (requested === 'cancelled' && !['active', 'on_hold'].includes(project.projectStatus)) ||
      requested === 'completed'
    ) {
      throw new AppError('Invalid project status transition.', 409);
    }

    if (requested === project.projectStatus) {
      throw new AppError('Project already has the requested status.', 409);
    }

    nextStatus = requested;
    events.push({
      eventType: 'project_status_changed',
      fromProjectStatus: project.projectStatus,
      toProjectStatus: nextStatus,
      note: input.note,
      performedBy: user.id,
      createdAt: now,
    });
  } else {
    if (project.projectStatus !== 'active') {
      throw new AppError('Milestones can only be updated while the project is active.', 409);
    }

    const stage = input.stage ?? project.currentStage;
    if (stage !== project.currentStage) {
      throw new AppError('Only the current project stage can be updated. Complete stages in order.', 409);
    }

    if (!input.milestoneStatus) {
      throw new AppError('milestoneStatus is required when updating a project milestone.', 400);
    }

    const milestoneIndex = milestones.findIndex((item) => item.stage === stage);
    if (milestoneIndex < 0) {
      throw new AppError('Current project milestone is missing.', 500);
    }

    const milestone = milestones[milestoneIndex];
    const previousMilestoneStatus = milestone.status;
    const requested = input.milestoneStatus;

    const validTransition =
      (previousMilestoneStatus === 'pending' && ['in_progress', 'skipped'].includes(requested)) ||
      (previousMilestoneStatus === 'in_progress' && ['completed', 'skipped'].includes(requested));

    if (!validTransition) {
      throw new AppError('Invalid milestone status transition.', 409);
    }

    if (stage === PROJECT_STAGES.at(-1) && requested === 'skipped') {
      throw new AppError('The final project stage cannot be skipped.', 409);
    }

    milestone.status = requested;
    milestone.note = input.note;
    milestone.updatedBy = user.id;
    milestone.completedAt = requested === 'completed' ? now : null;
    milestone.updatedAt = now;

    const isAdvancing = requested === 'completed' || requested === 'skipped';
    if (isAdvancing && stage !== PROJECT_STAGES.at(-1)) {
      const nextIndex = milestoneIndex + 1;
      const nextMilestone = milestones[nextIndex];
      nextMilestone.status = 'in_progress';
      nextMilestone.updatedBy = user.id;
      nextMilestone.updatedAt = now;
      nextStage = nextMilestone.stage;
    } else if (isAdvancing && stage === PROJECT_STAGES.at(-1)) {
      nextStage = 'completed';
      nextStatus = 'completed';
    }

    events.push({
      eventType: 'milestone_updated',
      fromStage: stage,
      toStage: nextStage,
      milestoneStatus: requested,
      fromProjectStatus: project.projectStatus,
      toProjectStatus: nextStatus,
      note: input.note,
      performedBy: user.id,
      createdAt: now,
    });
  }

  const updated = await Project.findOneAndUpdate(
    {
      _id: project._id,
      ...getProjectScope(user),
      updatedAt: project.updatedAt,
    },
    {
      $set: {
        currentStage: nextStage,
        projectStatus: nextStatus,
        milestoneHistory: milestones,
      },
      $push: { projectHistory: { $each: events } },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new AppError('Project changed while you were updating it. Refresh and retry.', 409);
  }

  return toProjectDTO(updated);
}

function hashPublicToken(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function validatePublicToken(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new AppError('Project status not found.', 404);
  }
}

export async function issuePublicProjectStatusToken(user, projectId) {
  requireUser(user);
  validateId(projectId, 'project ID');
  const project = await findAccessibleProject(user, projectId);

  if (['completed', 'cancelled'].includes(project.projectStatus)) {
    throw new AppError('A public status link cannot be issued for a completed or cancelled project.', 409);
  }

  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PUBLIC_TOKEN_TTL_MS);

  const updated = await Project.findOneAndUpdate(
    { _id: project._id, ...getProjectScope(user), updatedAt: project.updatedAt },
    {
      $set: {
        statusTokenHash: hashPublicToken(token),
        statusTokenIssuedAt: now,
        statusTokenExpiresAt: expiresAt,
        statusTokenRevokedAt: null,
      },
      $push: {
        projectHistory: {
          eventType: 'public_token_issued',
          note: 'Public project status link issued or rotated.',
          performedBy: user.id,
          createdAt: now,
        },
      },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw new AppError('Project changed while the status link was being issued. Retry.', 409);

  return {
    token,
    path: '/api/v1/public/project-status/' + token,
    expiresAt,
    rotated: Boolean(project.statusTokenIssuedAt && !project.statusTokenRevokedAt),
  };
}

export async function revokePublicProjectStatusToken(user, projectId) {
  requireUser(user);
  validateId(projectId, 'project ID');
  const project = await findAccessibleProject(user, projectId);

  if (!project.statusTokenIssuedAt || project.statusTokenRevokedAt) {
    throw new AppError('No active public project status link exists.', 404);
  }

  const now = new Date();
  const updated = await Project.findOneAndUpdate(
    {
      _id: project._id,
      ...getProjectScope(user),
      updatedAt: project.updatedAt,
      statusTokenHash: { $type: 'string' },
      statusTokenRevokedAt: null,
    },
    {
      $set: {
        statusTokenHash: null,
        statusTokenRevokedAt: now,
      },
      $push: {
        projectHistory: {
          eventType: 'public_token_revoked',
          note: 'Public project status link revoked.',
          performedBy: user.id,
          createdAt: now,
        },
      },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw new AppError('Project status link changed before it could be revoked.', 409);
  return { projectId: toId(project._id), revokedAt: now, revoked: true };
}

export async function getPublicProjectStatus(token) {
  validatePublicToken(token);
  const now = new Date();
  const project = await Project.findOne({
    statusTokenHash: hashPublicToken(token),
    statusTokenRevokedAt: null,
    statusTokenExpiresAt: { $gt: now },
  })
    .select('currentStage projectStatus milestoneHistory updatedAt _id')
    .lean();

  if (!project) throw new AppError('Project status not found.', 404);

  return {
    projectReference: 'SQP-' + String(project._id).slice(-8).toUpperCase(),
    currentStage: project.currentStage,
    projectStatus: project.projectStatus,
    milestones: (project.milestoneHistory ?? []).map((milestone) => ({
      stage: milestone.stage,
      status: milestone.status,
      completedAt: milestone.completedAt ?? null,
      updatedAt: milestone.updatedAt ?? null,
    })),
    lastUpdatedAt: project.updatedAt,
  };
}
