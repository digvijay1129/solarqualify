import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    channel: {
      type: String,
      enum: ['in_app'],
      default: 'in_app',
      required: true,
    },
    messageType: {
      type: String,
      enum: ['project_created', 'project_stage_updated', 'project_status_changed'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    deliveryStatus: {
      type: String,
      enum: ['simulated', 'simulation_failed'],
      default: 'simulated',
      index: true,
    },
    simulatedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { versionKey: false }
);

notificationLogSchema.index({ projectId: 1, createdAt: -1 });
notificationLogSchema.index({ recipientId: 1, createdAt: -1 });
notificationLogSchema.index({ projectId: 1, recipientId: 1, createdAt: -1 });

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);
export default NotificationLog;