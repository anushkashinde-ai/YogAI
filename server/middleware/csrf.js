import crypto from 'node:crypto'
import config from '../config/env.js'
import ApiError from '../utils/ApiError.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function safeCompare(a = '', b = '') {
  const bufferA = Buffer.from(String(a))
  const bufferB = Buffer.from(String(b))
  if (bufferA.length !== bufferB.length || bufferA.length === 0) return false
  return crypto.timingSafeEqual(bufferA, bufferB)
}

/**
 * Double-submit cookie CSRF protection.
 *
 * The API authenticates with an httpOnly cookie, so state-changing requests
 * must also present the readable `yogai_csrf` cookie value in the
 * `X-CSRF-Token` header. A cross-site attacker can send the cookie but cannot
 * read it, so it cannot forge a matching header.
 */
export function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next()

  // Nothing to protect when the request is not cookie-authenticated.
  const authCookie = req.cookies?.[config.cookie.name]
  if (!authCookie) return next()

  const cookieToken = req.cookies?.[config.cookie.csrfName]
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !safeCompare(cookieToken, headerToken)) {
    return next(ApiError.forbidden('Invalid or missing CSRF token. Please refresh and try again.'))
  }

  return next()
}

export default csrfProtection
