import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, TriangleAlert } from 'lucide-react'
import { authService } from '../services/authService.js'
import { getErrorMessage } from '../services/api.js'
import { passwordStrength } from '../utils/format.js'
import { Spinner } from '../components/Loader.jsx'
import { useToast } from '../context/ToastContext.jsx'

/** Looks like a stale or missing link rather than a normal validation failure. */
function looksLikeTokenProblem(message = '') {
  const text = message.toLowerCase()
  const mentionsToken = text.includes('token') || text.includes('link')
  const isBad = text.includes('invalid') || text.includes('expired') || text.includes('used') || text.includes('unknown')
  return mentionsToken && isBad
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [tokenProblem, setTokenProblem] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const toast = useToast()
  const navigate = useNavigate()
  const strength = passwordStrength(form.password)

  const validate = () => {
    const next = {}
    if (strength.score < 4) next.password = 'Use at least 8 characters with upper case, lower case and a number.'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'The passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    setTokenProblem(false)
    if (!validate()) return

    setSubmitting(true)
    try {
      await authService.resetPassword(token, form.password)
      toast.success('Your password has been updated. Please sign in.')
      navigate('/login', { replace: true })
    } catch (error) {
      const message = getErrorMessage(error, 'We could not reset your password. Please request a new link.')
      setTokenProblem(looksLikeTokenProblem(message))
      setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
          <TriangleAlert size={20} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink">This reset link is incomplete</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We could not find a reset token in the address you opened. It may have been cut short by your email client or
          copied only partially.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/forgot-password" className="btn-primary">
            Request a new link
          </Link>
          <Link to="/login" className="btn-outline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">
        Pick something you have not used before. You will be signed out everywhere once the change is saved.
      </p>

      {serverError && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          <p>{serverError}</p>
          {tokenProblem && (
            <p className="mt-2">
              <Link to="/forgot-password" className="link">
                Request a new reset link
              </Link>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label className="label" htmlFor="new-password">
            New password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className={`input pl-11 pr-11 ${errors.password ? 'border-red-400' : ''}`}
              placeholder="Minimum 8 characters"
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
        </div>

        <div>
          <label className="label" htmlFor="confirm-new-password">
            Confirm new password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="confirm-new-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              className={`input pl-11 pr-11 ${errors.confirmPassword ? 'border-red-400' : ''}`}
              placeholder="Repeat your new password"
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:text-ink"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        {form.password && (
          <div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    index < strength.score
                      ? strength.score >= 4
                        ? 'bg-sage-500'
                        : 'bg-amber-400'
                      : 'bg-sage-100 dark:bg-sage-800'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Password strength: <span className="font-semibold text-ink">{strength.label}</span>
            </p>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full btn-lg">
          {submitting ? (
            <>
              <Spinner size="sm" /> Updating password…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it after all?{' '}
        <Link to="/login" className="link">
          Back to sign in
        </Link>
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-3 text-xs leading-relaxed text-muted">
        <Mail size={15} className="shrink-0" aria-hidden="true" />
        <p>
          Reset links expire quickly and can only be used once. If yours has stopped working, request a fresh one from
          the forgot password page.
        </p>
      </div>
    </div>
  )
}
