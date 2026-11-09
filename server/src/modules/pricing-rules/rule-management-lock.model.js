import mongoose from 'mongoose';

const ruleManagementLockSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    ruleType: {
      type: String,
      enum: ['pricing', 'subsidies', 'generation'],
      required: true,
    },

    ruleName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    ownerToken: {
      type: String,
      default: null,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'rulemanagementlocks',
  }
);

const RuleManagementLock = mongoose.model(
  'RuleManagementLock',
  ruleManagementLockSchema
);

export default RuleManagementLock;
