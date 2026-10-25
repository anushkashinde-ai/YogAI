import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { EXPERIENCE_LEVELS, YOGA_GOALS, INTENSITIES } from '../config/constants.js'

const SALT_ROUNDS = 12

const preferencesSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    practiceDuration: { type: Number, min: 5, max: 180, default: 30 },
    intensity: { type: String, enum: INTENSITIES, default: 'moderate' },
    reminderEnabled: { type: Boolean, default: false },
    weeklyGoalSessions: { type: Number, min: 1, max: 21, default: 4 },
    soundEnabled: { type: Boolean, default: true },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      default: 'beginner',
    },
    yogaGoals: {
      type: [{ type: String, enum: YOGA_GOALS }],
      default: [],
      validate: {
        validator: (goals) => goals.length <= 6,
        message: 'Please choose at most 6 yoga goals',
      },
    },
    preferences: { type: preferencesSchema, default: () => ({}) },
    favoritePoses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'YogaPose' }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash
        delete ret.resetPasswordToken
        delete ret.resetPasswordExpires
        delete ret.__v
        return ret
      },
    },
  }
)

userSchema.index({ createdAt: -1 })

/** Hash a plaintext password with bcrypt. */
userSchema.statics.hashPassword = function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS)
}

/** Constant-time compare of a candidate password against the stored hash. */
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.passwordHash) return Promise.resolve(false)
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

/** Shape sent to the client (never leaks the hash). */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    experienceLevel: this.experienceLevel,
    yogaGoals: this.yogaGoals,
    preferences: this.preferences,
    favoritePoses: this.favoritePoses,
    joinedChallenges: this.joinedChallenges,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  }
}

const User = mongoose.model('User', userSchema)

export default User
