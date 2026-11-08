import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import NotificationLog from '../src/modules/notifications/notification-log.model.js';

describe('Notification Log Model', () => {
  const validNotification = () => ({
    recipientId: new mongoose.Types.ObjectId(),
    channel: 'sms',
    messageType: 'project_status_update',
  });

  it('should create a valid notification with default values', async () => {
    const notification = new NotificationLog(validNotification());

    await expect(notification.validate()).resolves.toBeUndefined();

    expect(notification.deliveryStatus).toBe('simulated');
    expect(notification.projectId).toBeNull();
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  it('should accept WhatsApp as a notification channel', async () => {
    const notification = new NotificationLog({
      ...validNotification(),
      channel: 'whatsapp',
    });

    await expect(notification.validate()).resolves.toBeUndefined();
  });

  it('should reject an unsupported notification channel', async () => {
    const notification = new NotificationLog({
      ...validNotification(),
      channel: 'email',
    });

    await expect(notification.validate()).rejects.toHaveProperty(
      'errors.channel'
    );
  });

  it('should reject an unsupported delivery status', async () => {
    const notification = new NotificationLog({
      ...validNotification(),
      deliveryStatus: 'delivered',
    });

    await expect(notification.validate()).rejects.toHaveProperty(
      'errors.deliveryStatus'
    );
  });

  it('should require a recipient ID', async () => {
    const data = validNotification();
    delete data.recipientId;

    const notification = new NotificationLog(data);

    await expect(notification.validate()).rejects.toHaveProperty(
      'errors.recipientId'
    );
  });
});
