import mongoose from 'mongoose'
import { POSE_DIFFICULTIES, INTENSITIES } from '../config/constants.js'

const routinePoseSchema = new mongoose.Schema(
  {
    pose: { type: mongoose.Schema.Types.ObjectId, ref: 'YogaPose', required: true },
    durationSeconds: { type: Number, default: 30, min: 5, max: 900 },
    restSeconds: { type: Number, default: 10, min: 0, max: 300 },
    notes: { type: String, trim: true, maxlength: 240, default: '' },
    part: {
      type: String,
      enum: ['warm-up', 'main', 'cool-down'],
      default: 'main',
    },
  },
  { _id: false }
)

const yogaRoutineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Routine title is required'],
      trim: true,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 800, default: '' },
    goal: { type: String, trim: true, default: 'general-wellness' },
    difficulty: { type: String, enum: POSE_DIFFICULTIES, default: 'beginner' },
    intensity: { type: String, enum: INTENSITIES, default: 'moderate' },
    durationMinutes: { type: Number, min: 5, max: 180, default: 20 },
    poses: {
      type: [routinePoseSchema],
      default: [],
      validate: {
        validator: (poses) => poses.length > 0,
        message: 'A routine needs at least one pose',
      },
    },
    warmUp: { type: [String], default: [] },
    coolDown: { type: [String], default: [] },
    breathingReminders: { type: [String], default: [] },
    /** generated = from the recommendation engine, manual = hand built, system = seeded catalogue */
    source: { type: String, enum: ['generated', 'manual', 'system'], default: 'manual' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    isPublic: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
)

yogaRoutineSchema.index({ isPublic: 1, createdAt: -1 })
yogaRoutineSchema.index({ createdBy: 1, createdAt: -1 })

/**
 * True when the given user is allowed to read this routine:
 * public/system routines are readable by everyone.
 */
yogaRoutineSchema.methods.isVisibleTo = function isVisibleTo(userId) {
  if (this.isPublic || this.source === 'system') return true
  if (!userId) return false
  return String(this.createdBy) === String(userId)
}

yogaRoutineSchema.methods.isOwnedBy = function isOwnedBy(userId) {
  if (!userId || !this.createdBy) return false
  return String(this.createdBy) === String(userId)
}

const YogaRoutine = mongoose.model('YogaRoutine', yogaRoutineSchema)

export default YogaRoutine
