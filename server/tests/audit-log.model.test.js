import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import AuditLog from '../src/modules/audit-logs/audit-log.model.js';

describe('Audit Log Model', () => {
  const validLog = () => ({
    actorId: new mongoose.Types.ObjectId(),
    action: 'PROJECT_CREATED',
    resourceType: 'Project',
  });

  it('creates a valid audit log with default values', async () => {
    const log = new AuditLog(validLog());
    await expect(log.validate()).resolves.toBeUndefined();

    expect(log.metadata).toEqual({});
    expect(log.resourceId).toBeNull();
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('accepts safe metadata and resource IDs', async () => {
    const resourceId = new mongoose.Types.ObjectId();
    const log = new AuditLog({
      ...validLog(),
      resourceId,
      metadata: { source: 'sales_dashboard', projectId: resourceId.toString() },
    });

    await expect(log.validate()).resolves.toBeUndefined();
    expect(log.resourceId.toString()).toBe(resourceId.toString());
    expect(log.metadata).toEqual({
      source: 'sales_dashboard',
      projectId: resourceId.toString(),
    });
  });

  it('removes credentials, tokens, notes and bill contents from metadata', async () => {
    const log = new AuditLog({
      ...validLog(),
      metadata: {
        projectId: '507f1f77bcf86cd799439011',
        leadId: 'Bearer ' + 'a'.repeat(43),
        toProjectStatus: 'on_hold',
        password: 'secret-password',
        accessToken: 'secret-token',
        statusToken: 'secret-public-link',
        note: 'private note',
        extractedText: 'complete electricity bill content',
        billContents: 'complete electricity bill content',
        signedUrl: 'https://private.example/file',
        encryptionKey: 'secret-key',
      },
    });

    expect(log.metadata).toEqual({
      projectId: '507f1f77bcf86cd799439011',
      toProjectStatus: 'on_hold',
    });
  });

  it('requires an actor ID', async () => {
    const data = validLog();
    delete data.actorId;
    const log = new AuditLog(data);
    await expect(log.validate()).rejects.toHaveProperty('errors.actorId');
  });

  it('requires an action', async () => {
    const data = validLog();
    delete data.action;
    const log = new AuditLog(data);
    await expect(log.validate()).rejects.toHaveProperty('errors.action');
  });

  it('requires a resource type', async () => {
    const data = validLog();
    delete data.resourceType;
    const log = new AuditLog(data);
    await expect(log.validate()).rejects.toHaveProperty('errors.resourceType');
  });

  it('rejects an action longer than 120 characters', async () => {
    const log = new AuditLog({ ...validLog(), action: 'a'.repeat(121) });
    await expect(log.validate()).rejects.toHaveProperty('errors.action');
  });
});
