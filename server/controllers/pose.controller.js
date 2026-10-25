import YogaPose from '../models/YogaPose.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import slugify from '../utils/slugify.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendCreated } from '../utils/apiResponse.js'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, POSE_CATEGORIES, POSE_DIFFICULTIES } from '../config/constants.js'

const SORT_OPTIONS = {
  name: { name: 1 },
  newest: { createdAt: -1 },
  duration: { duration: 1 },
  'duration-desc': { duration: -1 },
  difficulty: { difficulty: 1 },
}

/**
 * GET /api/poses
 * Public. Supports search, category/difficulty filters, sorting and paging.
 */
export const listPoses = asyncHandler(async (req, res) => {
  const {
    search = '',
    category = '',
    difficulty = '',
    sort = 'name',
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    ids = '',
  } = req.query

  const filter = {}

  if (search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: regex }, { description: regex }, { benefits: regex }, { sanskritName: regex }]
  }

  if (category && POSE_CATEGORIES.includes(category)) filter.category = category
  if (difficulty && POSE_DIFFICULTIES.includes(difficulty)) filter.difficulty = difficulty

  if (ids) {
    const idList = String(ids)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    if (idList.length > 0) filter._id = { $in: idList }
  }

  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const safePage = Math.max(Number(page) || 1, 1)
  const sortSpec = SORT_OPTIONS[sort] || SORT_OPTIONS.name

  const [items, total] = await Promise.all([
    YogaPose.find(filter)
      .sort(sortSpec)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    YogaPose.countDocuments(filter),
  ])

  // Attach the current user's favourite flag when signed in.
  let favoriteIds = new Set()
  if (req.user) {
    const user = await User.findById(req.user._id).select('favoritePoses').lean()
    favoriteIds = new Set((user?.favoritePoses || []).map((id) => String(id)))
  }

  const data = items.map((pose) => ({
    ...pose,
    isFavorite: favoriteIds.has(String(pose._id)),
  }))

  return sendSuccess(res, {
    message: 'Poses loaded.',
    data,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      filters: {
        categories: POSE_CATEGORIES,
        difficulties: POSE_DIFFICULTIES,
        sortOptions: Object.keys(SORT_OPTIONS),
      },
    },
  })
})

/**
 * GET /api/poses/:id — accepts a MongoDB id or a slug.
 */
export const getPose = asyncHandler(async (req, res) => {
  const { id } = req.params

  const query = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id }
  const pose = await YogaPose.findOne(query)
    .populate('relatedPoses', 'name slug difficulty category imageUrl duration')
    .lean()

  if (!pose) throw ApiError.notFound('That yoga pose could not be found.')

  let isFavorite = false
  if (req.user) {
    const user = await User.findById(req.user._id).select('favoritePoses').lean()
    isFavorite = (user?.favoritePoses || []).some((poseId) => String(poseId) === String(pose._id))
  }

  return sendSuccess(res, { message: 'Pose loaded.', data: { ...pose, isFavorite } })
})

/** Shared payload normaliser for create/update. */
async function normalisePosePayload(body, { excludeId } = {}) {
  const payload = { ...body }

  if (payload.name) {
    let slug = slugify(payload.name)
    const clash = await YogaPose.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean()
    if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    payload.slug = slug
  }

  return payload
}

/**
 * POST /api/poses — admin only.
 */
export const createPose = asyncHandler(async (req, res) => {
  const payload = await normalisePosePayload(req.body)

  if (!payload.slug) payload.slug = `pose-${Date.now().toString(36)}`

  const pose = await YogaPose.create({
    ...payload,
    createdBy: req.user._id,
    isSystem: false,
  })

  return sendCreated(res, { message: `"${pose.name}" was added to the library.`, data: pose })
})

/**
 * PUT /api/poses/:id — admin only.
 */
export const updatePose = asyncHandler(async (req, res) => {
  const pose = await YogaPose.findById(req.params.id)
  if (!pose) throw ApiError.notFound('That yoga pose could not be found.')

  const payload = await normalisePosePayload(req.body, { excludeId: pose._id })

  Object.assign(pose, payload)
  await pose.save()

  return sendSuccess(res, { message: 'Pose updated.', data: pose })
})

/**
 * DELETE /api/poses/:id — admin only.
 */
export const deletePose = asyncHandler(async (req, res) => {
  const pose = await YogaPose.findById(req.params.id)
  if (!pose) throw ApiError.notFound('That yoga pose could not be found.')

  await pose.deleteOne()
  // Keep user favourite lists consistent.
  await User.updateMany({ favoritePoses: pose._id }, { $pull: { favoritePoses: pose._id } })

  return sendSuccess(res, { message: `"${pose.name}" was removed from the library.` })
})

/**
 * POST /api/poses/:id/image — admin only, multipart upload.
 */
export const uploadPoseImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please choose an image file to upload.')

  const pose = await YogaPose.findById(req.params.id)
  if (!pose) throw ApiError.notFound('That yoga pose could not be found.')

  pose.imageUrl = `/uploads/${req.file.filename}`
  await pose.save()

  return sendSuccess(res, { message: 'Pose image uploaded.', data: { imageUrl: pose.imageUrl } })
})

export default { listPoses, getPose, createPose, updatePose, deletePose, uploadPoseImage }
