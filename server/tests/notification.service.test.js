import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notification: { insertMany: vi.fn(), find: vi.fn(), countDocuments: vi.fn() },
  project: { findOne: vi.fn() },
}));

vi.mock('../src/modules/notifications/notification-log.model.js', () => ({
  default: mocks.notification,
}));
vi.mock('../src/modules/projects/project.model.js', () => ({
  default: mocks.project,
}));

import NotificationLog from '../src/modules/notifications/notification-log.model.js';
import Project from '../src/modules/projects/project.model.js';
import {
  createProjectEventNotifications,
  getProjectNotifications,
} from '../src/modules/notifications/notification.service.js';

const PROJECT_ID = '507f1f77bcf86cd799439016';
const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const OTHER_ID = '507f1f77bcf86cd799439013';

function query(value) {
  return {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Project.findOne.mockReturnValue(query({ _id: PROJECT_ID }));
    const notification = {
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(PROJECT_ID),
      recipientId: new mongoose.Types.ObjectId(HOMEOWNER_ID),
      channel: 'in_app',
      messageType: 'project_created',
      title: 'Solar project created',
      message: 'Your rooftop solar project has been created and is ready for the site survey stage.',
      deliveryStatus: 'simulated',
      simulatedAt: new Date(),
      createdAt: new Date(),
    };
    mocks.notification.insertMany.mockResolvedValue([notification]);
    mocks.notification.find.mockReturnValue(query([notification]));
    mocks.notification.countDocuments.mockResolvedValue(1);
  });

  it('creates simulated in-app records for unique recipients', async () => {
    await createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: [HOMEOWNER_ID, STAFF_ID, HOMEOWNER_ID, null],
      actorId: STAFF_ID,
      eventType: 'project_created',
      stage: 'site_survey',
      projectStatus: 'active',
    });

    const records = NotificationLog.insertMany.mock.calls[0][0];
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual(expect.objectContaining({
      channel: 'in_app',
      deliveryStatus: 'simulated',
      recipientId: HOMEOWNER_ID,
      createdBy: STAFF_ID,
      messageType: 'project_created',
    }));
    expect(records[0].message).not.toContain('token');
  });

  it('generates a controlled milestone message and ignores caller-supplied message content', async () => {
    await createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: [HOMEOWNER_ID],
      actorId: STAFF_ID,
      eventType: 'project_stage_updated',
      stage: 'installation_in_progress',
      milestoneStatus: 'completed',
      message: 'private content, token or bill text must not be stored',
    });

    const record = NotificationLog.insertMany.mock.calls[0][0][0];
    expect(record.title).toBe('Project milestone updated');
    expect(record.message).toContain('Installation In Progress');
    expect(record.message).toContain('Completed');
    expect(record.message).not.toContain('private content');
  });

  it('creates a controlled project status notification', async () => {
    await createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: [HOMEOWNER_ID],
      actorId: STAFF_ID,
      eventType: 'project_status_changed',
      stage: 'installation_in_progress',
      projectStatus: 'on_hold',
    });

    const record = NotificationLog.insertMany.mock.calls[0][0][0];
    expect(record.title).toBe('Project status updated');
    expect(record.message).toContain('On Hold');
    expect(record.message).toContain('Installation In Progress');
    expect(record.deliveryStatus).toBe('simulated');
  });

  it('rejects a stage value that could contain caller-supplied sensitive data', async () => {
    await expect(createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: [HOMEOWNER_ID],
      actorId: STAFF_ID,
      eventType: 'project_created',
      stage: 'Bearer-secret-token',
    })).rejects.toThrow('Invalid project notification stage.');
    expect(NotificationLog.insertMany).not.toHaveBeenCalled();
  });

  it('does not call SMS or WhatsApp providers', async () => {
    await createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: [HOMEOWNER_ID],
      actorId: STAFF_ID,
      eventType: 'project_created',
    });
    expect(NotificationLog.insertMany.mock.calls[0][0][0].channel).toBe('in_app');
  });

  it('returns no records when there are no linked recipients', async () => {
    const result = await createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: [],
      actorId: STAFF_ID,
      eventType: 'project_created',
    });
    expect(result).toEqual([]);
    expect(NotificationLog.insertMany).not.toHaveBeenCalled();
  });

  it('rejects unknown notification event types', async () => {
    await expect(createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: [HOMEOWNER_ID],
      actorId: STAFF_ID,
      eventType: 'arbitrary_message',
    })).rejects.toThrow('Unsupported project notification event type.');
  });

  it('rejects invalid recipient IDs', async () => {
    await expect(createProjectEventNotifications({
      projectId: PROJECT_ID,
      recipientIds: ['invalid'],
      actorId: STAFF_ID,
      eventType: 'project_created',
    })).rejects.toThrow('Invalid notification recipient ID.');
  });

  it('scopes homeowner notification history to the homeowner recipient ID', async () => {
    const result = await getProjectNotifications(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      PROJECT_ID,
      {}
    );
    expect(Project.findOne).toHaveBeenCalledWith({
      _id: PROJECT_ID,
      homeownerId: HOMEOWNER_ID,
    });
    expect(NotificationLog.find).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      recipientId: HOMEOWNER_ID,
    });
    expect(result.notifications).toHaveLength(1);
  });

  it('allows assigned staff to read project notification records', async () => {
    await getProjectNotifications(
      { id: STAFF_ID, role: 'salesStaff' },
      PROJECT_ID,
      {}
    );
    expect(Project.findOne).toHaveBeenCalledWith({
      _id: PROJECT_ID,
      assignedSalesStaffId: STAFF_ID,
    });
    expect(NotificationLog.find).toHaveBeenCalledWith({ projectId: PROJECT_ID });
  });

  it('hides notifications for projects outside the caller scope', async () => {
    Project.findOne.mockReturnValue(query(null));
    await expect(getProjectNotifications(
      { id: OTHER_ID, role: 'salesStaff' },
      PROJECT_ID,
      {}
    )).rejects.toMatchObject({ statusCode: 404 });
    expect(NotificationLog.find).not.toHaveBeenCalled();
  });

  it('rejects excessive notification page sizes', async () => {
    await expect(getProjectNotifications(
      { id: STAFF_ID, role: 'salesStaff' },
      PROJECT_ID,
      { pageSize: '1000' }
    )).rejects.toMatchObject({ statusCode: 400 });
    expect(NotificationLog.find).not.toHaveBeenCalled();
  });
});
