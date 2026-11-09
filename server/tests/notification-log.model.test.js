import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import NotificationLog from '../src/modules/notifications/notification-log.model.js';

describe('Notification Log Model', () => {
  const validNotification = () => ({
    projectId: new mongoose.Types.ObjectId(),
    recipientId: new mongoose.Types.ObjectId(),
    channel: 'in_app',
    messageType: 'project_created',
    title: 'Solar project created',
    message: 'Your rooftop solar project has been created.',
  });

  it('creates a simulated in-app notification by default', async () => {
    const notification = new NotificationLog(validNotification());
    await expect(notification.validate()).resolves.toBeUndefined();

    expect(notification.deliveryStatus).toBe('simulated');
    expect(notification.channel).toBe('in_app');
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  it('rejects SMS and WhatsApp while delivery is simulated only', async () => {
    for (const channel of ['sms', 'whatsapp']) {
      const notification = new NotificationLog({
        ...validNotification(),
        channel,
      });
      await expect(notification.validate()).rejects.toHaveProperty('errors.channel');
    }
  });

  it('rejects an unsupported notification event type', async () => {
    const notification = new NotificationLog({
      ...validNotification(),
      messageType: 'arbitrary_message',
    });
    await expect(notification.validate()).rejects.toHaveProperty('errors.messageType');
  });

  it('rejects unsupported delivery statuses', async () => {
    const notification = new NotificationLog({
      ...validNotification(),
      deliveryStatus: 'delivered',
    });
    await expect(notification.validate()).rejects.toHaveProperty('errors.deliveryStatus');
  });

  it('requires a recipient ID', async () => {
    const data = validNotification();
    delete data.recipientId;
    const notification = new NotificationLog(data);
    await expect(notification.validate()).rejects.toHaveProperty('errors.recipientId');
  });

  it('requires a project ID', async () => {
    const data = validNotification();
    delete data.projectId;
    const notification = new NotificationLog(data);
    await expect(notification.validate()).rejects.toHaveProperty('errors.projectId');
  });

  it('requires a title and a message', async () => {
    const data = validNotification();
    delete data.title;
    delete data.message;
    const notification = new NotificationLog(data);
    const error = await notification.validate().catch((value) => value);
    expect(error.errors.title).toBeDefined();
    expect(error.errors.message).toBeDefined();
  });
});
