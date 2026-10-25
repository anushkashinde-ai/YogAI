/**
 * Uniform JSON envelope for every API response.
 *   success → { success: true, message, data, meta? }
 *   failure → { success: false, message, errors }
 */
export function sendSuccess(res, { status = 200, message = 'OK', data = null, meta } = {}) {
  const body = { success: true, message, data }
  if (meta !== undefined) body.meta = meta
  return res.status(status).json(body)
}

export function sendCreated(res, { message = 'Created', data = null } = {}) {
  return sendSuccess(res, { status: 201, message, data })
}

export function sendError(res, { status = 500, message = 'Something went wrong.', errors = [] } = {}) {
  return res.status(status).json({ success: false, message, errors })
}

export default { sendSuccess, sendCreated, sendError }
