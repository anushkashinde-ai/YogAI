import crypto from 'node:crypto'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendCreated } from '../utils/apiResponse.js'
import { signToken, createCsrfToken, setAuthCookies, clearAuthCookies } from '../utils/token.js'
import config from '../config/env.js'

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

/** Reset tokens are stored hashed so a database leak cannot be replayed. */
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

function issueSession(res, user) {
  const token = signToken({ sub: String(user._id), role: user.role })
  const csrfToken = createCsrfToken()
  setAuthCookies(res, token, csrfToken)
  return { csrfToken }
}

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, experienceLevel, yogaGoals } = req.body

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw ApiError.conflict('An account with that email already exists.')

  const user = await User.create({
    name,
    email,
    passwordHash: await User.hashPassword(password),
    experienceLevel: experienceLevel || 'beginner',
    yogaGoals: Array.isArray(yogaGoals) ? yogaGoals : [],
  })

  const { csrfToken } = issueSession(res, user)

  return sendCreated(res, {
    message: `Welcome to YogAI, ${user.name.split(' ')[0]}!`,
    data: { user: user.toPublicJSON(), csrfToken },
  })
})

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
  // Same message for "no such user" and "wrong password" — avoids user enumeration.
  if (!user) throw ApiError.unauthorized('Incorrect email or password.')

  const matches = await user.comparePassword(password)
  if (!matches) throw ApiError.unauthorized('Incorrect email or password.')

  user.lastLoginAt = new Date()
  await user.save({ validateBeforeSave: false })

  const { csrfToken } = issueSession(res, user)

  return sendSuccess(res, {
    message: `Welcome back, ${user.name.split(' ')[0]}!`,
    data: { user: user.toPublicJSON(), csrfToken },
  })
})

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res)
  return sendSuccess(res, { message: 'You have been signed out.' })
})

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'favoritePoses',
    'name slug difficulty category imageUrl duration'
  )

  return sendSuccess(res, {
    message: 'Session restored.',
    data: {
      user: user.toPublicJSON(),
      csrfToken: req.cookies?.[config.cookie.csrfName] || createCsrfToken(),
    },
  })
})

/**
 * POST /api/auth/forgot-password
 *
 * No email provider is configured in this project, so in development the reset
 * link is returned in the response and clearly labelled as a demo. In
 * production the token is only ever sent by email.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email: email.toLowerCase() })

  const genericMessage =
    'If an account exists for that email, we have sent password reset instructions.'

  if (!user) {
    // Do not reveal whether the account exists.
    return sendSuccess(res, { message: genericMessage, data: { demo: false } })
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  user.resetPasswordToken = hashResetToken(rawToken)
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save({ validateBeforeSave: false })

  const resetUrl = `${config.cors.origins[0] || 'http://localhost:5173'}/reset-password?token=${rawToken}`

  const payload = { demo: false }
  if (!config.isProd) {
    // Dev only — labelled clearly so it is never mistaken for real email delivery.
    payload.demo = true
    payload.resetUrl = resetUrl
    payload.note = 'DEMO: no email service is configured, so the reset link is returned here.'
  }

  return sendSuccess(res, {
    message: genericMessage,
    data: payload,
  })
})

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  const user = await User.findOne({
    resetPasswordToken: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires')

  if (!user) throw ApiError.badRequest('That reset link is invalid or has expired.')

  user.passwordHash = await User.hashPassword(password)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save({ validateBeforeSave: false })

  clearAuthCookies(res)

  return sendSuccess(res, { message: 'Your password has been updated. Please sign in.' })
})

export default {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
}
