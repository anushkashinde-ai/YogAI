import CommunityPost from '../models/CommunityPost.js'
import User from '../models/User.js'
import UserAchievement from '../models/UserAchievement.js'
import PracticeSession from '../models/PracticeSession.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendCreated } from '../utils/apiResponse.js'
import { CHALLENGES, currentWeekKey, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants.js'
import { dayKey } from '../services/progressService.js'

const REPORT_THRESHOLD = 3

/** Sessions completed since Monday 00:00 UTC. */
async function sessionsThisWeek(userId) {
  const now = new Date()
  const weekday = (now.getUTCDay() + 6) % 7
  const monday = new Date(now)
  monday.setUTCDate(monday.getUTCDate() - weekday)
  monday.setUTCHours(0, 0, 0, 0)

  return PracticeSession.find({ userId, completedAt: { $gte: monday } })
    .select('type completedAt completedPoses')
    .lean()
}

function challengeProgress(challenge, sessions) {
  switch (challenge.focus) {
    case 'morningSessions':
      return sessions.filter((session) => new Date(session.completedAt).getUTCHours() < 9).length
    case 'breathingSessions':
      return sessions.filter((session) => session.type === 'breathing').length
    case 'activeDays':
      return new Set(sessions.map((session) => dayKey(session.completedAt))).size
    default: {
      if (challenge.focus.startsWith('category:')) {
        const category = challenge.focus.split(':')[1]
        return sessions.reduce(
          (sum, session) =>
            sum + (session.completedPoses || []).filter((pose) => pose.category === category).length,
          0
        )
      }
      return 0
    }
  }
}

/**
 * GET /api/community/posts
 * Only public, non-rejected posts are listed.
 */
export const listPosts = asyncHandler(async (req, res) => {
  const { type = '', page = 1, limit = DEFAULT_PAGE_SIZE, mine = 'false' } = req.query

  const filter = { moderationStatus: { $ne: 'rejected' } }

  if (mine === 'true') {
    if (!req.user) throw ApiError.unauthorized()
    filter.userId = req.user._id
  } else {
    filter.isPublic = true
    filter.moderationStatus = 'approved'
  }

  if (type) filter.type = type

  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const safePage = Math.max(Number(page) || 1, 1)

  const [items, total] = await Promise.all([
    CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate('userId', 'name experienceLevel')
      .populate('routineId', 'title goal difficulty durationMinutes')
      .lean(),
    CommunityPost.countDocuments(filter),
  ])

  const data = items.map((post) => ({
    id: post._id,
    content: post.content,
    type: post.type,
    achievementKey: post.achievementKey,
    routine: post.routineId || null,
    author: {
      id: post.userId?._id,
      // Only the display name is ever shared publicly.
      name: post.userId?.name || 'YogAI member',
      experienceLevel: post.userId?.experienceLevel,
    },
    likeCount: post.likes?.length || 0,
    likedByMe: req.user ? (post.likes || []).some((id) => String(id) === String(req.user._id)) : false,
    commentsEnabled: false,
    createdAt: post.createdAt,
    isMine: req.user ? String(post.userId?._id) === String(req.user._id) : false,
    isFlagged: post.moderationStatus === 'flagged',
  }))

  return sendSuccess(res, {
    message: 'Community posts loaded.',
    data,
    meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  })
})

/**
 * POST /api/community/posts
 * Sharing is always opt-in: posts default to private and are only listed when
 * the author explicitly sets isPublic.
 */
export const createPost = asyncHandler(async (req, res) => {
  const { content, type = 'note', achievementKey = '', routineId = null, isPublic = false } = req.body

  if (type === 'achievement' && achievementKey) {
    // Verify the user actually earned the achievement they are celebrating.
    const earned = await UserAchievement.find({ userId: req.user._id })
      .populate('achievementId', 'key')
      .lean()

    const owns = earned.some((item) => item.achievementId?.key === achievementKey)
    if (!owns) {
      throw ApiError.forbidden('You can only share achievements you have unlocked.')
    }
  }

  const post = await CommunityPost.create({
    userId: req.user._id,
    content,
    type,
    achievementKey,
    routineId: routineId || null,
    isPublic: Boolean(isPublic),
    moderationStatus: 'approved',
  })

  const populated = await CommunityPost.findById(post._id)
    .populate('userId', 'name experienceLevel')
    .lean()

  return sendCreated(res, {
    message: isPublic
      ? 'Shared with the YogAI community.'
      : 'Saved privately. Toggle "Share publicly" next time to post it to the community.',
    data: {
      id: populated._id,
      content: populated.content,
      type: populated.type,
      isPublic: populated.isPublic,
      createdAt: populated.createdAt,
      author: { id: populated.userId?._id, name: populated.userId?.name },
      likeCount: 0,
      likedByMe: false,
      isMine: true,
    },
  })
})

/**
 * DELETE /api/community/posts/:id — author or admin.
 */
export const deletePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id)
  if (!post) throw ApiError.notFound('That post no longer exists.')

  const isOwner = String(post.userId) === String(req.user._id)
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own posts.')
  }

  await post.deleteOne()
  return sendSuccess(res, { message: 'Post deleted.' })
})

/**
 * POST /api/community/posts/:id/like — toggles a like.
 */
export const toggleLike = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id)
  if (!post) throw ApiError.notFound('That post no longer exists.')

  const index = post.likes.findIndex((id) => String(id) === String(req.user._id))

  if (index >= 0) post.likes.splice(index, 1)
  else post.likes.push(req.user._id)

  await post.save()

  return sendSuccess(res, {
    message: index >= 0 ? 'Like removed.' : 'Encouragement sent!',
    data: { likeCount: post.likes.length, likedByMe: index < 0 },
  })
})

/**
 * POST /api/community/posts/:id/report — community moderation.
 * Three independent reports auto-flag a post for review.
 */
export const reportPost = asyncHandler(async (req, res) => {
  const { reason = '' } = req.body

  const post = await CommunityPost.findById(req.params.id)
  if (!post) throw ApiError.notFound('That post no longer exists.')

  if (String(post.userId) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot report your own post.')
  }

  const alreadyReported = post.reportedBy.some((entry) => String(entry.user) === String(req.user._id))
  if (alreadyReported) {
    return sendSuccess(res, { message: 'You have already reported this post.', data: { reported: true } })
  }

  post.reportedBy.push({ user: req.user._id, reason, at: new Date() })

  if (post.reportedBy.length >= REPORT_THRESHOLD) {
    post.moderationStatus = 'flagged'
  }

  await post.save()

  return sendSuccess(res, {
    message: 'Thank you — our moderation team will review this post.',
    data: { reported: true, reports: post.reportedBy.length },
  })
})

/**
 * GET /api/community/challenges
 * One challenge is featured each ISO week; progress uses the user's real data.
 */
export const listChallenges = asyncHandler(async (req, res) => {
  const weekKey = currentWeekKey()
  const featuredIndex = Number(weekKey.split('-W')[1] || 1) % CHALLENGES.length

  const [participantCounts, joined] = await Promise.all([
    User.aggregate([
      { $unwind: '$joinedChallenges' },
      { $group: { _id: '$joinedChallenges.key', count: { $sum: 1 } } },
    ]),
    req.user ? User.findById(req.user._id).select('joinedChallenges').lean() : null,
  ])

  const participantMap = new Map(participantCounts.map((row) => [row._id, row.count]))
  const joinedKeys = new Set((joined?.joinedChallenges || []).map((entry) => entry.key))
  const sessions = req.user ? await sessionsThisWeek(req.user._id) : []

  const data = CHALLENGES.map((challenge, index) => {
    const value = req.user ? challengeProgress(challenge, sessions) : 0
    return {
      ...challenge,
      featured: index === featuredIndex,
      participants: participantMap.get(challenge.key) || 0,
      joined: joinedKeys.has(challenge.key),
      weekKey,
      progress: {
        value: Math.min(value, challenge.target),
        target: challenge.target,
        percent: Math.min(100, Math.round((value / challenge.target) * 100)),
        completed: value >= challenge.target,
      },
    }
  })

  return sendSuccess(res, {
    message: 'Challenges loaded.',
    data,
    meta: { weekKey, requiresAuthForProgress: !req.user },
  })
})

/**
 * POST /api/community/challenges/:key/join — idempotent opt-in.
 */
export const joinChallenge = asyncHandler(async (req, res) => {
  const { key } = req.params
  const challenge = CHALLENGES.find((item) => item.key === key)
  if (!challenge) throw ApiError.notFound('That challenge does not exist.')

  const user = await User.findById(req.user._id)
  const alreadyJoined = user.joinedChallenges.some((entry) => entry.key === key)

  if (!alreadyJoined) {
    user.joinedChallenges.push({ key, joinedAt: new Date() })
    await user.save({ validateBeforeSave: false })
  }

  return sendSuccess(res, {
    message: alreadyJoined ? `You are already in ${challenge.title}.` : `Joined ${challenge.title}!`,
    data: { key, joined: true },
  })
})

/**
 * DELETE /api/community/challenges/:key/join
 */
export const leaveChallenge = asyncHandler(async (req, res) => {
  const { key } = req.params

  const user = await User.findById(req.user._id)
  user.joinedChallenges = user.joinedChallenges.filter((entry) => entry.key !== key)
  await user.save({ validateBeforeSave: false })

  return sendSuccess(res, { message: 'You left the challenge.', data: { key, joined: false } })
})

export default {
  listPosts,
  createPost,
  deletePost,
  toggleLike,
  reportPost,
  listChallenges,
  joinChallenge,
  leaveChallenge,
}
