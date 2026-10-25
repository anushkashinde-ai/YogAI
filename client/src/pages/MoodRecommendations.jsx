import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Clock,
  CloudRain,
  Leaf,
  Moon,
  Play,
  RefreshCw,
  Smile,
  Sparkles,
  Target,
  TriangleAlert,
  Wind,
  Zap,
} from 'lucide-react'

import { moodService } from '../services/yogaService.js'
import { getErrorMessage } from '../services/api.js'
import PoseCard from '../components/PoseCard.jsx'
import DifficultyBadge, { FadeIn, SectionHeading } from '../components/ui.jsx'
import { Spinner } from '../components/Loader.jsx'
import EmptyState, { ErrorState } from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatDuration, formatHoldTime, titleCase } from '../utils/format.js'

const MAX_MOODS = 3

/** Icons are mapped locally so the API response stays presentation-free. */
const MOOD_ICONS = {
  stressed: CloudRain,
  tired: Moon,
  energetic: Zap,
  unfocused: Target,
  calm: Smile,
  'gentle-movement': Leaf,
}

const ROUTINE_PART_ORDER = ['warm-up', 'main', 'cool-down']
const ROUTINE_PART_LABELS = {
  'warm-up': 'Warm-up',
  main: 'Main sequence',
  'cool-down': 'Cool-down',
}

/**
 * "How are you feeling today?" — pairs a multi-select mood picker with the
 * server's transparent, rule-based recommendation engine.
 */
export default function MoodRecommendations() {
  const [options, setOptions] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [selected, setSelected] = useState([])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [resultError, setResultError] = useState(null)

  const toast = useToast()
  const selectorRef = useRef(null)

  useEffect(() => {
    let active = true
    setOptionsLoading(true)
    setOptionsError(null)

    const load = async () => {
      try {
        const { data } = await moodService.options()
        if (active) setOptions(data || [])
      } catch (error) {
        if (active) setOptionsError(getErrorMessage(error, 'The mood options could not be loaded right now.'))
      } finally {
        if (active) setOptionsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [reloadKey])

  const toggleMood = (key) => {
    if (selected.includes(key)) {
      setSelected(selected.filter((item) => item !== key))
      return
    }

    if (selected.length >= MAX_MOODS) {
      toast.warning(`You can choose up to ${MAX_MOODS} moods at a time. Remove one to add another.`)
      return
    }

    setSelected([...selected, key])
  }

  const clearSelection = () => setSelected([])

  const recommend = async () => {
    if (selected.length === 0) {
      toast.warning('Choose at least one mood before asking for recommendations.')
      return
    }

    setLoading(true)
    setResultError(null)

    try {
      const { data } = await moodService.recommend(selected)
      setResult(data)
    } catch (error) {
      setResultError(getErrorMessage(error, 'We could not build your recommendations right now.'))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setResultError(null)
    selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Resolve routine pose ids back to names using the recommended pose list.
  const poseLookup = useMemo(() => {
    const map = {}
    ;(result?.poses || []).forEach((pose) => {
      if (pose?._id) map[String(pose._id)] = pose.name
    })
    return map
  }, [result])

  const poseName = (value) => {
    if (value && typeof value === 'object') return value.name || 'Pose'
    return poseLookup[String(value)] || 'Pose'
  }

  // PoseCard links by slug || _id, so make sure both are safe strings.
  const recommendedPoses = (result?.poses || []).map((pose) => ({
    ...pose,
    slug: pose.slug ? String(pose.slug) : pose._id ? String(pose._id) : undefined,
    _id: pose._id ? String(pose._id) : undefined,
  }))

  const routineGroups = useMemo(() => {
    const list = result?.routine?.poses || []
    let counter = 0

    return ROUTINE_PART_ORDER.map((part) => {
      const poses = list
        .filter((entry) => entry.part === part)
        .map((entry) => ({ ...entry, number: (counter += 1) }))
      return { part, label: ROUTINE_PART_LABELS[part] || titleCase(part), poses }
    }).filter((group) => group.poses.length > 0)
  }, [result])

  const routine = result?.routine
  const phases = routine?.meta?.phases

  // Zip the breathing pattern numbers with the phase labels into one readable line.
  const breathingLine = (result?.breathing?.pattern || [])
    .map((seconds, index) => {
      const phase = result?.breathing?.phases?.[index]
      if (!phase || !seconds) return null
      return `${phase} ${seconds}`
    })
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="section pb-6">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Mood-based guidance</span>
            <h1 className="mt-3 text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
              How are you feeling today?
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Tell us how you feel and YogAI matches gentle, rule-based wellness suggestions to your mood — a handful of
              suitable poses, a short routine and a breathing pattern. Nothing here is a diagnosis; it is a transparent
              set of rules designed to help you decide where to begin.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------- Selector ------------------------------ */}
      <section className="section pt-0">
        <div className="container-x" ref={selectorRef}>
          <SectionHeading
            eyebrow="Step 1 · Choose your mood"
            title="Pick up to three feelings"
            description="You can select more than one — YogAI blends them into a single set of suggestions."
            action={
              selected.length > 0 ? (
                <button type="button" onClick={clearSelection} className="btn-outline btn-sm">
                  Clear
                </button>
              ) : null
            }
          />

          <div className="mt-8">
            {optionsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" className="text-sage-500" />
              </div>
            ) : optionsError ? (
              <ErrorState
                title="We could not load the mood options"
                description={optionsError}
                onRetry={() => setReloadKey((value) => value + 1)}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {options.map((mood, index) => {
                  const Icon = MOOD_ICONS[mood.key] || Sparkles
                  const isSelected = selected.includes(mood.key)

                  return (
                    <FadeIn key={mood.key} delay={index * 0.04}>
                      <button
                        type="button"
                        onClick={() => toggleMood(mood.key)}
                        aria-pressed={isSelected}
                        className={`card card-hover flex h-full w-full items-start gap-4 p-5 text-left ${
                          isSelected ? 'border-sage-300 bg-sage-50 ring-2 ring-sage-400 dark:bg-sage-900/60' : ''
                        }`}
                      >
                        <span
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                            isSelected
                              ? 'bg-sage-600 text-white'
                              : 'bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100'
                          }`}
                        >
                          <Icon size={20} aria-hidden="true" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-base font-semibold text-ink">{mood.label}</span>
                            {isSelected && (
                              <Check size={15} className="text-sage-600 dark:text-sage-300" aria-hidden="true" />
                            )}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted">{mood.summary}</span>
                        </span>
                      </button>
                    </FadeIn>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={recommend}
              disabled={selected.length === 0 || loading}
              className="btn-primary btn-lg"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Finding your matches…
                </>
              ) : (
                <>
                  <Sparkles size={18} aria-hidden="true" />
                  Get my recommendations
                </>
              )}
            </button>

            <p className="text-sm text-muted">
              {selected.length === 0
                ? 'Select at least one mood to continue.'
                : `${selected.length} of ${MAX_MOODS} moods selected.`}
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------- Results ------------------------------ */}
      {(loading || resultError || result) && (
        <section className="section pt-0">
          <div className="container-x">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status">
                <Spinner size="lg" className="text-sage-500" />
                <p className="text-sm font-medium">Matching poses, a routine and a breath to how you feel…</p>
              </div>
            )}

            {!loading && resultError && (
              <ErrorState
                title="We could not build your recommendations"
                description={resultError}
                onRetry={recommend}
              />
            )}

            {!loading && result && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <SectionHeading
                    eyebrow="Step 2 · Your suggestions"
                    title="Matched to how you feel"
                    description="Everything below comes from the same rule set, so you can see exactly why it was suggested."
                  />
                  <button type="button" onClick={reset} className="btn-outline btn-sm">
                    <RefreshCw size={14} aria-hidden="true" />
                    Try another mood
                  </button>
                </div>

                {/* 1. Summary */}
                <FadeIn className="mt-8">
                  <div className="card p-6 sm:p-8">
                    <span className="eyebrow">Your match</span>
                    <h2 className="mt-3 text-xl font-semibold text-ink sm:text-2xl">
                      {(result.moods || []).map((mood) => mood.label).join(' · ')}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{result.summary}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="chip capitalize">{result.intensity} intensity</span>
                      <span className="chip">
                        <Clock size={13} aria-hidden="true" />
                        {formatDuration(result.durationMinutes)}
                      </span>
                      <span className="chip">
                        <Sparkles size={13} aria-hidden="true" />
                        {recommendedPoses.length} poses suggested
                      </span>
                    </div>
                  </div>
                </FadeIn>

                {/* 2. Recommended poses */}
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-ink">Recommended poses</h3>
                  <p className="mt-1 text-sm text-muted">
                    A short, matched set from the YogAI pose library. Each card links to full instructions, breathing
                    cues and beginner modifications.
                  </p>

                  {recommendedPoses.length === 0 ? (
                    <div className="mt-5">
                      <EmptyState
                        title="No poses matched this combination"
                        description="The library may not contain a pose for every mood yet. Try a different mood or reset your selection."
                        actionLabel="Try another mood"
                        onAction={reset}
                      />
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {recommendedPoses.map((pose, index) => (
                        <FadeIn key={pose._id || pose.slug || index} delay={index * 0.05}>
                          <PoseCard pose={pose} />
                        </FadeIn>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Suggested routine */}
                <FadeIn className="mt-10">
                  <div className="card overflow-hidden">
                    <div className="border-b border-line bg-gradient-to-r from-sage-50 to-lavender-50 p-6 sm:p-7 dark:from-sage-950/40 dark:to-lavender-950/30">
                      <span className="eyebrow">Your suggested routine</span>
                      <h3 className="mt-3 text-xl font-semibold text-ink">{routine.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{routine.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <DifficultyBadge level={routine.difficulty} />
                        <span className="chip capitalize">{routine.intensity} intensity</span>
                        <span className="chip">
                          <Clock size={13} aria-hidden="true" />
                          {formatDuration(routine.durationMinutes)}
                        </span>
                        {phases && (
                          <>
                            <span className="chip">{phases.warmUp} warm-up</span>
                            <span className="chip">{phases.main} main</span>
                            <span className="chip">{phases.coolDown} cool-down</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-6 sm:p-7">
                      {routineGroups.map((group) => (
                        <div key={group.part} className="mb-6 last:mb-0">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                            {group.label} · {group.poses.length}
                          </h4>

                          <ol className="mt-2 space-y-2">
                            {group.poses.map((entry) => (
                              <li
                                key={entry.number}
                                className="flex items-start gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-2.5"
                              >
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-100 text-[11px] font-semibold text-sage-700 dark:bg-sage-800 dark:text-sage-100">
                                  {entry.number}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="text-sm font-medium text-ink">{poseName(entry.pose)}</span>
                                  {entry.notes && (
                                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{entry.notes}</span>
                                  )}
                                </span>

                                <span className="shrink-0 text-right text-xs text-muted">
                                  <span className="block">{formatHoldTime(entry.durationSeconds)} hold</span>
                                  <span className="block">{formatHoldTime(entry.restSeconds)} rest</span>
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}

                      {(routine.warmUp?.length > 0 || routine.coolDown?.length > 0) && (
                        <div className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
                          {routine.warmUp?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                Before you begin
                              </h4>
                              <ul className="mt-2 space-y-1.5 text-sm">
                                {routine.warmUp.map((item) => (
                                  <li key={item} className="flex items-start gap-2 text-muted">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" aria-hidden="true" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {routine.coolDown?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">To finish</h4>
                              <ul className="mt-2 space-y-1.5 text-sm">
                                {routine.coolDown.map((item) => (
                                  <li key={item} className="flex items-start gap-2 text-muted">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender-400" aria-hidden="true" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {routine.breathingReminders?.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-line bg-surface/60 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Breathing reminders</p>
                          <ul className="mt-2 space-y-1.5 text-sm">
                            {routine.breathingReminders.map((item) => (
                              <li key={item} className="flex items-start gap-2 text-muted">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" aria-hidden="true" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-6 border-t border-line pt-5">
                        <Link to="/plans" className="btn-primary">
                          <Play size={16} aria-hidden="true" />
                          Start this routine
                        </Link>

                        <p className="mt-3 text-xs leading-relaxed text-muted">
                          This routine is assembled by the transparent{' '}
                          <span className="font-medium text-ink">{result.algorithm}</span> rule-based engine from the
                          YogAI pose library — no black box. Open the Yoga Plans page to save it to your account and run
                          it with the guided timer.
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>

                {/* 4. Breathing */}
                {result.breathing && (
                  <FadeIn className="mt-10">
                    <div className="card p-6 sm:p-7">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lavender-100 text-lavender-700 dark:bg-lavender-900/60 dark:text-lavender-200">
                          <Wind size={22} aria-hidden="true" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <span className="eyebrow">Breathing suggestion</span>
                          <h3 className="mt-2 text-lg font-semibold text-ink">{result.breathing.name}</h3>

                          {breathingLine && (
                            <p className="mt-3 font-display text-lg font-semibold text-sage-700 dark:text-sage-200">
                              {breathingLine}
                            </p>
                          )}

                          <p className="mt-2 text-sm leading-relaxed text-muted">{result.breathing.note}</p>

                          <Link to="/breathing" className="btn-outline mt-5">
                            Open the Breathing Studio
                            <ArrowRight size={16} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* 5. Disclaimer */}
                <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40 sm:p-6">
                  <div className="flex items-start gap-3">
                    <TriangleAlert size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Please read</p>
                      <p className="mt-1 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                        {result.disclaimer}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                        YogAI's mood suggestions are only a gentle starting point for general wellbeing. They are not a
                        diagnosis of any medical or mental-health condition — if you feel unwell, dizzy or in pain, stop
                        and speak to a qualified professional.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  )
}
