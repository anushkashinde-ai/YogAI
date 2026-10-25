import mongoose from 'mongoose'
import { MODERATION_STATUS } from '../config/constants.js'

const communityPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [2, 'Post is too short'],
      maxlength: [1200, 'Post must be at most 1200 characters'],
    },
    /** achievement | routine | note | challenge */
    type: {
      type: String,
      enum: ['achievement', 'routine', 'note', 'challenge'],
      default: 'note',
      index: true,
    },
    /** Optional linked documents depending on `type`. */
    routineId: { type: mongoose.Schema.Types.ObjectId, ref: 'YogaRoutine', default: null },
    achievementKey: { type: String, trim: true, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true, maxlength: 300, default: '' },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    moderationStatus: {
      type: String,
      enum: MODERATION_STATUS,
      default: 'approved',
      index: true,
    },
    /** Users explicitly opt in to sharing; default is private. */
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

communityPostSchema.index({ createdAt: -1 })
communityPostSchema.index({ isPublic: 1, moderationStatus: 1, createdAt: -1 })

communityPostSchema.virtual('likeCount').get(function likeCount() {
  return this.likes?.length ?? 0
})

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema)

export default CommunityPost
