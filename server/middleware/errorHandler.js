import ApiError from '../utils/ApiError.js'
import { sendError } from '../utils/apiResponse.js'
import config from '../config/env.js'

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

/**
 * Central error handler — always responds with the same JSON envelope.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let error = err

  // Mongoose: bad ObjectId
  if (error.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`)
  }

  // Mongoose: schema validation
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }))
    error = ApiError.badRequest(errors[0]?.message || 'Validation failed', errors)
  }

  // Mongo: duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || { field: '' })[0]
    error = ApiError.conflict(`That ${field || 'value'} is already in use.`)
  }

  // Multer upload errors
  if (error.name === 'MulterError') {
    error = ApiError.badRequest(`Upload failed: ${error.message}`)
  }

  // JWT errors that escaped the auth middleware
  if (error.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid session token.')
  if (error.name === 'TokenExpiredError') error = ApiError.unauthorized('Your session has expired.')

  const statusCode = error.statusCode || 500
  const message =
    statusCode === 500 && !error.isOperational
      ? 'Something went wrong on our side. Please try again.'
      : error.message

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[YogAI] Unhandled error:', error)
  }

  const payload = {
    status: statusCode,
    message,
    errors: error.errors?.length ? error.errors : [],
  }

  if (!config.isProd && statusCode === 500) payload.errors = [{ field: 'stack', message: err.message }]

  return sendError(res, payload)
}

export default errorHandler
