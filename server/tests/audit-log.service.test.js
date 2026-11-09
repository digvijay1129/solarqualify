import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  audit: { create: vi.fn(), find: vi.fn(), countDocuments: vi.fn() },
  project: { findOne: vi.fn() },
}));

vi.mock('../src/modules/audit-logs/audit-log.model.js', () => ({
  default: mocks.audit,
}));
vi.mock('../src/modules/projects/project.model.js', () => ({
  default: mocks.project,
}));

import AuditLog from '../src/modules/audit-logs/audit-log.model.js';
import Project from '../src/modules/projects/project.model.js';
import {
  recordAuditEvent,
  getAuditLogs,
} from '../src/modules/audit-logs/audit-log.service.js';

const STAFF_ID = '507f1f77bcf86cd799439012';
const OTHER_ID = '507f1f77bcf86cd799439013';
const PROJECT_ID = '507f1f77bcf86cd799439016';

function query(value) {
  return {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

describe('Audit Log Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuditLog.create.mockResolvedValue({ _id: PROJECT_ID });
    AuditLog.find.mockReturnValue(query([{
      _id: PROJECT_ID,
      actorId: STAFF_ID,
      action: 'PROJECT_STATUS_CHANGED',
      resourceType: 'Project',
      resourceId: PROJECT_ID,
      metadata: {
        projectId: PROJECT_ID,
        toProjectStatus: 'on_hold',
        token: 'should-not-be-exposed',
      },
      createdAt: new Date(),
    }]));
    AuditLog.countDocuments.mockResolvedValue(1);
    Project.findOne.mockReturnValue(query({ _id: PROJECT_ID }));
  });

  it('records an allowlisted project action and only safe metadata keys', async () => {
    await recordAuditEvent({
      actorId: STAFF_ID,
      action: 'PROJECT_STATUS_CHANGED',
      resourceType: 'Project',
      resourceId: PROJECT_ID,
      metadata: {
        projectId: PROJECT_ID,
        leadId: 'Bearer ' + 'a'.repeat(43),
        toProjectStatus: 'on_hold',
        token: 'secret-token',
        password: 'secret-password',
        billText: 'complete bill content',
        note: 'private free-form note',
      },
    });

    expect(AuditLog.create).toHaveBeenCalledWith({
      actorId: STAFF_ID,
      action: 'PROJECT_STATUS_CHANGED',
      resourceType: 'Project',
      resourceId: PROJECT_ID,
      metadata: {
        projectId: PROJECT_ID,
        toProjectStatus: 'on_hold',
      },
    });
  });

  it('rejects unsupported audit actions', async () => {
    await expect(recordAuditEvent({
      actorId: STAFF_ID,
      action: 'UNKNOWN_ACTION',
      resourceType: 'Project',
    })).rejects.toThrow('Unsupported audit action.');
    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  it('rejects invalid actor IDs', async () => {
    await expect(recordAuditEvent({
      actorId: 'bad',
      action: 'PROJECT_CREATED',
      resourceType: 'Project',
    })).rejects.toThrow('Invalid audit actor ID.');
  });

  it('rejects unsupported resource types', async () => {
    await expect(recordAuditEvent({
      actorId: STAFF_ID,
      action: 'PROJECT_CREATED',
      resourceType: 'Credential',
    })).rejects.toThrow('Unsupported audit resource type.');
  });

  it('restricts audit retrieval to Sales Staff', async () => {
    await expect(getAuditLogs({ id: OTHER_ID, role: 'homeowner' }, {}))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(AuditLog.find).not.toHaveBeenCalled();
  });

  it('returns only the authenticated staff member audit events', async () => {
    const result = await getAuditLogs({ id: STAFF_ID, role: 'salesStaff' }, {});
    expect(AuditLog.find).toHaveBeenCalledWith({ actorId: STAFF_ID });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].metadata).toEqual({
      projectId: PROJECT_ID,
      toProjectStatus: 'on_hold',
    });
    expect(JSON.stringify(result)).not.toContain('should-not-be-exposed');
  });

  it('validates a requested project against the current staff assignment', async () => {
    await getAuditLogs(
      { id: STAFF_ID, role: 'salesStaff' },
      { projectId: PROJECT_ID }
    );
    expect(Project.findOne).toHaveBeenCalledWith({
      _id: PROJECT_ID,
      assignedSalesStaffId: STAFF_ID,
    });
    expect(AuditLog.find).toHaveBeenCalledWith({
      actorId: STAFF_ID,
      'metadata.projectId': PROJECT_ID,
    });
  });

  it('does not return logs for projects outside the current assignment', async () => {
    Project.findOne.mockReturnValue(query(null));
    await expect(getAuditLogs(
      { id: STAFF_ID, role: 'salesStaff' },
      { projectId: PROJECT_ID }
    )).rejects.toMatchObject({ statusCode: 404 });
    expect(AuditLog.find).not.toHaveBeenCalled();
  });

  it('rejects unbounded page sizes', async () => {
    await expect(getAuditLogs(
      { id: STAFF_ID, role: 'salesStaff' },
      { pageSize: '1000' }
    )).rejects.toMatchObject({ statusCode: 400 });
  });

  it('excludes credentials and document contents from returned metadata', async () => {
    const result = await getAuditLogs({ id: STAFF_ID, role: 'salesStaff' }, {});
    expect(result.logs[0].metadata).not.toHaveProperty('token');
    expect(result.logs[0].metadata).not.toHaveProperty('password');
    expect(result.logs[0].metadata).not.toHaveProperty('billText');
  });
});
