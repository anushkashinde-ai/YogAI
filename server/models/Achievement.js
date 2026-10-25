import mongoose from 'mongoose'

const achievementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    icon: { type: String, default: 'award' },
    color: { type: String, default: 'sage' },
    /**
     * Machine readable unlock rule, e.g.
     * { type: 'sessions', target: 10 }
     * { type: 'category', target: 5, category: 'balance' }
     */
    criteria: { type: mongoose.Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const Achievement = mongoose.model('Achievement', achievementSchema)

export default Achievement
