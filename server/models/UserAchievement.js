import mongoose from 'mongoose'

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true,
    },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// A user can only earn a given achievement once.
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true })

const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema)

export default UserAchievement
