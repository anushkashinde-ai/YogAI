import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { verifyToken } from '../utils/token.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import config from '../config/env.js'

/**
 * Extract the JWT from the httpOnly cookie (preferred) or a Bearer header
 * (useful for API clients / testing).
 */
function extractToken(req) {
  if (req.cookies?.[config.cookie.name]) return req.cookies[config.cookie.name]
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7).trim()
  return null
}

/** Reject the request when no valid session exists. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req)
  if (!token) throw ApiError.unauthorized()

  let decoded
  try {
    decoded = verifyToken(token)
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.')
  }

  const user = await User.findById(decoded.sub)
  if (!user) throw ApiError.unauthorized('This account no longer exists.')

  req.user = user
  next()
})

/** Attach req.user when a session exists, but never block the request. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req)
  if (!token) return next()

  try {
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.sub)
    if (user) req.user = user
  } catch {
    // Ignore invalid tokens for optional routes.
  }

  return next()
})

/** Admin-only guard — must run after `protect`. */
export function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized())
  if (req.user.role !== 'admin') {
    return next(ApiError.forbidden('Administrator access is required for this action.'))
  }
  return next()
}

export default { protect, optionalAuth, requireAdmin }
