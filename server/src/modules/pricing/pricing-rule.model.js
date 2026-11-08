import mongoose from 'mongoose';

const pricingRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    pricePerKW: {
      type: Number,
      required: true,
      min: 0,
    },

    installationCharges: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
      default: 'draft',
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

pricingRuleSchema.index({ status: 1, effectiveFrom: -1 });
pricingRuleSchema.index({ ruleName: 1, version: 1 }, { unique: true });

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);

export default PricingRule;