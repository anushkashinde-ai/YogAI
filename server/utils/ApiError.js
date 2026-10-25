/**
 * Operational (expected) error with an HTTP status code.
 * Everything else is treated as an unexpected server error.
 */
export default class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
    this.isOperational = true
    Error.captureStackTrace?.(this, this.constructor)
  }

  static badRequest(message = 'Invalid request', errors = []) {
    return new ApiError(400, message, errors)
  }

  static unauthorized(message = 'You need to sign in to continue.') {
    return new ApiError(401, message)
  }

  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError(403, message)
  }

  static notFound(message = 'The requested resource was not found.') {
    return new ApiError(404, message)
  }

  static conflict(message = 'That resource already exists.') {
    return new ApiError(409, message)
  }

  static tooMany(message = 'Too many requests. Please slow down.') {
    return new ApiError(429, message)
  }

  static internal(message = 'Something went wrong on our side.') {
    return new ApiError(500, message)
  }
}
