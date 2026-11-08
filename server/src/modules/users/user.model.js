import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, 'Email is required.'],
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      select: false,
    },

    role: {
      type: String,
      enum: ['homeowner', 'salesStaff'],
      required: true,
      default: 'homeowner',
    },

    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;