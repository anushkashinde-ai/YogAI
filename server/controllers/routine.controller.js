import YogaRoutine from '../models/YogaRoutine.js'
import YogaPose from '../models/YogaPose.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendCreated } from '../utils/apiResponse.js'
import { generateRoutine } from '../services/recommendationService.js'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, POSE_DIFFICULTIES } from '../config/constants.js'

const POSE_FIELDS = 'name slug difficulty category imageUrl duration benefits breathingInstructions instructions'

function withPopulatedPoses(query) {
  return query.populate('poses.pose', POSE_FIELDS).populate('createdBy', 'name')
}

/**
 * GET /api/routines
 * Public routines for everyone; the signed-in user's private routines as well.
 */
export const listRoutines = asyncHandler(async (req, res) => {
  const { goal = '', difficulty = '', scope = 'all', page = 1, limit = DEFAULT_PAGE_SIZE } = req.query

  const filter = {}

  if (scope === 'mine') {
    if (!req.user) throw ApiError.unauthorized()
    filter.createdBy = req.user._id
  } else if (scope === 'public') {
    filter.$or = [{ isPublic: true }, { source: 'system' }]
  } else {
    // all = public/system + own private routines
    const visibility = [{ isPublic: true }, { source: 'system' }]
    if (req.user) visibility.push({ createdBy: req.user._id })
    filter.$or = visibility
  }

  if (goal) filter.goal = goal
  if (difficulty && POSE_DIFFICULTIES.includes(difficulty)) filter.difficulty = difficulty

  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const safePage = Math.max(Number(page) || 1, 1)

  const [items, total] = await Promise.all([
    withPopulatedPoses(
      YogaRoutine.find(filter)
        .sort({ source: -1, createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
    ).lean(),
    YogaRoutine.countDocuments(filter),
  ])

  return sendSuccess(res, {
    message: 'Routines loaded.',
    data: items,
    meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  })
})

/**
 * GET /api/routines/:id
 */
export const getRoutine = asyncHandler(async (req, res) => {
  const routine = await withPopulatedPoses(YogaRoutine.findById(req.params.id)).lean()
  if (!routine) throw ApiError.notFound('That routine could not be found.')

  const isOwner = req.user && String(routine.createdBy?._id || routine.createdBy) === String(req.user._id)
  const isPublic = routine.isPublic || routine.source === 'system'

  if (!isPublic && !isOwner) {
    throw ApiError.forbidden('This routine is private.')
  }

  return sendSuccess(res, { message: 'Routine loaded.', data: { ...routine, isOwner } })
})

/**
 * POST /api/routines/generate
 * Works for guests (returns a plan) and for signed-in users (optionally saved).
 */
export const generateRoutineForUser = asyncHandler(async (req, res) => {
  const { save = false, ...input } = req.body

  const generated = await generateRoutine(input)

  // Resolve pose documents so the response is immediately renderable.
  const poseIds = generated.poses.map((entry) => entry.pose)
  const poseDocs = await YogaPose.find({ _id: { $in: poseIds } }).select(POSE_FIELDS).lean()
  const poseMap = new Map(poseDocs.map((pose) => [String(pose._id), pose]))

  const hydrated = {
    ...generated,
    poses: generated.poses.map((entry) => ({
      ...entry,
      pose: poseMap.get(String(entry.pose)) || entry.pose,
    })),
  }

  if (!save) {
    return sendSuccess(res, { message: 'Routine generated.', data: hydrated })
  }

  if (!req.user) {
    throw ApiError.unauthorized('Sign in to save a generated routine.')
  }

  const routine = await YogaRoutine.create({
    title: generated.title,
    description: generated.description,
    goal: generated.goal,
    difficulty: generated.difficulty,
    intensity: generated.intensity,
    durationMinutes: generated.durationMinutes,
    poses: generated.poses,
    warmUp: generated.warmUp,
    coolDown: generated.coolDown,
    breathingReminders: generated.breathingReminders,
    tags: generated.tags,
    source: 'generated',
    createdBy: req.user._id,
    isPublic: false,
  })

  const populated = await withPopulatedPoses(YogaRoutine.findById(routine._id)).lean()

  return sendCreated(res, { message: 'Routine generated and saved to your plans.', data: populated })
})

/**
 * POST /api/routines — create a routine by hand.
 */
export const createRoutine = asyncHandler(async (req, res) => {
  const routine = await YogaRoutine.create({
    ...req.body,
    source: 'manual',
    createdBy: req.user._id,
  })

  const populated = await withPopulatedPoses(YogaRoutine.findById(routine._id)).lean()
  return sendCreated(res, { message: 'Routine created.', data: populated })
})

/**
 * PUT /api/routines/:id — owner only.
 */
export const updateRoutine = asyncHandler(async (req, res) => {
  const routine = await YogaRoutine.findById(req.params.id)
  if (!routine) throw ApiError.notFound('That routine could not be found.')
  if (!routine.isOwnedBy(req.user._id)) {
    throw ApiError.forbidden('You can only edit routines you created.')
  }

  // Ownership and provenance are not client-editable.
  const { createdBy, source, ...updates } = req.body
  Object.assign(routine, updates)
  await routine.save()

  const populated = await withPopulatedPoses(YogaRoutine.findById(routine._id)).lean()
  return sendSuccess(res, { message: 'Routine updated.', data: populated })
})

/**
 * DELETE /api/routines/:id — owner only.
 */
export const deleteRoutine = asyncHandler(async (req, res) => {
  const routine = await YogaRoutine.findById(req.params.id)
  if (!routine) throw ApiError.notFound('That routine could not be found.')
  if (!routine.isOwnedBy(req.user._id)) {
    throw ApiError.forbidden('You can only delete routines you created.')
  }

  await routine.deleteOne()
  return sendSuccess(res, { message: 'Routine deleted.' })
})

/**
 * POST /api/routines/:id/publish — toggle public sharing.
 */
export const toggleRoutineVisibility = asyncHandler(async (req, res) => {
  const routine = await YogaRoutine.findById(req.params.id)
  if (!routine) throw ApiError.notFound('That routine could not be found.')
  if (!routine.isOwnedBy(req.user._id)) {
    throw ApiError.forbidden('You can only share routines you created.')
  }

  routine.isPublic = typeof req.body.isPublic === 'boolean' ? req.body.isPublic : !routine.isPublic
  await routine.save()

  return sendSuccess(res, {
    message: routine.isPublic ? 'Routine is now shared with the community.' : 'Routine is private again.',
    data: { isPublic: routine.isPublic },
  })
})

export default {
  listRoutines,
  getRoutine,
  generateRoutineForUser,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  toggleRoutineVisibility,
}
