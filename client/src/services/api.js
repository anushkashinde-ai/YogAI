import axios from 'axios'

/**
 * Centralised axios instance.
 *
 * - `withCredentials` sends the httpOnly auth cookie.
 * - The readable CSRF cookie is echoed in the `X-CSRF-Token` header, which the
 *   API requires on every state-changing request.
 * - In development the Vite proxy forwards `/api` to the Express server, so an
 *   empty baseURL keeps everything same-origin (cookies behave predictably).
 */
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || ''

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
})

function readCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

/** Event name the AuthContext listens to for forced sign-outs. */
export const UNAUTHORIZED_EVENT = 'yogai:unauthorized'

api.interceptors.request.use((config) => {
  const csrfToken = readCookie('yogai_csrf')
  if (csrfToken && !['get', 'head', 'options'].includes(String(config.method).toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // A 401 on a session-restore call is expected for guests — don't broadcast.
    const isSessionProbe = error.config?.url?.includes('/auth/me')
    if (status === 401 && !isSessionProbe) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }

    return Promise.reject(error)
  }
)

/**
 * Turn any axios failure into a single, user-friendly sentence.
 * Prefers server-provided validation messages.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') return 'The request took too long. Please check your connection and try again.'
    return 'Cannot reach the YogAI server. Please check that the API is running.'
  }

  const { data, status } = error.response

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((item) => item.message).filter(Boolean).join(' ')
  }

  if (data?.message) return data.message

  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'

  return fallback
}

/** Unwraps the `{ success, message, data, meta }` envelope. */
export function unwrap(response) {
  return {
    data: response.data?.data,
    message: response.data?.message,
    meta: response.data?.meta,
    success: response.data?.success !== false,
  }
}

export default api
