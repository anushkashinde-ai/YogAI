import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  Settings,
  Shield,
  ShieldCheck,
  User,
  Volume2,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { userService } from '../services/authService.js'
import { favoriteService, progressService } from '../services/yogaService.js'
import { getErrorMessage } from '../services/api.js'
import PoseCard from '../components/PoseCard.jsx'
import Loader, { Spinner } from '../components/Loader.jsx'
import EmptyState, { ErrorState } from '../components/EmptyState.jsx'
import { EXPERIENCE_LEVELS, INTENSITIES, YOGA_GOALS } from '../config/appConfig.js'
import {
  formatDate,
  formatDateTime,
  formatDuration,
  initials,
  passwordStrength,
  pluralise,
  titleCase,
} from '../utils/format.js'

const TABS = [
  { key: 'details', label: 'Profile details', icon: User },
  { key: 'preferences', label: 'Preferences', icon: Settings },
  { key: 'favourites', label: 'Favourites', icon: Heart },
  { key: 'history', label: 'Practice history', icon: Clock },
  { key: 'security', label: 'Security', icon: Shield },
]

const PRACTICE_DURATIONS = [10, 15, 20, 30, 45]

/** Small labelled switch used for the preference toggles. */
function ToggleRow({ icon: Icon, label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card px-4 py-3">
      <div className="flex items-start gap-3">
        <Icon size={17} className="mt-0.5 shrink-0 text-sage-600 dark:text-sage-300" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-sage-600' : 'bg-sage-200 dark:bg-sage-700'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[1.375rem]' : 'left-0.5'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}

export default function Profile() {
  const { user, updateProfile, updatePreferences } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('details')

  // Header stats — the session count only comes from GET /api/users/me.
  const [sessionCount, setSessionCount] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Profile details form.
  const [details, setDetails] = useState({ name: '', experienceLevel: 'beginner', yogaGoals: [] })
  const [detailErrors, setDetailErrors] = useState({})
  const [savingDetails, setSavingDetails] = useState(false)

  // Practice preferences form.
  const [prefs, setPrefs] = useState({
    practiceDuration: 30,
    intensity: 'moderate',
    reminderEnabled: false,
    soundEnabled: true,
    weeklyGoalSessions: 4,
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Favourites.
  const [favourites, setFavourites] = useState([])
  const [favouritesLoading, setFavouritesLoading] = useState(true)
  const [favouritesError, setFavouritesError] = useState('')
  const [favouriteBusyId, setFavouriteBusyId] = useState(null)

  // Practice history.
  const [history, setHistory] = useState([])
  const [historyMeta, setHistoryMeta] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [historyPage, setHistoryPage] = useState(1)

  // Change password.
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordServerError, setPasswordServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const strength = passwordStrength(passwordForm.newPassword)

  // Seed the editable forms when a different account loads.
  useEffect(() => {
    if (!user) return
    setDetails({
      name: user.name || '',
      experienceLevel: user.experienceLevel || 'beginner',
      yogaGoals: Array.isArray(user.yogaGoals) ? user.yogaGoals : [],
    })
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const preferences = user.preferences || {}
    setPrefs({
      practiceDuration: preferences.practiceDuration ?? 30,
      intensity: preferences.intensity || 'moderate',
      reminderEnabled: Boolean(preferences.reminderEnabled),
      soundEnabled: preferences.soundEnabled !== false,
      weeklyGoalSessions: preferences.weeklyGoalSessions ?? 4,
    })
  }, [user?.id])

  useEffect(() => {
    let active = true
    setProfileLoading(true)

    userService
      .getProfile()
      .then(({ data }) => {
        if (active) setSessionCount(data?.sessionCount ?? 0)
      })
      .catch(() => {
        if (active) setSessionCount(null)
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const loadFavourites = useCallback(async () => {
    setFavouritesLoading(true)
    setFavouritesError('')
    try {
      const { data } = await favoriteService.list()
      setFavourites(data || [])
    } catch (error) {
      setFavouritesError(getErrorMessage(error, 'Your favourites could not be loaded.'))
    } finally {
      setFavouritesLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async (page) => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const { data, meta } = await progressService.history({ page, limit: 8 })
      setHistory(data || [])
      setHistoryMeta(meta || null)
    } catch (error) {
      setHistoryError(getErrorMessage(error, 'Your practice history could not be loaded.'))
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFavourites()
  }, [loadFavourites])

  useEffect(() => {
    loadHistory(historyPage)
  }, [loadHistory, historyPage])

  const toggleGoal = (goal) => {
    const selected = details.yogaGoals.includes(goal)
    if (!selected && details.yogaGoals.length >= 6) {
      toast.warning('You can choose up to 6 focus areas.')
      return
    }
    setDetails((current) => ({
      ...current,
      yogaGoals: selected
        ? current.yogaGoals.filter((item) => item !== goal)
        : [...current.yogaGoals, goal],
    }))
  }

  const handleSaveDetails = async (event) => {
    event.preventDefault()

    const next = {}
    const name = details.name.trim()
    if (name.length < 2) next.name = 'Please enter at least 2 characters.'
    else if (name.length > 60) next.name = 'Please keep your name to 60 characters or fewer.'
    setDetailErrors(next)
    if (Object.keys(next).length > 0) return

    setSavingDetails(true)
    try {
      await updateProfile({
        name,
        experienceLevel: details.experienceLevel,
        yogaGoals: details.yogaGoals,
      })
    } catch {
      // updateProfile already surfaces the server message as a toast.
    } finally {
      setSavingDetails(false)
    }
  }

  const adjustWeeklyGoal = (delta) => {
    setPrefs((current) => ({
      ...current,
      weeklyGoalSessions: Math.min(7, Math.max(1, current.weeklyGoalSessions + delta)),
    }))
  }

  const handleSavePreferences = async () => {
    setSavingPrefs(true)
    try {
      await updatePreferences({
        practiceDuration: prefs.practiceDuration,
        intensity: prefs.intensity,
        reminderEnabled: prefs.reminderEnabled,
        soundEnabled: prefs.soundEnabled,
        weeklyGoalSessions: prefs.weeklyGoalSessions,
      })
    } catch {
      // updatePreferences already surfaces the server message as a toast.
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleRemoveFavourite = async (pose) => {
    const previous = favourites
    setFavouriteBusyId(pose._id)
    setFavourites((list) => list.filter((item) => item._id !== pose._id))

    try {
      const { message } = await favoriteService.remove(pose._id)
      toast.success(message || `Removed ${pose.name} from your favourites.`)
    } catch (error) {
      setFavourites(previous)
      toast.error(getErrorMessage(error, 'We could not update your favourites.'))
    } finally {
      setFavouriteBusyId(null)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setPasswordServerError('')

    const next = {}
    if (!passwordForm.currentPassword) next.currentPassword = 'Enter your current password.'
    if (strength.score < 4) next.newPassword = 'Use at least 8 characters with upper case, lower case and a number.'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      next.confirmPassword = 'The passwords do not match.'
    }
    setPasswordErrors(next)
    if (Object.keys(next).length > 0) return

    setChangingPassword(true)
    try {
      const { message } = await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success(message || 'Password changed successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({})
    } catch (error) {
      setPasswordServerError(getErrorMessage(error, 'We could not change your password.'))
    } finally {
      setChangingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className="container-x">
        <Loader label="Loading your profile…" />
      </div>
    )
  }

  const experienceLabel =
    EXPERIENCE_LEVELS.find((level) => level.value === user.experienceLevel)?.label || user.experienceLevel

  return (
    <div className="section">
      <div className="container-x">
        {/* --------------------------------- Header -------------------------------- */}
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-4">
              <span
                className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-sage-500 to-lavender-500 font-display text-xl font-semibold text-white"
                aria-hidden="true"
              >
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-semibold text-ink">{user.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Mail size={14} aria-hidden="true" />
                  <span className="truncate">{user.email}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip capitalize">{experienceLabel}</span>
                  {user.role === 'admin' && <span className="chip">Admin</span>}
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setActiveTab('details')} className="btn-outline shrink-0">
              <Settings size={16} aria-hidden="true" />
              Edit profile
            </button>
          </div>

          <dl className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-3">
            <div className="bg-card px-6 py-5">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <Heart size={13} aria-hidden="true" /> Favourites
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-ink">
                {favouritesLoading ? <Spinner size="sm" className="text-sage-500" /> : favourites.length}
              </dd>
            </div>
            <div className="bg-card px-6 py-5">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <Clock size={13} aria-hidden="true" /> Sessions logged
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-ink">
                {profileLoading ? <Spinner size="sm" className="text-sage-500" /> : sessionCount ?? '—'}
              </dd>
            </div>
            <div className="bg-card px-6 py-5">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <Calendar size={13} aria-hidden="true" /> Member since
              </dt>
              <dd className="mt-1 text-base font-semibold text-ink">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </section>

        {/* ---------------------------------- Tabs --------------------------------- */}
        <nav className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Profile sections">
          {TABS.map((item) => {
            const Icon = item.icon
            const selected = activeTab === item.key
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`tab-${item.key}`}
                aria-selected={selected}
                aria-controls={`panel-${item.key}`}
                onClick={() => setActiveTab(item.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? 'border-sage-600 bg-sage-600 text-white'
                    : 'border-line bg-card text-muted hover:border-sage-300 hover:text-ink'
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-6" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {/* ------------------------------ Profile details ----------------------- */}
          {activeTab === 'details' && (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <form onSubmit={handleSaveDetails} className="card p-6 sm:p-7" noValidate>
                <h2 className="text-lg font-semibold text-ink">Profile details</h2>
                <p className="mt-1 text-sm text-muted">Your name is the only detail other members ever see.</p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="label" htmlFor="profile-name">
                      Full name
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        aria-hidden="true"
                      />
                      <input
                        id="profile-name"
                        value={details.name}
                        onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))}
                        className={`input pl-11 ${detailErrors.name ? 'border-red-400' : ''}`}
                        placeholder="Your name"
                        autoComplete="name"
                        aria-invalid={Boolean(detailErrors.name)}
                      />
                    </div>
                    {detailErrors.name && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{detailErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="profile-email">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        aria-hidden="true"
                      />
                      <input
                        id="profile-email"
                        value={user.email}
                        readOnly
                        disabled
                        className="input cursor-not-allowed pl-11 opacity-70"
                        autoComplete="email"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      Your email identifies your account and cannot be changed here.
                    </p>
                  </div>

                  <fieldset>
                    <legend className="label">Experience level</legend>
                    <div className="mt-1 grid gap-2 sm:grid-cols-3">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setDetails((current) => ({ ...current, experienceLevel: level.value }))}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${
                            details.experienceLevel === level.value
                              ? 'border-sage-500 bg-sage-50 dark:bg-sage-800/60'
                              : 'border-line bg-card hover:border-sage-300'
                          }`}
                          aria-pressed={details.experienceLevel === level.value}
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
                        const selected = details.yogaGoals.includes(goal.value)
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
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="submit" disabled={savingDetails} className="btn-primary">
                    {savingDetails ? (
                      <>
                        <Spinner size="sm" /> Saving…
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </button>
                </div>
              </form>

              <div className="card p-6 sm:p-7">
                <h2 className="text-lg font-semibold text-ink">Your focus areas</h2>
                <p className="mt-1 text-sm text-muted">These shape the routines we suggest for you.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {details.yogaGoals.length === 0 ? (
                    <p className="text-sm text-muted">No focus areas selected yet.</p>
                  ) : (
                    details.yogaGoals.map((goal) => (
                      <span key={goal} className="chip capitalize">
                        {titleCase(goal)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------ Preferences --------------------------- */}
          {activeTab === 'preferences' && (
            <div className="card p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100">
                  <Settings size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Practice preferences</h2>
                  <p className="text-sm text-muted">Tune how your sessions and reminders are planned.</p>
                </div>
              </div>

              <div className="mt-6 space-y-7">
                <div>
                  <span className="label">Preferred session length</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {PRACTICE_DURATIONS.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => setPrefs((current) => ({ ...current, practiceDuration: minutes }))}
                        className={`chip transition ${
                          prefs.practiceDuration === minutes ? 'chip-active' : 'hover:border-sage-300'
                        }`}
                        aria-pressed={prefs.practiceDuration === minutes}
                      >
                        {formatDuration(minutes)}
                      </button>
                    ))}
                  </div>
                </div>

                <fieldset>
                  <legend className="label">Intensity</legend>
                  <div className="mt-1 grid gap-2 sm:grid-cols-3">
                    {INTENSITIES.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setPrefs((current) => ({ ...current, intensity: level.value }))}
                        className={`rounded-2xl border px-3 py-3 text-left transition ${
                          prefs.intensity === level.value
                            ? 'border-sage-500 bg-sage-50 dark:bg-sage-800/60'
                            : 'border-line bg-card hover:border-sage-300'
                        }`}
                        aria-pressed={prefs.intensity === level.value}
                      >
                        <span className="block text-sm font-semibold text-ink">{level.label}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-muted">{level.hint}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <span className="label">Weekly goal</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-line bg-card">
                      <button
                        type="button"
                        onClick={() => adjustWeeklyGoal(-1)}
                        disabled={prefs.weeklyGoalSessions <= 1}
                        className="grid h-10 w-10 place-items-center rounded-full text-lg text-muted transition hover:text-ink disabled:opacity-40"
                        aria-label="Decrease weekly goal"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-ink" aria-live="polite">
                        {prefs.weeklyGoalSessions}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustWeeklyGoal(1)}
                        disabled={prefs.weeklyGoalSessions >= 7}
                        className="grid h-10 w-10 place-items-center rounded-full text-lg text-muted transition hover:text-ink disabled:opacity-40"
                        aria-label="Increase weekly goal"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-muted">
                      {pluralise(prefs.weeklyGoalSessions, 'session')} per week
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <ToggleRow
                    icon={Bell}
                    label="Practice reminders"
                    description="A gentle nudge on the days you plan to practise."
                    checked={prefs.reminderEnabled}
                    onChange={(value) => setPrefs((current) => ({ ...current, reminderEnabled: value }))}
                  />
                  <ToggleRow
                    icon={Volume2}
                    label="Session sounds"
                    description="Chimes and cues during guided sessions."
                    checked={prefs.soundEnabled}
                    onChange={(value) => setPrefs((current) => ({ ...current, soundEnabled: value }))}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <p className="text-sm text-muted">
                  Goal:{' '}
                  <span className="font-semibold text-ink">
                    {pluralise(prefs.weeklyGoalSessions, 'session')} per week
                  </span>
                </p>
                <button type="button" onClick={handleSavePreferences} disabled={savingPrefs} className="btn-primary">
                  {savingPrefs ? (
                    <>
                      <Spinner size="sm" /> Saving…
                    </>
                  ) : (
                    'Save preferences'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------- Favourites --------------------------- */}
          {activeTab === 'favourites' &&
            (favouritesLoading ? (
              <Loader label="Loading your favourites…" />
            ) : favouritesError ? (
              <ErrorState
                title="We could not load your favourites"
                description={favouritesError}
                onRetry={loadFavourites}
              />
            ) : favourites.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No favourites yet"
                description="Tap the heart on any pose to save it here for quick access."
                actionTo="/poses"
                actionLabel="Explore poses"
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favourites.map((pose) => (
                  <PoseCard
                    key={pose._id}
                    pose={pose}
                    onToggleFavorite={handleRemoveFavourite}
                    busy={favouriteBusyId === pose._id}
                  />
                ))}
              </div>
            ))}

          {/* ---------------------------- Practice history ------------------------ */}
          {activeTab === 'history' &&
            (historyLoading ? (
              <Loader label="Loading your practice history…" />
            ) : historyError ? (
              <ErrorState
                title="We could not load your history"
                description={historyError}
                onRetry={() => loadHistory(historyPage)}
              />
            ) : history.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No sessions logged yet"
                description="Complete a session from the AI Coach or a yoga plan and it will appear here."
                actionTo="/plans"
                actionLabel="Browse yoga plans"
              />
            ) : (
              <>
                <ul className="space-y-3">
                  {history.map((session) => (
                    <li
                      key={session._id}
                      className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-ink">{session.title}</h3>
                          <span className="chip capitalize">{session.type}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {formatDateTime(session.completedAt)} ·{' '}
                          {pluralise(session.completedPoses?.length || 0, 'pose')}
                          {session.routineId?.title ? ` · ${session.routineId.title}` : ''}
                        </p>
                      </div>
                      <span className="chip shrink-0">{formatDuration(session.durationMinutes)}</span>
                    </li>
                  ))}
                </ul>

                {historyMeta && historyMeta.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                      disabled={historyPage <= 1}
                      className="btn-outline btn-sm"
                    >
                      <ChevronLeft size={15} aria-hidden="true" /> Newer
                    </button>
                    <p className="text-xs text-muted">
                      Page {historyMeta.page} of {historyMeta.totalPages}
                    </p>
                    <button
                      type="button"
                      onClick={() => setHistoryPage((page) => Math.min(historyMeta.totalPages, page + 1))}
                      disabled={historyPage >= historyMeta.totalPages}
                      className="btn-outline btn-sm"
                    >
                      Older <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </>
            ))}

          {/* -------------------------------- Security ---------------------------- */}
          {activeTab === 'security' && (
            <div className="card p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lavender-100 text-lavender-700 dark:bg-lavender-900/60 dark:text-lavender-200">
                  <ShieldCheck size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Security</h2>
                  <p className="text-sm text-muted">Change the password you use to sign in.</p>
                </div>
              </div>

              {passwordServerError && (
                <div
                  role="alert"
                  className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                >
                  {passwordServerError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="mt-6 max-w-lg space-y-5" noValidate>
                <div>
                  <label className="label" htmlFor="current-password">
                    Current password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                      }
                      className={`input pl-11 ${passwordErrors.currentPassword ? 'border-red-400' : ''}`}
                      placeholder="Your current password"
                      autoComplete="current-password"
                      aria-invalid={Boolean(passwordErrors.currentPassword)}
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="new-password">
                    New password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                      }
                      className={`input pl-11 pr-11 ${passwordErrors.newPassword ? 'border-red-400' : ''}`}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      aria-invalid={Boolean(passwordErrors.newPassword)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:text-ink"
                      aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {passwordForm.newPassword && (
                    <div className="mt-2">
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
                  {passwordErrors.newPassword && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="confirm-new-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    className={`input ${passwordErrors.confirmPassword ? 'border-red-400' : ''}`}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <button type="submit" disabled={changingPassword} className="btn-primary">
                  {changingPassword ? (
                    <>
                      <Spinner size="sm" /> Updating…
                    </>
                  ) : (
                    'Change password'
                  )}
                </button>
              </form>

              <p className="mt-6 flex items-start gap-2 rounded-2xl border border-line bg-card px-4 py-3 text-xs leading-relaxed text-muted">
                <Shield size={15} className="mt-0.5 shrink-0 text-sage-600 dark:text-sage-300" aria-hidden="true" />
                Your session token is stored in an httpOnly cookie that JavaScript cannot read, which helps protect
                your account from cross-site scripting attacks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
