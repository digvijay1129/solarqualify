import mongoose from 'mongoose';

import NotificationLog from './notification-log.model.js';
import Project from '../projects/project.model.js';
import { AppError } from '../../shared/errors/AppError.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const PROJECT_STAGES = new Set([
  'site_survey',
  'system_design',
  'customer_approval',
  'installation_scheduled',
  'installation_in_progress',
  'inspection',
  'net_metering',
  'completed',
]);
const MILESTONE_STATUSES = new Set(['pending', 'in_progress', 'completed', 'skipped']);
const PROJECT_STATUSES = new Set(['active', 'on_hold', 'completed', 'cancelled']);

const EVENT_COPY = Object.freeze({
  project_created: {
    title: 'Solar project created',
    message: 'Your rooftop solar project has been created and is ready for the site survey stage.',
  },
  project_stage_updated: {
    title: 'Project milestone updated',
    message: (stage, status) => 'Your project milestone ' + stage + ' is now marked as ' + status + '.',
  },
  project_status_changed: {
    title: 'Project status updated',
    message: (stage, status) => 'Your project status is now ' + status + '. Current stage: ' + stage + '.',
  },
});

function humanize(value) {
  return String(value ?? '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function requireUser(user) {
  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !['homeowner', 'salesStaff'].includes(user.role)
  ) {
    throw new AppError('You are not authorized to access notifications.', 403);
  }
}

function validateId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError('Invalid ' + label + '.', 400);
  }
}

function projectScope(user) {
  return user.role === 'homeowner'
    ? { homeownerId: user.id }
    : { assignedSalesStaffId: user.id };
}

function getPagination(filters = {}) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    throw new AppError('Invalid notification filters.', 400);
  }

  if (Object.keys(filters).some((key) => !['page', 'pageSize'].includes(key))) {
    throw new AppError('Unsupported notification filter.', 400);
  }

  const page = Number(filters.page ?? 1);
  const pageSize = Number(filters.pageSize ?? DEFAULT_PAGE_SIZE);
  if (!Number.isInteger(page) || page < 1 || page > 100000) {
    throw new AppError('Page must be a positive integer.', 400);
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new AppError('Page size must be an integer between 1 and 100.', 400);
  }
  return { page, pageSize };
}

function toNotificationDTO(item) {
  return {
    id: item._id.toString(),
    projectId: item.projectId.toString(),
    channel: item.channel,
    messageType: item.messageType,
    title: item.title,
    message: item.message,
    deliveryStatus: item.deliveryStatus,
    simulatedAt: item.simulatedAt,
    createdAt: item.createdAt,
  };
}

/**
 * Save a safe, in-app notification generated from a known project event.
 * No caller-supplied free-form message is accepted and no external provider
 * is contacted during this phase.
 */
export async function createProjectEventNotifications({
  projectId,
  recipientIds,
  actorId = null,
  eventType,
  stage = 'site_survey',
  milestoneStatus = null,
  projectStatus = 'active',
}) {
  validateId(projectId, 'project ID');
  if (actorId !== null) validateId(actorId, 'notification actor ID');

  if (!Object.hasOwn(EVENT_COPY, eventType)) {
    throw new TypeError('Unsupported project notification event type.');
  }
  const copy = EVENT_COPY[eventType];

  if (!PROJECT_STAGES.has(stage)) {
    throw new TypeError('Invalid project notification stage.');
  }
  if (
    eventType === 'project_stage_updated' &&
    !MILESTONE_STATUSES.has(milestoneStatus)
  ) {
    throw new TypeError('Invalid project notification milestone status.');
  }
  if (
    eventType === 'project_status_changed' &&
    !PROJECT_STATUSES.has(projectStatus)
  ) {
    throw new TypeError('Invalid project notification project status.');
  }

  if (!Array.isArray(recipientIds)) {
    throw new TypeError('Notification recipient IDs must be an array.');
  }

  const recipients = [...new Set(recipientIds.filter(Boolean).map(String))];
  for (const recipientId of recipients) validateId(recipientId, 'notification recipient ID');
  if (recipients.length === 0) return [];

  const stageLabel = humanize(stage);
  let message = copy.message;
  if (typeof message === 'function') {
    message = eventType === 'project_stage_updated'
      ? message(stageLabel, humanize(milestoneStatus))
      : message(stageLabel, humanize(projectStatus));
  }

  const createdAt = new Date();
  const records = recipients.map((recipientId) => ({
    projectId,
    recipientId,
    createdBy: actorId,
    channel: 'in_app',
    messageType: eventType,
    title: copy.title,
    message,
    deliveryStatus: 'simulated',
    simulatedAt: createdAt,
    createdAt,
  }));

  return NotificationLog.insertMany(records, { ordered: true });
}

export async function getProjectNotifications(user, projectId, filters = {}) {
  requireUser(user);
  validateId(projectId, 'project ID');
  const { page, pageSize } = getPagination(filters);

  const project = await Project.findOne({
    _id: projectId,
    ...projectScope(user),
  }).select('_id').lean();

  if (!project) throw new AppError('Project not found.', 404);

  const query = { projectId: project._id };
  if (user.role === 'homeowner') query.recipientId = user.id;

  const [items, totalItems] = await Promise.all([
    NotificationLog.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    NotificationLog.countDocuments(query),
  ]);

  return {
    notifications: items.map(toNotificationDTO),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}