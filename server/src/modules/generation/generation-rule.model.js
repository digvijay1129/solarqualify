import mongoose from 'mongoose';

const generationRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    unitsPerKWPerYear: {
      type: Number,
      required: true,
      min: 0.1,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return !value || !this.effectiveFrom || value > this.effectiveFrom;
        },
        message: 'Effective end date must be later than the start date.',
      },
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

generationRuleSchema.index({ status: 1, effectiveFrom: -1 });
generationRuleSchema.index({ ruleName: 1, version: 1 }, { unique: true });
generationRuleSchema.index({
  ruleName: 1,
  status: 1,
  effectiveFrom: 1,
  effectiveTo: 1,
});

const GenerationRule = mongoose.model(
  'GenerationRule',
  generationRuleSchema
);

export default GenerationRule;