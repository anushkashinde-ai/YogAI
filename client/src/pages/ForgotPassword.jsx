import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Copy, Mail, TriangleAlert } from 'lucide-react'
import { authService } from '../services/authService.js'
import { getErrorMessage } from '../services/api.js'
import { isEmail } from '../utils/format.js'
import { Spinner } from '../components/Loader.jsx'
import { useToast } from '../context/ToastContext.jsx'

/** The API returns an absolute reset URL in development — keep only the router path. */
function toRouterPath(resetUrl) {
  try {
    const url = new URL(resetUrl)
    return `${url.pathname}${url.search}`
  } catch {
    return ''
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const toast = useToast()

  const validate = () => {
    const next = {}
    if (!isEmail(email)) next.email = 'Please enter a valid email address.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const response = await authService.forgotPassword(email.trim())
      setResult(response)
    } catch (error) {
      setServerError(getErrorMessage(error, 'We could not send the reset instructions. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetUrl = result?.data?.resetUrl
  const resetPath = resetUrl ? toRouterPath(resetUrl) : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl)
      toast.success('Reset link copied to your clipboard.')
    } catch {
      toast.error('Your browser blocked the clipboard. Please copy the link manually.')
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        Enter the email address you signed up with and we will send instructions for choosing a new password.
      </p>

      {serverError && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          {serverError}
        </div>
      )}

      {result ? (
        <div className="mt-6 rounded-3xl border border-sage-200 bg-sage-50 px-5 py-5 dark:border-sage-700 dark:bg-sage-900/50">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100">
            <CheckCircle2 size={20} aria-hidden="true" />
          </span>

          <p className="mt-4 text-sm font-semibold text-ink">Request received</p>
          <p className="mt-1 text-sm leading-relaxed text-sage-800 dark:text-sage-100">
            {result.message ||
              'If an account exists for that address, we have sent instructions to reset your password.'}
          </p>

          {result.data?.demo && resetPath && (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-xs leading-relaxed text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                <TriangleAlert size={14} aria-hidden="true" />
                DEMO — email service not configured
              </p>
              <p className="mt-2">
                This build has no email provider, so the reset email could not actually be sent. The server still
                generated a real, working link for this account. Open it below to set a new password.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link to={resetPath} className="btn btn-sm bg-amber-500 text-white hover:bg-amber-600">
                  Open reset link
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-sm border border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/40"
                >
                  <Copy size={14} aria-hidden="true" />
                  Copy link
                </button>
              </div>

              <p className="mt-3 break-all font-mono text-[11px] text-amber-800 dark:text-amber-200">{resetPath}</p>
              {result.data.note && <p className="mt-2 text-[11px] italic">{result.data.note}</p>}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setResult(null)
              setErrors({})
            }}
            className="btn-ghost btn-sm mt-4 -ml-2"
          >
            Use a different email address
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label className="label" htmlFor="forgot-email">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`input pl-11 ${errors.email ? 'border-red-400' : ''}`}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full btn-lg">
            {submitting ? (
              <>
                <Spinner size="sm" /> Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="link">
          Back to sign in
        </Link>
      </p>

      <p className="mt-3 text-center text-sm text-muted">
        New to YogAI?{' '}
        <Link to="/signup" className="link">
          Create a free account
        </Link>
      </p>
    </div>
  )
}
