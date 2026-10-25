import User from '../models/User.js'
import PracticeSession from '../models/PracticeSession.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

/**
 * GET /api/users/me
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'favoritePoses',
    'name slug difficulty category imageUrl duration'
  )

  const sessionCount = await PracticeSession.countDocuments({ userId: req.user._id })

  return sendSuccess(res, {
    message: 'Profile loaded.',
    data: { user: user.toPublicJSON(), sessionCount },
  })
})

/**
 * PATCH /api/users/me
 * Updates the editable profile fields (name, email, experience, goals).
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, experienceLevel, yogaGoals } = req.body
  const user = await User.findById(req.user._id)

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } })
    if (taken) throw ApiError.conflict('That email is already linked to another account.')
    user.email = email
  }

  if (name) user.name = name
  if (experienceLevel) user.experienceLevel = experienceLevel
  if (Array.isArray(yogaGoals)) user.yogaGoals = yogaGoals

  await user.save()

  return sendSuccess(res, { message: 'Profile updated.', data: { user: user.toPublicJSON() } })
})

/**
 * PATCH /api/users/me/preferences
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const { theme, practiceDuration, intensity, reminderEnabled, weeklyGoalSessions, soundEnabled } = req.body
  const user = await User.findById(req.user._id)

  const preferences = user.preferences || {}

  if (theme !== undefined) preferences.theme = theme
  if (practiceDuration !== undefined) preferences.practiceDuration = practiceDuration
  if (intensity !== undefined) preferences.intensity = intensity
  if (reminderEnabled !== undefined) preferences.reminderEnabled = reminderEnabled
  if (weeklyGoalSessions !== undefined) preferences.weeklyGoalSessions = weeklyGoalSessions
  if (soundEnabled !== undefined) preferences.soundEnabled = soundEnabled

  user.preferences = preferences
  await user.save()

  return sendSuccess(res, { message: 'Preferences saved.', data: { preferences: user.preferences } })
})

/**
 * POST /api/users/me/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await User.findById(req.user._id).select('+passwordHash')
  const matches = await user.comparePassword(currentPassword)
  if (!matches) throw ApiError.badRequest('Your current password is incorrect.')

  user.passwordHash = await User.hashPassword(newPassword)
  await user.save({ validateBeforeSave: false })

  return sendSuccess(res, { message: 'Password changed successfully.' })
})

export default { getProfile, updateProfile, updatePreferences, changePassword }
