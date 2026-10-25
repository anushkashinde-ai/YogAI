import PracticeSession from '../models/PracticeSession.js'
import YogaPose from '../models/YogaPose.js'
import YogaRoutine from '../models/YogaRoutine.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendCreated } from '../utils/apiResponse.js'
import {
  getProgressSummary,
  buildActivitySeries,
  getPracticeHistory,
  computeMetrics,
} from '../services/progressService.js'
import { evaluateAchievements } from '../services/achievementService.js'

/**
 * GET /api/progress
 * Full dashboard payload for the signed-in user.
 */
export const getProgress = asyncHandler(async (req, res) => {
  const summary = await getProgressSummary(req.user._id)
  return sendSuccess(res, { message: 'Progress loaded.', data: summary })
})

/**
 * GET /api/progress/weekly?days=7
 */
export const getWeeklyProgress = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 7), 30)
  const metrics = await computeMetrics(req.user._id)

  const series = buildActivitySeries(metrics.sessions, days)
  const totalMinutes = series.reduce((sum, day) => sum + day.minutes, 0)
  const totalSessions = series.reduce((sum, day) => sum + day.sessions, 0)

  return sendSuccess(res, {
    message: 'Weekly activity loaded.',
    data: {
      series,
      totals: { minutes: totalMinutes, sessions: totalSessions },
      streak: { current: metrics.currentStreak, longest: metrics.longestStreak },
    },
  })
})

/**
 * POST /api/progress/sessions
 * Records a completed practice session, then re-evaluates achievements.
 */
export const createSession = asyncHandler(async (req, res) => {
  const {
    routineId = null,
    title,
    type = 'routine',
    durationMinutes,
    completedPoses = [],
    mood = '',
    notes = '',
    completedAt,
  } = req.body

  const minutes = Number(durationMinutes)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw ApiError.badRequest('A session needs a duration greater than zero.')
  }
  if (minutes > 600) throw ApiError.badRequest('A single session cannot exceed 600 minutes.')

  let routine = null
  if (routineId) {
    routine = await YogaRoutine.findById(routineId).lean()
    if (!routine) throw ApiError.badRequest('The referenced routine no longer exists.')

    const isOwner = String(routine.createdBy) === String(req.user._id)
    if (!routine.isPublic && routine.source !== 'system' && !isOwner) {
      throw ApiError.forbidden('You cannot log a session for a private routine you do not own.')
    }
  }

  // Normalise the completed poses and denormalise their categories so the
  // achievement engine does not need extra queries.
  const poseIds = completedPoses.map((entry) => entry.pose).filter(Boolean)
  const poseDocs = poseIds.length
    ? await YogaPose.find({ _id: { $in: poseIds } }).select('name category').lean()
    : []
  const poseMap = new Map(poseDocs.map((pose) => [String(pose._id), pose]))

  const normalisedPoses = completedPoses.map((entry) => {
    const doc = entry.pose ? poseMap.get(String(entry.pose)) : null
    return {
      pose: entry.pose || undefined,
      name: entry.name || doc?.name || 'Pose',
      category: entry.category || doc?.category || '',
      seconds: Math.max(0, Number(entry.seconds) || 0),
    }
  })

  const categories = [...new Set(normalisedPoses.map((pose) => pose.category).filter(Boolean))]

  const session = await PracticeSession.create({
    userId: req.user._id,
    routineId: routine?._id || null,
    title: title || routine?.title || 'Practice session',
    type,
    durationMinutes: Math.round(minutes),
    completedPoses: normalisedPoses,
    categories,
    mood,
    notes,
    completedAt: completedAt ? new Date(completedAt) : new Date(),
  })

  const { newlyEarned } = await evaluateAchievements(req.user._id)

  return sendCreated(res, {
    message: newlyEarned.length
      ? `Session saved — you unlocked ${newlyEarned.length} new badge${newlyEarned.length > 1 ? 's' : ''}!`
      : 'Session saved. Well done!',
    data: { session, newlyEarned },
  })
})

/**
 * GET /api/progress/history?page=1&limit=12
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { items, meta } = await getPracticeHistory(req.user._id, {
    page: req.query.page,
    limit: req.query.limit,
  })

  return sendSuccess(res, { message: 'Practice history loaded.', data: items, meta })
})

export default { getProgress, getWeeklyProgress, createSession, getHistory }
