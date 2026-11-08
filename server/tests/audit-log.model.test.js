import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import AuditLog from '../src/modules/audit-logs/audit-log.model.js';

describe('Audit Log Model', () => {
  const validLog = () => ({
    actorId: new mongoose.Types.ObjectId(),
    action: 'lead.created',
    resourceType: 'Lead',
  });

  it('should create a valid audit log with default values', async () => {
    const log = new AuditLog(validLog());

    await expect(log.validate()).resolves.toBeUndefined();

    expect(log.metadata).toEqual({});
    expect(log.resourceId).toBeNull();
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('should accept custom metadata and a resource ID', async () => {
    const resourceId = new mongoose.Types.ObjectId();

    const log = new AuditLog({
      ...validLog(),
      resourceId,
      metadata: { source: 'sales_dashboard' },
    });

    await expect(log.validate()).resolves.toBeUndefined();

    expect(log.resourceId.toString()).toBe(resourceId.toString());
    expect(log.metadata.source).toBe('sales_dashboard');
  });

  it('should require an actor ID', async () => {
    const data = validLog();
    delete data.actorId;

    const log = new AuditLog(data);

    await expect(log.validate()).rejects.toHaveProperty('errors.actorId');
  });

  it('should require an action', async () => {
    const data = validLog();
    delete data.action;

    const log = new AuditLog(data);

    await expect(log.validate()).rejects.toHaveProperty('errors.action');
  });

  it('should require a resource type', async () => {
    const data = validLog();
    delete data.resourceType;

    const log = new AuditLog(data);

    await expect(log.validate()).rejects.toHaveProperty(
      'errors.resourceType'
    );
  });

  it('should reject an action longer than 120 characters', async () => {
    const log = new AuditLog({
      ...validLog(),
      action: 'a'.repeat(121),
    });

    await expect(log.validate()).rejects.toHaveProperty('errors.action');
  });
});
