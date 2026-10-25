import User from '../models/User.js'
import YogaPose from '../models/YogaPose.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

const POSE_FIELDS = 'name slug difficulty category imageUrl duration benefits description'

/**
 * GET /api/favorites
 */
export const listFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('favoritePoses', POSE_FIELDS)
    .lean()

  const favorites = (user?.favoritePoses || [])
    .filter(Boolean)
    .map((pose) => ({ ...pose, isFavorite: true }))

  return sendSuccess(res, { message: 'Favourites loaded.', data: favorites })
})

/**
 * POST /api/favorites/:poseId
 */
export const addFavorite = asyncHandler(async (req, res) => {
  const { poseId } = req.params

  const pose = await YogaPose.findById(poseId).select(POSE_FIELDS).lean()
  if (!pose) throw ApiError.notFound('That yoga pose could not be found.')

  const user = await User.findById(req.user._id)
  const alreadySaved = user.favoritePoses.some((id) => String(id) === String(poseId))

  if (!alreadySaved) {
    user.favoritePoses.push(pose._id)
    await user.save({ validateBeforeSave: false })
  }

  return sendSuccess(res, {
    message: alreadySaved ? 'Already in your favourites.' : `"${pose.name}" added to favourites.`,
    data: { poseId: pose._id, isFavorite: true, favoritesCount: user.favoritePoses.length },
  })
})

/**
 * DELETE /api/favorites/:poseId
 */
export const removeFavorite = asyncHandler(async (req, res) => {
  const { poseId } = req.params

  const user = await User.findById(req.user._id)
  user.favoritePoses = user.favoritePoses.filter((id) => String(id) !== String(poseId))
  await user.save({ validateBeforeSave: false })

  return sendSuccess(res, {
    message: 'Removed from favourites.',
    data: { poseId, isFavorite: false, favoritesCount: user.favoritePoses.length },
  })
})

export default { listFavorites, addFavorite, removeFavorite }
