import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const services = vi.hoisted(() => ({
  getProjectNotifications: vi.fn(),
  getAuditLogs: vi.fn(),
}));

vi.mock('../src/modules/notifications/notification.service.js', () => ({
  createProjectEventNotifications: vi.fn(),
  getProjectNotifications: services.getProjectNotifications,
}));
vi.mock('../src/modules/audit-logs/audit-log.service.js', () => ({
  recordAuditEvent: vi.fn(),
  getAuditLogs: services.getAuditLogs,
}));
vi.mock('../src/modules/users/user.model.js', () => ({
  default: { findById: vi.fn() },
}));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const PROJECT_ID = '507f1f77bcf86cd799439016';

function token(id, role = 'homeowner') {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: id,
    expiresIn: '1h',
    issuer: 'solarqualify-api',
  });
}
function auth(id, role = 'homeowner') {
  return { Authorization: 'Bearer ' + token(id, role) };
}
function mockUser(id, role) {
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      _id: { toString: () => id },
      name: 'Test User',
      email: 'test@example.com',
      role,
      phone: '9876543210',
      isActive: true,
    }),
  });
}

describe('Notification and Audit HTTP APIs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication to retrieve project notifications', async () => {
    await request(app)
      .get('/api/v1/projects/' + PROJECT_ID + '/notifications')
      .expect(401);
    expect(services.getProjectNotifications).not.toHaveBeenCalled();
  });

  it('allows a homeowner to retrieve their project notification history', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    services.getProjectNotifications.mockResolvedValue({
      notifications: [{
        id: 'notification-1',
        projectId: PROJECT_ID,
        channel: 'in_app',
        messageType: 'project_created',
        title: 'Solar project created',
        message: 'Your solar project has been created.',
        deliveryStatus: 'simulated',
      }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });

    const response = await request(app)
      .get('/api/v1/projects/' + PROJECT_ID + '/notifications?page=1&pageSize=20')
      .set(auth(HOMEOWNER_ID))
      .expect(200);

    expect(response.body.data.notifications[0].deliveryStatus).toBe('simulated');
    expect(services.getProjectNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ id: HOMEOWNER_ID, role: 'homeowner' }),
      PROJECT_ID,
      { page: '1', pageSize: '20' }
    );
  });

  it('allows assigned Sales Staff to retrieve project notification history', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    services.getProjectNotifications.mockResolvedValue({
      notifications: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    });

    await request(app)
      .get('/api/v1/projects/' + PROJECT_ID + '/notifications')
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(services.getProjectNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      PROJECT_ID,
      {}
    );
  });

  it('requires authentication to retrieve audit logs', async () => {
    await request(app).get('/api/v1/audit-logs').expect(401);
    expect(services.getAuditLogs).not.toHaveBeenCalled();
  });

  it('prevents homeowners from retrieving staff audit logs', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    await request(app)
      .get('/api/v1/audit-logs')
      .set(auth(HOMEOWNER_ID))
      .expect(403);
    expect(services.getAuditLogs).not.toHaveBeenCalled();
  });

  it('allows Sales Staff to retrieve their authorized audit logs', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    services.getAuditLogs.mockResolvedValue({
      logs: [{
        id: 'audit-1',
        actorId: STAFF_ID,
        action: 'PROJECT_STATUS_CHANGED',
        resourceType: 'Project',
        resourceId: PROJECT_ID,
        metadata: { projectId: PROJECT_ID, toProjectStatus: 'on_hold' },
      }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });

    const response = await request(app)
      .get('/api/v1/audit-logs?action=PROJECT_STATUS_CHANGED&projectId=' + PROJECT_ID)
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(response.body.data.logs[0].action).toBe('PROJECT_STATUS_CHANGED');
    expect(services.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      { action: 'PROJECT_STATUS_CHANGED', projectId: PROJECT_ID }
    );
  });
});
