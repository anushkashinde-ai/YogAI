import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { EXPERIENCE_LEVELS, YOGA_GOALS } from '../config/appConfig.js'
import { isEmail, passwordStrength } from '../utils/format.js'
import { Spinner } from '../components/Loader.jsx'

const INITIAL = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  experienceLevel: 'beginner',
  yogaGoals: [],
  acceptTerms: false,
}

export default function Signup() {
  const [form, setForm] = useState(INITIAL)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()
  const strength = passwordStrength(form.password)

  const toggleGoal = (goal) => {
    setForm((current) => ({
      ...current,
      yogaGoals: current.yogaGoals.includes(goal)
        ? current.yogaGoals.filter((item) => item !== goal)
        : [...current.yogaGoals, goal].slice(0, 6),
    }))
  }

  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Please enter your name.'
    if (!isEmail(form.email)) next.email = 'Please enter a valid email address.'
    if (strength.score < 4) next.password = 'Use at least 8 characters with upper case, lower case and a number.'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'The passwords do not match.'
    if (!form.acceptTerms) next.acceptTerms = 'Please accept the privacy note to continue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        experienceLevel: form.experienceLevel,
        yogaGoals: form.yogaGoals,
      })
      navigate('/plans', { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, 'We could not create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        Two minutes to set up. Your goals help us shape your very first routine.
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
          <label className="label" htmlFor="name">
            Full name
          </label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={`input pl-11 ${errors.name ? 'border-red-400' : ''}`}
              placeholder="Aarohi Sharma"
              autoComplete="name"
            />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="signup-email">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="signup-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className={`input pl-11 ${errors.email ? 'border-red-400' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="signup-password">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className={`input pl-11 pr-11 ${errors.password ? 'border-red-400' : ''}`}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
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
          </div>

          <div>
            <label className="label" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              className={`input ${errors.confirmPassword ? 'border-red-400' : ''}`}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </div>
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

        {errors.password && <p className="-mt-3 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
        {errors.confirmPassword && <p className="-mt-3 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}

        <fieldset>
          <legend className="label">Your experience level</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, experienceLevel: level.value }))}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  form.experienceLevel === level.value
                    ? 'border-sage-500 bg-sage-50 dark:bg-sage-800/60'
                    : 'border-line bg-card hover:border-sage-300'
                }`}
                aria-pressed={form.experienceLevel === level.value}
              >
                <span className="block text-sm font-semibold text-ink">{level.label}</span>
                <span className="mt-1 block text-[11px] leading-snug text-muted">{level.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">What would you like to focus on? (up to 6)</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {YOGA_GOALS.map((goal) => {
              const selected = form.yogaGoals.includes(goal.value)
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => toggleGoal(goal.value)}
                  className={`chip transition ${selected ? 'chip-active' : 'hover:border-sage-300'}`}
                  aria-pressed={selected}
                >
                  {selected && <Check size={12} aria-hidden="true" />}
                  {goal.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div>
          <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(event) => setForm((current) => ({ ...current, acceptTerms: event.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-line text-sage-600 focus:ring-sage-400"
            />
            <span>
              I understand that YogAI provides general wellness guidance only, that camera processing happens on my
              device, and that I should stop if anything feels painful. See{' '}
              <Link to="/privacy" className="link">
                privacy
              </Link>{' '}
              and{' '}
              <Link to="/safety" className="link">
                safety
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.acceptTerms}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full btn-lg">
          {submitting ? (
            <>
              <Spinner size="sm" /> Creating your account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="link">
          Sign in
        </Link>
      </p>
    </div>
  )
}
