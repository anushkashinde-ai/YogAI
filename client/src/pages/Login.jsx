import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { isEmail } from '../utils/format.js'
import { Spinner } from '../components/Loader.jsx'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/progress'

  const validate = () => {
    const next = {}
    if (!isEmail(form.email)) next.email = 'Please enter a valid email address.'
    if (!form.password) next.password = 'Please enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await login({ email: form.email.trim(), password: form.password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, 'We could not sign you in. Please check your details.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to continue your practice, save routines and keep your streak alive.
      </p>

      {serverError && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label className="label" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className={`input pl-11 ${errors.email ? 'border-red-400' : ''}`}
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-sage-700 hover:underline dark:text-sage-300">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className={`input pl-11 pr-11 ${errors.password ? 'border-red-400' : ''}`}
              placeholder="Your password"
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

        <button type="submit" disabled={submitting} className="btn-primary w-full btn-lg">
          {submitting ? (
            <>
              <Spinner size="sm" /> Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to YogAI?{' '}
        <Link to="/signup" className="link">
          Create a free account
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-card px-4 py-3 text-xs leading-relaxed text-muted">
        <p className="font-semibold text-ink">Seeded demo accounts</p>
        <p className="mt-1">
          After running <code className="rounded bg-sage-50 px-1 dark:bg-sage-800">npm run seed</code> you can sign in with{' '}
          <span className="font-medium text-ink">demo@yogai.app / Demo@12345</span> or{' '}
          <span className="font-medium text-ink">admin@yogai.app / Admin@12345</span>.
        </p>
      </div>
    </div>
  )
}
