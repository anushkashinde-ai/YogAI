import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import config from '../config/env.js'

export function signToken(payload, options = {}) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    ...options,
  })
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret)
}

/**
 * Double-submit CSRF token: a readable cookie + a matching `X-CSRF-Token`
 * header. Only state-changing requests are verified (see middleware/csrf.js).
 */
export function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

const baseCookieOptions = () => ({
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  domain: config.cookie.domain,
  path: '/',
})

export function setAuthCookies(res, token, csrfToken) {
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days

  res.cookie(config.cookie.name, token, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge,
  })

  // Readable by JS on purpose — the client echoes it in the CSRF header.
  res.cookie(config.cookie.csrfName, csrfToken, {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge,
  })
}

export function clearAuthCookies(res) {
  res.clearCookie(config.cookie.name, { ...baseCookieOptions(), httpOnly: true })
  res.clearCookie(config.cookie.csrfName, { ...baseCookieOptions(), httpOnly: false })
}

export default { signToken, verifyToken, createCsrfToken, setAuthCookies, clearAuthCookies }
