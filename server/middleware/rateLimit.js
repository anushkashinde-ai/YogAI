import rateLimit from 'express-rate-limit'
import config from '../config/env.js'
import { sendError } from '../utils/apiResponse.js'

const handler = (req, res) =>
  sendError(res, {
    status: 429,
    message: 'Too many requests. Please wait a moment and try again.',
  })

/** Broad limiter applied to the whole API. */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})

/** Stricter limiter for credential endpoints (login, register, reset...). */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
})

/** Very strict limiter for the AI assistant (paid upstream calls). */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})

export default { apiLimiter, authLimiter, aiLimiter }
