import mongoose from 'mongoose';

const subsidySlabSchema = new mongoose.Schema(
  {
    upToKW: {
      type: Number,
      required: true,
      min: 0.1,
    },

    amountPerKW: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const subsidyRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    slabs: {
      type: [subsidySlabSchema],
      required: true,
      validate: [
        {
          validator(slabs) {
            return (
              slabs.length > 0 &&
              slabs.every(
                (slab, index) =>
                  index === 0 || slab.upToKW > slabs[index - 1].upToKW
              )
            );
          },
          message: 'Subsidy slabs must be non-empty and ordered by increasing capacity.',
        },
      ],
    },

    maximumSubsidy: {
      type: Number,
      required: true,
      min: 0,
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

    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'rejected'],
      default: 'unverified',
      index: true,
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

subsidyRuleSchema.index({ status: 1, effectiveFrom: -1 });
subsidyRuleSchema.index({ ruleName: 1, version: 1 }, { unique: true });
subsidyRuleSchema.index({
  ruleName: 1,
  status: 1,
  effectiveFrom: 1,
  effectiveTo: 1,
});

const SubsidyRule = mongoose.model('SubsidyRule', subsidyRuleSchema);

export default SubsidyRule;