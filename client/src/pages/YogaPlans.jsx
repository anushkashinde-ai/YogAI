import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Heart,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  Wand2,
} from 'lucide-react'

import SmartTimer from '../components/SmartTimer.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import DifficultyBadge, { SectionHeading, FadeIn } from '../components/ui.jsx'
import { Spinner } from '../components/Loader.jsx'
import EmptyState, { ErrorState } from '../components/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { poseService, progressService, routineService } from '../services/yogaService.js'
import {
  CATEGORY_LABELS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  INTENSITIES,
  POSE_CATEGORIES,
  YOGA_GOALS,
} from '../config/appConfig.js'
import { formatDuration, formatHoldTime, titleCase } from '../utils/format.js'

const DURATION_CHOICES = [10, 15, 20, 30, 45, 60]
const MAX_FOCUS_AREAS = 3

/** Routine poses only accept 240 characters of notes, so trim generously. */
const trimNotes = (value = '') => String(value || '').slice(0, 220)

/** Normalise a routine coming from the API into the shape SmartTimer expects. */
function toTimerRoutine(routine, sessionType = 'routine') {
  return {
    _id: routine?._id || null,
    title: routine?.title || 'Practice session',
    sessionType,
    poses: (routine?.poses || []).map((entry) => ({
      pose: entry.pose,
      durationSeconds: entry.durationSeconds,
      restSeconds: entry.restSeconds,
      part: entry.part,
      notes: entry.notes,
    })),
  }
}

export default function YogaPlans() {
  const { user } = useAuth()
  const toast = useToast()
  const location = useLocation()

  const [form, setForm] = useState({
    experienceLevel: user?.experienceLevel || 'beginner',
    goal: user?.yogaGoals?.[0] || 'general-wellness',
    durationMinutes: user?.preferences?.practiceDuration || 20,
    intensity: user?.preferences?.intensity || 'moderate',
    equipment: [],
    focusAreas: [],
  })

  const [preview, setPreview] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [savingRoutine, setSavingRoutine] = useState(false)
  const [generateError, setGenerateError] = useState('')

  const [myRoutines, setMyRoutines] = useState([])
  const [routinesLoading, setRoutinesLoading] = useState(true)
  const [routinesError, setRoutinesError] = useState('')

  const [activeRoutine, setActiveRoutine] = useState(null)
  const [quickPose, setQuickPose] = useState(null)
  const [quickPoseError, setQuickPoseError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const timerRef = useRef(null)

  const loadMyRoutines = useCallback(async () => {
    setRoutinesLoading(true)
    setRoutinesError('')
    try {
      const { data } = await routineService.list({ scope: 'mine', limit: 24 })
      setMyRoutines(data || [])
    } catch (error) {
      setRoutinesError(getErrorMessage(error, 'We could not load your saved routines.'))
    } finally {
      setRoutinesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMyRoutines()
  }, [loadMyRoutines])

  /**
   * "Practise this pose" on the pose detail page sends us here with a poseId —
   * offer a single-pose quick practice instead of an empty generator.
   */
  useEffect(() => {
    const poseId = location.state?.poseId
    if (!poseId) return

    let active = true
    setQuickPoseError('')

    poseService
      .get(poseId)
      .then(({ data }) => {
        if (active && data) setQuickPose(data)
      })
      .catch((error) => {
        if (active) setQuickPoseError(getErrorMessage(error, 'That pose could not be loaded.'))
      })

    return () => {
      active = false
    }
  }, [location.state?.poseId])

  const toggleArrayValue = (key, value, max) => {
    setForm((current) => {
      const list = current[key]
      if (list.includes(value)) return { ...current, [key]: list.filter((item) => item !== value) }
      if (max && list.length >= max) {
        toast.warning(`You can pick up to ${max} focus areas.`)
        return current
      }
      return { ...current, [key]: [...list, value] }
    })
  }

  const handleGenerate = async (event) => {
    event.preventDefault()
    setGenerating(true)
    setGenerateError('')
    try {
      const { data } = await routineService.generate({ ...form, save: false })
      setPreview(data)
      toast.success('Routine generated — preview it below.')
    } catch (error) {
      setGenerateError(getErrorMessage(error, 'We could not generate a routine right now.'))
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveRoutine = async () => {
    if (!preview) return
    setSavingRoutine(true)
    try {
      const payload = {
        title: preview.title,
        description: preview.description,
        goal: preview.goal,
        difficulty: preview.difficulty,
        intensity: preview.intensity,
        durationMinutes: preview.durationMinutes,
        poses: preview.poses.map((entry) => ({
          pose: typeof entry.pose === 'object' ? entry.pose._id : entry.pose,
          durationSeconds: entry.durationSeconds,
          restSeconds: entry.restSeconds,
          part: entry.part,
          notes: trimNotes(entry.notes),
        })),
        warmUp: preview.warmUp,
        coolDown: preview.coolDown,
        breathingReminders: preview.breathingReminders,
        tags: preview.tags,
      }

      const { data, message } = await routineService.create(payload)
      setMyRoutines((current) => [data, ...current])
      toast.success(message || 'Routine saved to your plans.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'We could not save that routine.'))
    } finally {
      setSavingRoutine(false)
    }
  }

  const handleToggleVisibility = async (routine) => {
    try {
      const { data, message } = await routineService.setVisibility(routine._id, !routine.isPublic)
      setMyRoutines((current) =>
        current.map((item) => (item._id === routine._id ? { ...item, isPublic: data.isPublic } : item))
      )
      toast.success(message || 'Visibility updated.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'We could not update that routine.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await routineService.remove(deleteTarget._id)
      setMyRoutines((current) => current.filter((item) => item._id !== deleteTarget._id))
      toast.success('Routine deleted.')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'We could not delete that routine.'))
    } finally {
      setDeleting(false)
    }
  }

  /**
   * Called by the Smart Timer when the user saves a completed session.
   * Throwing here surfaces the message inside the timer.
   */
  const handleSessionComplete = async (summary) => {
    try {
      const { data, message } = await progressService.saveSession({
        routineId: summary.routineId,
        title: summary.title,
        type: activeRoutine?.sessionType || 'routine',
        durationMinutes: summary.durationMinutes,
        completedPoses: summary.completedPoses,
      })

      const earned = data?.newlyEarned || []
      toast.success(message || 'Session saved.')
      earned.forEach((badge) => {
        toast.success(`Badge unlocked: ${badge.name}`, { title: 'Milestone reached' })
      })
      return data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'We could not save this session.'))
    }
  }

  const startRoutine = (routine, sessionType = 'routine') => {
    setActiveRoutine(toTimerRoutine(routine, sessionType))
    window.requestAnimationFrame(() => {
      timerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const previewPhases = useMemo(() => preview?.meta?.phases || null, [preview])

  const groupedPreviewPoses = useMemo(() => {
    const groups = { 'warm-up': [], main: [], 'cool-down': [] }
    ;(preview?.poses || []).forEach((entry) => {
      const key = groups[entry.part] ? entry.part : 'main'
      groups[key].push(entry)
    })
    return groups
  }, [preview])

  return (
    <div className="container-x section">
      <SectionHeading
        eyebrow="Yoga plans"
        title="Personalised routines, built around your day"
        description="Tell YogAI how much time and energy you have, and the planner assembles a warm-up, main sequence and cool-down from the pose library. Everything is generated by a transparent rule-based engine — no black box."
      />

      {/* ---------------------------------------------------------------- */}
      {/* Generator                                                        */}
      {/* ---------------------------------------------------------------- */}
      <FadeIn className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleGenerate} className="card p-6">
          <div className="flex items-center gap-2">
            <Wand2 size={18} className="text-sage-600 dark:text-sage-300" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Build my routine</h2>
          </div>

          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="label">Your experience</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {EXPERIENCE_LEVELS.map((level) => {
                  const active = form.experienceLevel === level.value
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, experienceLevel: level.value }))}
                      aria-pressed={active}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/50'
                          : 'border-line bg-card hover:border-sage-300'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-ink">{level.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted">{level.hint}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="goal">
                  Wellness goal
                </label>
                <select
                  id="goal"
                  className="input"
                  value={form.goal}
                  onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                >
                  {YOGA_GOALS.map((goal) => (
                    <option key={goal.value} value={goal.value}>
                      {goal.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="duration">
                  Time available
                </label>
                <select
                  id="duration"
                  className="input"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))
                  }
                >
                  {DURATION_CHOICES.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="label">Preferred intensity</legend>
              <div className="flex flex-wrap gap-2">
                {INTENSITIES.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, intensity: level.value }))}
                    aria-pressed={form.intensity === level.value}
                    className={`chip ${form.intensity === level.value ? 'chip-active' : ''}`}
                    title={level.hint}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Equipment you have</legend>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleArrayValue('equipment', item.value)}
                    aria-pressed={form.equipment.includes(item.value)}
                    className={`chip ${form.equipment.includes(item.value) ? 'chip-active' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">
                Focus areas <span className="font-normal text-muted">(optional, up to {MAX_FOCUS_AREAS})</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {POSE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleArrayValue('focusAreas', category, MAX_FOCUS_AREAS)}
                    aria-pressed={form.focusAreas.includes(category)}
                    className={`chip ${form.focusAreas.includes(category) ? 'chip-active' : ''}`}
                  >
                    {CATEGORY_LABELS[category] || titleCase(category)}
                  </button>
                ))}
              </div>
            </fieldset>

            {generateError && (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
              >
                {generateError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={generating} className="btn-primary btn-lg">
                {generating ? (
                  <>
                    <Spinner size="sm" /> Building your routine…
                  </>
                ) : (
                  <>
                    <Sparkles size={17} aria-hidden="true" /> Generate routine
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setForm({
                    experienceLevel: 'beginner',
                    goal: 'general-wellness',
                    durationMinutes: 20,
                    intensity: 'moderate',
                    equipment: [],
                    focusAreas: [],
                  })
                }
              >
                <RotateCcw size={15} aria-hidden="true" /> Reset
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          {/* Quick single-pose practice (arrived from a pose page) */}
          {quickPose && (
            <div className="card p-6">
              <p className="eyebrow">Quick practice</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{quickPose.name}</h3>
              <p className="mt-1 text-sm text-muted">
                You asked to practise this pose. Run a single-pose session with the smart timer, or build a full routine
                around it.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    startRoutine(
                      {
                        title: `${quickPose.name} practice`,
                        poses: [
                          {
                            pose: quickPose,
                            durationSeconds: Math.max(20, quickPose.duration || 30),
                            restSeconds: 15,
                            part: 'main',
                            notes: quickPose.breathingInstructions?.[0] || '',
                          },
                        ],
                      },
                      'pose'
                    )
                  }
                  className="btn-primary"
                >
                  <Play size={16} aria-hidden="true" /> Start {formatHoldTime(quickPose.duration)} practice
                </button>
                <Link to={`/poses/${quickPose.slug || quickPose._id}`} className="btn-outline">
                  Read the full guide
                </Link>
              </div>
            </div>
          )}

          {quickPoseError && (
            <p className="card px-4 py-3 text-sm text-muted">{quickPoseError}</p>
          )}

          {preview ? (
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Your generated plan</p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-ink">{preview.title}</h3>
                </div>
                <DifficultyBadge level={preview.difficulty} />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted">{preview.description}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="chip">
                  <Clock size={12} aria-hidden="true" /> {formatDuration(preview.durationMinutes)}
                </span>
                <span className="chip">
                  <Target size={12} aria-hidden="true" /> {titleCase(preview.intensity)}
                </span>
                <span className="chip">{(preview.poses || []).length} poses</span>
                {previewPhases && (
                  <span className="chip">
                    {previewPhases.warmUp} warm-up · {previewPhases.main} main · {previewPhases.coolDown} cool-down
                  </span>
                )}
                <span className="chip">engine: {preview.meta?.algorithm || 'rule-based-v1'}</span>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  ['warm-up', 'Warm-up'],
                  ['main', 'Main sequence'],
                  ['cool-down', 'Cool-down'],
                ].map(([key, label]) =>
                  groupedPreviewPoses[key].length > 0 ? (
                    <div key={key}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                      <ol className="mt-2 space-y-1.5">
                        {groupedPreviewPoses[key].map((entry, index) => (
                          <li
                            key={`${key}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3 py-2 text-sm"
                          >
                            <span className="truncate font-medium text-ink">
                              {entry.pose?.name || 'Pose'}
                            </span>
                            <span className="ml-3 shrink-0 text-xs text-muted">
                              {formatHoldTime(entry.durationSeconds)}
                              {entry.restSeconds > 0 ? ` · ${entry.restSeconds}s rest` : ''}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null
                )}
              </div>

              {preview.breathingReminders?.length > 0 && (
                <ul className="mt-5 space-y-1.5 rounded-2xl border border-line bg-sage-50/70 px-4 py-3 dark:bg-sage-900/30">
                  {preview.breathingReminders.map((reminder) => (
                    <li key={reminder} className="text-xs leading-relaxed text-muted">
                      · {reminder}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => startRoutine(preview, 'routine')} className="btn-primary">
                  <Play size={16} aria-hidden="true" /> Start session
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoutine}
                  disabled={savingRoutine}
                  className="btn-outline"
                >
                  {savingRoutine ? <Spinner size="sm" /> : <Plus size={16} aria-hidden="true" />} Save to my plans
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-6">
              <p className="eyebrow">How it works</p>
              <ol className="mt-3 space-y-3 text-sm text-muted">
                <li>
                  <span className="font-semibold text-ink">1. Tell us your day.</span> Experience, goal, time and intensity.
                </li>
                <li>
                  <span className="font-semibold text-ink">2. YogAI plans the phases.</span> Around 20% warm-up, 62% main
                  sequence and 18% cool-down, with rests scaled to your intensity.
                </li>
                <li>
                  <span className="font-semibold text-ink">3. Practise with the smart timer.</span> Preparation countdown,
                  pose holds, rest intervals, next-pose preview and a completion summary.
                </li>
                <li>
                  <span className="font-semibold text-ink">4. Save it.</span> Saved sessions feed your streaks, badges and
                  progress dashboard.
                </li>
              </ol>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Generated plans are general wellness suggestions, not medical advice. Stop if anything feels painful.
              </p>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ---------------------------------------------------------------- */}
      {/* Active timer                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div ref={timerRef} className="scroll-mt-24">
        <AnimatePresence>
          {activeRoutine && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mt-10"
            >
              <SmartTimer
                routine={activeRoutine}
                onComplete={handleSessionComplete}
                onExit={() => setActiveRoutine(null)}
                soundEnabled={user?.preferences?.soundEnabled !== false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Saved routines                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14">
        <SectionHeading
          eyebrow="My plans"
          title="Saved routines"
          description="Everything you generate or build lives here. Start a session any time, share a routine with the community, or remove it."
          action={
            <button type="button" onClick={loadMyRoutines} className="btn-outline btn-sm">
              <RotateCcw size={14} aria-hidden="true" /> Refresh
            </button>
          }
        />

        {routinesLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="card p-5">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton mt-3 h-3 w-full" />
                <div className="skeleton mt-2 h-3 w-4/5" />
              </div>
            ))}
          </div>
        ) : routinesError ? (
          <div className="mt-8">
            <ErrorState description={routinesError} onRetry={loadMyRoutines} />
          </div>
        ) : myRoutines.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Calendar}
              title="No saved routines yet"
              description="Generate a routine above and save it, and it will appear here ready to practise."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myRoutines.map((routine) => (
              <article key={routine._id} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug text-ink">{routine.title}</h3>
                  <DifficultyBadge level={routine.difficulty} />
                </div>

                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{routine.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="chip">
                    <Clock size={11} aria-hidden="true" /> {formatDuration(routine.durationMinutes)}
                  </span>
                  <span className="chip">{routine.poses?.length || 0} poses</span>
                  <span className="chip">{titleCase(routine.goal || 'general wellness')}</span>
                  {routine.isPublic && (
                    <span className="chip border-sage-300 text-sage-700 dark:text-sage-200">
                      <Eye size={11} aria-hidden="true" /> Shared
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button type="button" onClick={() => startRoutine(routine)} className="btn-primary btn-sm">
                    <Play size={14} aria-hidden="true" /> Start
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(routine)}
                    className="btn-outline btn-sm"
                    title={routine.isPublic ? 'Make this routine private' : 'Share this routine publicly'}
                  >
                    {routine.isPublic ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    {routine.isPublic ? 'Make private' : 'Share'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(routine)}
                    className="btn-ghost btn-sm text-red-600 dark:text-red-300"
                    aria-label={`Delete ${routine.title}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Library routines + safety                                        */}
      {/* ---------------------------------------------------------------- */}
      <FadeIn className="mt-14 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <Heart size={17} className="text-lavender-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Not sure where to start?</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Explore the poses first, or let the Yogi Assistant suggest a beginner routine that fits your week.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/poses" className="btn-outline">
              Explore poses
            </Link>
            <Link to="/assistant" className="btn-ghost">
              Ask Yogi Assistant
            </Link>
            <Link to="/mood" className="btn-ghost">
              Match a routine to my mood
            </Link>
          </div>
        </div>

        <div className="card border-amber-200 bg-amber-50/70 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <TriangleAlert size={17} className="text-amber-600 dark:text-amber-300" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Practise safely</h2>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
            <li>· Warm up before longer holds and never force a stretch.</li>
            <li>· Come out of a pose early — that still counts as a complete practice.</li>
            <li>· Skip breath holds if they feel uncomfortable.</li>
            <li>· Stop immediately if you feel pain, dizziness or shortness of breath.</li>
          </ul>
          <p className="mt-3 text-xs text-muted">
            YogAI offers general wellness guidance only, not medical advice.{' '}
            <Link to="/safety" className="link">
              Read the full safety disclaimer
            </Link>
            .
          </p>
        </div>
      </FadeIn>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this routine?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from your plans. Sessions you have already logged stay in your progress history.`
            : ''
        }
        confirmLabel="Delete routine"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
