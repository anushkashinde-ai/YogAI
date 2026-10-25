import mongoose from 'mongoose'

const completedPoseSchema = new mongoose.Schema(
  {
    pose: { type: mongoose.Schema.Types.ObjectId, ref: 'YogaPose' },
    name: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    seconds: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
)

const practiceSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    routineId: { type: mongoose.Schema.Types.ObjectId, ref: 'YogaRoutine', default: null },
    title: { type: String, trim: true, maxlength: 140, default: 'Practice session' },
    /** routine | pose | breathing | meditation | free-practice */
    type: {
      type: String,
      enum: ['routine', 'pose', 'breathing', 'meditation', 'free-practice'],
      default: 'routine',
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [0, 'Duration cannot be negative'],
      max: [600, 'A single session cannot exceed 600 minutes'],
    },
    completedPoses: { type: [completedPoseSchema], default: [] },
    /** Denormalised categories + flags so achievements can be calculated cheaply. */
    categories: { type: [String], default: [] },
    mood: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 600, default: '' },
    completedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
)

practiceSessionSchema.index({ userId: 1, completedAt: -1 })

const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema)

export default PracticeSession
