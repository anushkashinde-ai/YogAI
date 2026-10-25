import mongoose from 'mongoose'
import { POSE_CATEGORIES, POSE_DIFFICULTIES } from '../config/constants.js'

const yogaPoseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pose name is required'],
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sanskritName: { type: String, trim: true, maxlength: 80 },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1200,
    },
    difficulty: {
      type: String,
      enum: POSE_DIFFICULTIES,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: POSE_CATEGORIES,
      required: true,
      index: true,
    },
    benefits: { type: [String], default: [] },
    instructions: {
      type: [String],
      default: [],
      validate: {
        validator: (steps) => steps.length <= 20,
        message: 'A pose can have at most 20 instruction steps',
      },
    },
    breathingInstructions: { type: [String], default: [] },
    commonMistakes: { type: [String], default: [] },
    modifications: { type: [String], default: [] },
    precautions: { type: [String], default: [] },
    /** Recommended hold duration in seconds. */
    duration: {
      type: Number,
      default: 30,
      min: [5, 'Duration must be at least 5 seconds'],
      max: [900, 'Duration must be at most 900 seconds'],
    },
    imageUrl: { type: String, trim: true, default: '' },
    videoUrl: { type: String, trim: true, default: '' },
    relatedPoses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'YogaPose' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Full-text search across the fields users actually type into the search box.
yogaPoseSchema.index({ name: 'text', description: 'text', benefits: 'text' })
yogaPoseSchema.index({ difficulty: 1, category: 1 })

yogaPoseSchema.virtual('holdTimeLabel').get(function holdTimeLabel() {
  return this.duration >= 60 ? `${Math.round(this.duration / 60)} min` : `${this.duration} sec`
})

const YogaPose = mongoose.model('YogaPose', yogaPoseSchema)

export default YogaPose
