import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  Leaf,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Wind,
  Zap,
} from 'lucide-react'

import { SectionHeading, StatCard, FadeIn } from '../components/ui.jsx'
import PoseCard from '../components/PoseCard.jsx'
import { Spinner } from '../components/Loader.jsx'
import EmptyState, { ErrorState } from '../components/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { achievementService, favoriteService, progressService } from '../services/yogaService.js'
import { ACHIEVEMENT_ICONS, CATEGORY_LABELS } from '../config/appConfig.js'
import { formatDate, formatDateTime, formatDuration, pluralise, titleCase } from '../utils/format.js'

const PIE_COLOURS = ['#75a583', '#8b68c7', '#d9b26a', '#5d8fb3', '#c98a8a', '#7f9d8b', '#a9a3d4', '#c2b280', '#8fb9a8']

/** Map the icon key stored on a badge to a real lucide component. */
const BADGE_ICONS = {
  sparkles: Sparkles,
  flame: Flame,
  wind: Wind,
  footprints: Activity,
  sunrise: Sparkles,
  medal: Award,
  clock: Clock,
  trophy: Trophy,
  award: Award,
}

const SESSION_TONES = {
  routine: 'bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100',
  pose: 'bg-lavender-100 text-lavender-700 dark:bg-lavender-900/60 dark:text-lavender-100',
  breathing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-100',
  meditation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100',
  'free-practice': 'bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100',
}

function ChartTooltip({ active, payload, label, suffix = 'min' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-2 text-xs shadow-lift">
      <p className="font-semibold text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-muted">
          {entry.name}: <span className="font-semibold text-ink">{entry.value}</span>
          {suffix ? ` ${suffix}` : ''}
        </p>
      ))}
    </div>
  )
}

export default function ProgressDashboard() {
  const { user, updatePreferences } = useAuth()
  const toast = useToast()

  const [summary, setSummary] = useState(null)
  const [badges, setBadges] = useState([])
  const [badgeMeta, setBadgeMeta] = useState({ earnedCount: 0, totalCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [history, setHistory] = useState([])
  const [historyMeta, setHistoryMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [historyPage, setHistoryPage] = useState(1)
  const [historyLoading, setHistoryLoading] = useState(true)

  const [goalSaving, setGoalSaving] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [progressResult, badgeResult] = await Promise.all([
        progressService.summary(),
        achievementService.list().catch(() => ({ data: [], meta: null })),
      ])
      setSummary(progressResult.data)
      setBadges(badgeResult.data || [])
      if (badgeResult.meta) setBadgeMeta(badgeResult.meta)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'We could not load your progress right now.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard, reloadKey])

  const loadHistory = useCallback(async (page) => {
    setHistoryLoading(true)
    try {
      const { data, meta } = await progressService.history({ page, limit: 8 })
      setHistory(data || [])
      if (meta) setHistoryMeta(meta)
    } catch (historyError) {
      toast.error(getErrorMessage(historyError, 'We could not load your practice history.'))
    } finally {
      setHistoryLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadHistory(historyPage)
  }, [loadHistory, historyPage])

  const handleGoalChange = async (delta) => {
    if (!summary) return
    const next = Math.min(7, Math.max(1, (summary.weeklyGoal?.target || 4) + delta))
    if (next === summary.weeklyGoal?.target) return

    setGoalSaving(true)
    try {
      await updatePreferences({ weeklyGoalSessions: next })
      setSummary((current) => ({
        ...current,
        weeklyGoal: {
          ...current.weeklyGoal,
          target: next,
          percent: Math.min(100, Math.round((current.weeklyGoal.completed / next) * 100)),
        },
      }))
    } catch {
      // updatePreferences already surfaced a toast.
    } finally {
      setGoalSaving(false)
    }
  }

  const handleRemoveFavorite = async (pose) => {
    setFavoriteBusy(pose._id)
    const previous = summary?.favoritePoses || []
    setSummary((current) => ({
      ...current,
      favoritePoses: (current.favoritePoses || []).filter((item) => item._id !== pose._id),
    }))
    try {
      const { message } = await favoriteService.remove(pose._id)
      toast.success(message || 'Removed from favourites.')
    } catch (removeError) {
      setSummary((current) => ({ ...current, favoritePoses: previous }))
      toast.error(getErrorMessage(removeError, 'We could not update your favourites.'))
    } finally {
      setFavoriteBusy(null)
    }
  }

  const weeklyData = useMemo(
    () =>
      (summary?.weekly || []).map((day) => ({
        label: day.label,
        minutes: day.minutes,
        sessions: day.sessions,
      })),
    [summary]
  )

  const categoryData = useMemo(
    () =>
      (summary?.categoryMinutes || []).map((entry) => ({
        name: CATEGORY_LABELS[entry.category] || titleCase(entry.category),
        value: entry.count,
      })),
    [summary]
  )

  const earnedBadges = badges.filter((badge) => badge.earned)
  const lockedBadges = badges.filter((badge) => !badge.earned)
  const hasActivity = (summary?.totals?.sessions || 0) > 0

  if (loading) {
    return (
      <div className="container-x section">
        <div className="flex items-center justify-center gap-3 py-24 text-muted" role="status">
          <Spinner size="lg" className="text-sage-500" />
          <span className="text-sm font-medium">Calculating your progress…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-x section">
        <ErrorState description={error} onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    )
  }

  return (
    <div className="container-x section">
      <SectionHeading
        eyebrow="Your practice"
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Every number here comes from sessions you have actually logged. YogAI rewards consistency — never appearance or flexibility."
        action={
          <Link to="/plans" className="btn-primary btn-sm">
            <Sparkles size={15} aria-hidden="true" /> Start a session
          </Link>
        }
      />

      {/* ------------------------------------------------------------ */}
      {/* Headline metrics                                             */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Total sessions"
          value={summary?.totals?.sessions ?? 0}
          hint={`${pluralise(summary?.totals?.poses ?? 0, 'pose')} practised`}
        />
        <StatCard
          icon={Clock}
          label="Practice minutes"
          tone="lavender"
          value={summary?.totals?.minutes ?? 0}
          hint={`Average ${summary?.averageSessionMinutes ?? 0} min per session`}
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          tone="amber"
          value={`${summary?.streak?.current ?? 0} day${summary?.streak?.current === 1 ? '' : 's'}`}
          hint={
            summary?.streak?.lastPracticeDay
              ? `Last practised ${formatDate(summary.streak.lastPracticeDay)}`
              : 'Log a session to start a streak'
          }
        />
        <StatCard
          icon={Trophy}
          label="Longest streak"
          value={`${summary?.streak?.longest ?? 0} day${summary?.streak?.longest === 1 ? '' : 's'}`}
          hint={`${summary?.totals?.routines ?? 0} rout${summary?.totals?.routines === 1 ? 'ine' : 'ines'} practised`}
        />
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Weekly goal + activity chart                                 */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <FadeIn className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">This week&apos;s activity</h2>
              <p className="mt-1 text-sm text-muted">
                Minutes practised each day over the last seven days.
              </p>
            </div>
            <span className="chip">
              <BarChart3 size={12} aria-hidden="true" />
              {summary?.weekly?.reduce((sum, day) => sum + day.minutes, 0) ?? 0} min total
            </span>
          </div>

          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(117,159,131,0.25)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(117,159,131,0.10)' }} />
                <Bar dataKey="minutes" name="Minutes" radius={[8, 8, 4, 4]} fill="#75a583" maxBarSize={46} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {!hasActivity && (
            <p className="mt-4 rounded-2xl border border-line bg-surface/60 px-4 py-3 text-xs text-muted">
              No sessions logged yet. Finish a routine in{' '}
              <Link to="/plans" className="link">
                Yoga Plans
              </Link>{' '}
              or a breathing session in the{' '}
              <Link to="/breathing" className="link">
                Breathing Studio
              </Link>{' '}
              and this chart will fill up.
            </p>
          )}
        </FadeIn>

        <FadeIn delay={0.05} className="card flex flex-col p-6">
          <div className="flex items-center gap-2">
            <Target size={17} className="text-sage-600 dark:text-sage-300" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Weekly goal</h2>
          </div>

          <p className="mt-2 text-sm text-muted">
            Aim for a number of sessions you can genuinely keep. Consistency beats intensity.
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleGoalChange(-1)}
              disabled={goalSaving || (summary?.weeklyGoal?.target || 4) <= 1}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-ink disabled:opacity-40"
              aria-label="Decrease weekly goal"
            >
              <Minus size={15} />
            </button>
            <div className="text-center">
              <p className="font-display text-4xl font-semibold text-ink">{summary?.weeklyGoal?.target ?? 4}</p>
              <p className="text-xs text-muted">sessions per week</p>
            </div>
            <button
              type="button"
              onClick={() => handleGoalChange(1)}
              disabled={goalSaving || (summary?.weeklyGoal?.target || 4) >= 7}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-ink disabled:opacity-40"
              aria-label="Increase weekly goal"
            >
              <Plus size={15} />
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                {summary?.weeklyGoal?.completed ?? 0} of {summary?.weeklyGoal?.target ?? 4} done this week
              </span>
              <span>{summary?.weeklyGoal?.percent ?? 0}%</span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-sage-800"
              role="progressbar"
              aria-valuenow={summary?.weeklyGoal?.percent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-sage-500 to-lavender-500 transition-all duration-500"
                style={{ width: `${summary?.weeklyGoal?.percent ?? 0}%` }}
              />
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="rounded-2xl border border-line bg-surface/60 px-4 py-3 text-xs leading-relaxed text-muted">
              {summary?.totals?.breathingSessions ? (
                <>
                  You have completed <span className="font-semibold text-ink">{summary.totals.breathingSessions}</span>{' '}
                  breathing session{summary.totals.breathingSessions === 1 ? '' : 's'} — lovely nervous-system work.
                </>
              ) : (
                <>
                  Add a breathing session from the{' '}
                  <Link to="/breathing" className="link">
                    Breathing Studio
                  </Link>{' '}
                  to unlock the Breathing Beginner badge.
                </>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Category balance + favourites                                */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FadeIn className="card p-6">
          <h2 className="text-lg font-semibold text-ink">Pose balance</h2>
          <p className="mt-1 text-sm text-muted">Which categories your completed poses come from.</p>

          {categoryData.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-line bg-surface/60 px-4 py-6 text-center text-sm text-muted">
              Complete a routine and your pose mix will appear here.
            </p>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLOURS[index % PIE_COLOURS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip suffix="poses" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="space-y-2">
                {categoryData.map((entry, index) => {
                  const max = Math.max(...categoryData.map((item) => item.value), 1)
                  return (
                    <li key={entry.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: PIE_COLOURS[index % PIE_COLOURS.length] }}
                            aria-hidden="true"
                          />
                          {entry.name}
                        </span>
                        <span className="font-semibold text-ink">{entry.value}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-sage-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((entry.value / max) * 100)}%`,
                            backgroundColor: PIE_COLOURS[index % PIE_COLOURS.length],
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </FadeIn>

        <FadeIn delay={0.05} className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Favourite poses</h2>
              <p className="mt-1 text-sm text-muted">The poses you save most often.</p>
            </div>
            <Link to="/poses" className="btn-ghost btn-sm">
              <Heart size={14} aria-hidden="true" /> Browse
            </Link>
          </div>

          {(summary?.favoritePoses || []).length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Heart}
                title="No favourites yet"
                description="Tap the heart on any pose to keep it here for quick access."
                actionTo="/poses"
                actionLabel="Explore poses"
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(summary.favoritePoses || []).slice(0, 4).map((pose) => (
                <PoseCard
                  key={pose._id}
                  pose={pose}
                  onToggleFavorite={handleRemoveFavorite}
                  busy={favoriteBusy === pose._id}
                />
              ))}
            </div>
          )}
        </FadeIn>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Achievements                                                 */}
      {/* ------------------------------------------------------------ */}
      <section className="mt-14">
        <SectionHeading
          eyebrow="Gamification"
          title="Achievement badges"
          description="Badges reward showing up — streaks, sessions, breathing practice and balance work. Nothing here measures how you look."
          action={
            <span className="chip">
              <Award size={12} aria-hidden="true" /> {badgeMeta.earnedCount} of {badgeMeta.totalCount} unlocked
            </span>
          }
        />

        {badges.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Trophy}
              title="Badges are being prepared"
              description="The achievement catalogue could not be loaded. Refresh in a moment to see your badge wall."
              onAction={() => setReloadKey((key) => key + 1)}
              actionLabel="Try again"
            />
          </div>
        ) : (
          <>
            {earnedBadges.length > 0 && (
              <>
                <h3 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  <Sparkles size={14} aria-hidden="true" /> Unlocked
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {earnedBadges.map((badge) => {
                    const Icon = BADGE_ICONS[ACHIEVEMENT_ICONS[badge.icon] || badge.icon] || Award
                    return (
                      <article
                        key={badge.key}
                        className="card flex items-start gap-4 border-sage-300 bg-sage-50/70 p-5 dark:border-sage-700 dark:bg-sage-900/30"
                      >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sage-500 to-lavender-500 text-white">
                          <Icon size={22} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-ink">{badge.name}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-muted">{badge.description}</p>
                          {badge.earnedAt && (
                            <p className="mt-2 text-[11px] font-medium text-sage-700 dark:text-sage-300">
                              Earned {formatDate(badge.earnedAt)}
                            </p>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </>
            )}

            {lockedBadges.length > 0 && (
              <>
                <h3 className="mt-10 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  <Target size={14} aria-hidden="true" /> In progress
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {lockedBadges.map((badge) => {
                    const Icon = BADGE_ICONS[ACHIEVEMENT_ICONS[badge.icon] || badge.icon] || Award
                    return (
                      <article key={badge.key} className="card p-5">
                        <div className="flex items-start gap-4">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-100 text-muted dark:bg-sage-800">
                            <Icon size={22} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-ink">{badge.name}</h4>
                            <p className="mt-1 text-xs leading-relaxed text-muted">{badge.description}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span>
                              {badge.progress?.value ?? 0} / {badge.progress?.target ?? 1}
                            </span>
                            <span>{badge.progress?.percent ?? 0}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-sage-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sage-400 to-lavender-400"
                              style={{ width: `${badge.progress?.percent ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------------ */}
      {/* History                                                      */}
      {/* ------------------------------------------------------------ */}
      <section className="mt-14">
        <SectionHeading
          eyebrow="Practice history"
          title="Everything you have logged"
          description="Your completed routines, single-pose practices, breathing sessions and meditations."
        />

        {historyLoading ? (
          <div className="mt-8 flex items-center justify-center gap-3 py-12 text-muted" role="status">
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            <span className="text-sm">Loading your history…</span>
          </div>
        ) : history.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Calendar}
              title="No sessions logged yet"
              description="Finish a routine or a breathing session and it will be listed here with its duration and poses."
              actionTo="/plans"
              actionLabel="Start a session"
            />
          </div>
        ) : (
          <>
            <ul className="mt-8 space-y-3">
              {history.map((session) => (
                <li key={session._id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${SESSION_TONES[session.type] || SESSION_TONES.routine}`}
                      >
                        {titleCase(session.type)}
                      </span>
                      {session.routineId?.title && (
                        <span className="text-xs text-muted">from {session.routineId.title}</span>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-ink">{session.title || 'Practice session'}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {formatDateTime(session.completedAt)} ·{' '}
                      {pluralise(session.completedPoses?.length || 0, 'pose')} completed
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-3 py-1.5 text-sm font-semibold text-sage-700 dark:bg-sage-900/50 dark:text-sage-100">
                      <Clock size={14} aria-hidden="true" />
                      {formatDuration(session.durationMinutes)}
                    </span>
                    {session.routineId?._id && (
                      <Link to="/plans" className="btn-ghost btn-sm">
                        <Zap size={14} aria-hidden="true" /> Repeat
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {historyMeta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                  disabled={historyMeta.page <= 1}
                  className="btn-outline btn-sm"
                >
                  <ChevronLeft size={15} aria-hidden="true" /> Newer
                </button>
                <span className="text-xs text-muted">
                  Page {historyMeta.page} of {historyMeta.totalPages} · {historyMeta.total} sessions
                </span>
                <button
                  type="button"
                  onClick={() => setHistoryPage((page) => Math.min(historyMeta.totalPages, page + 1))}
                  disabled={historyMeta.page >= historyMeta.totalPages}
                  className="btn-outline btn-sm"
                >
                  Older <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <FadeIn className="mt-14">
        <div className="card flex flex-col gap-4 border-line bg-gradient-to-r from-sage-50 to-lavender-50 p-6 dark:from-sage-900/40 dark:to-lavender-900/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-sage-700 dark:bg-white/10 dark:text-sage-100">
              <Leaf size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Progress is a practice, not a scoreboard</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                YogAI tracks time on the mat, never body measurements. If you miss a day, the streak simply restarts —
                the practice is still yours.
              </p>
            </div>
          </div>
          <Link to="/community" className="btn-primary shrink-0">
            Join a weekly challenge
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
