import { validationResult } from 'express-validator'
import ApiError from '../utils/ApiError.js'

/**
 * Turns express-validator results into a consistent 400 response.
 * Place at the end of every validation chain.
 */
export function validate(req, _res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }))

  return next(ApiError.badRequest(errors[0]?.message || 'Validation failed', errors))
}

export default validate
