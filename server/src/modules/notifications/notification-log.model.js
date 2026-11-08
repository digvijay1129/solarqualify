import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true,
    },

    messageType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    deliveryStatus: {
      type: String,
      enum: ['simulated', 'queued', 'sent', 'failed'],
      default: 'simulated',
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
  }
);

notificationLogSchema.index({ recipientId: 1, createdAt: -1 });
notificationLogSchema.index({ projectId: 1, createdAt: -1 });

const NotificationLog = mongoose.model(
  'NotificationLog',
  notificationLogSchema
);

export default NotificationLog;