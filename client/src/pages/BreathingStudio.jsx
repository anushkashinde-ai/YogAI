import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Leaf,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react'

import { FadeIn, SectionHeading } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { progressService } from '../services/yogaService.js'
import { BREATHING_PATTERNS, MEDITATION_SESSIONS } from '../config/appConfig.js'
import { formatDuration, formatSeconds } from '../utils/format.js'

const DURATION_CHOICES = [1, 3, 5, 10]

/** Gentle Web Audio helpers — no audio files, nothing leaves the browser. */
function useAudio(enabled) {
  const contextRef = useRef(null)
  const ambientRef = useRef(null)

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    if (!contextRef.current) contextRef.current = new AudioCtx()
    if (contextRef.current.state === 'suspended') contextRef.current.resume().catch(() => {})
    return contextRef.current
  }, [])

  const chime = useCallback(
    (frequency = 528, duration = 0.35) => {
      if (!enabled) return
      try {
        const context = ensureContext()
        if (!context) return
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.0001, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.09, context.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + duration + 0.05)
      } catch {
        // Sound is optional — never break the session because of it.
      }
    },
    [enabled, ensureContext]
  )

  const startAmbient = useCallback(() => {
    if (!enabled || ambientRef.current) return
    try {
      const context = ensureContext()
      if (!context) return
      const gain = context.createGain()
      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.028, context.currentTime + 2)
      gain.connect(context.destination)

      const oscillators = [174, 261.6].map((frequency, index) => {
        const oscillator = context.createOscillator()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        oscillator.detune.value = index === 0 ? -6 : 6
        oscillator.connect(gain)
        oscillator.start()
        return oscillator
      })

      ambientRef.current = { gain, oscillators, context }
    } catch {
      ambientRef.current = null
    }
  }, [enabled, ensureContext])

  const stopAmbient = useCallback(() => {
    const ambient = ambientRef.current
    if (!ambient) return
    try {
      ambient.gain.gain.exponentialRampToValueAtTime(0.0001, ambient.context.currentTime + 0.6)
      ambient.oscillators.forEach((oscillator) => oscillator.stop(ambient.context.currentTime + 0.8))
    } catch {
      // Ignore — the graph is being torn down anyway.
    }
    ambientRef.current = null
  }, [])

  useEffect(
    () => () => {
      stopAmbient()
      contextRef.current?.close?.().catch(() => {})
      contextRef.current = null
    },
    [stopAmbient]
  )

  return { chime, startAmbient, stopAmbient }
}

/** `Inhale 4 · Hold 4 · Exhale 4 · Hold 4` */
function patternLine(pattern) {
  return pattern.phases.map((phase) => `${phase.label} ${phase.seconds}`).join(' · ')
}

export default function BreathingStudio() {
  const { user } = useAuth()
  const toast = useToast()

  const [patternKey, setPatternKey] = useState('box')
  const [durationMinutes, setDurationMinutes] = useState(3)
  const [soundOn, setSoundOn] = useState(user?.preferences?.soundEnabled !== false)
  const [ambientOn, setAmbientOn] = useState(false)
  const [running, setRunning] = useState(false)

  const [phaseIndex, setPhaseIndex] = useState(0)
  const [phaseRemaining, setPhaseRemaining] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [finished, setFinished] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [saveError, setSaveError] = useState('')

  const [meditationKey, setMeditationKey] = useState(MEDITATION_SESSIONS[0].key)
  const [meditationStep, setMeditationStep] = useState(0)
  const [meditationRunning, setMeditationRunning] = useState(false)
  const [meditationElapsed, setMeditationElapsed] = useState(0)
  const [meditationFinished, setMeditationFinished] = useState(false)
  const [meditationSaving, setMeditationSaving] = useState(false)

  const pattern = useMemo(
    () => BREATHING_PATTERNS.find((item) => item.key === patternKey) || BREATHING_PATTERNS[0],
    [patternKey]
  )
  const meditation = useMemo(
    () => MEDITATION_SESSIONS.find((item) => item.key === meditationKey) || MEDITATION_SESSIONS[0],
    [meditationKey]
  )

  const totalSeconds = durationMinutes * 60
  const currentPhase = pattern.phases[phaseIndex] || pattern.phases[0]
  const { chime, startAmbient, stopAmbient } = useAudio(soundOn)

  const resetBreathing = useCallback(() => {
    setRunning(false)
    setFinished(false)
    setPhaseIndex(0)
    setPhaseRemaining(pattern.phases[0].seconds)
    setElapsed(0)
    setCycles(0)
    setSaveState('idle')
    setSaveError('')
  }, [pattern])

  // Prepare the first phase whenever the pattern changes.
  useEffect(() => {
    setRunning(false)
    setFinished(false)
    setPhaseIndex(0)
    setPhaseRemaining(pattern.phases[0].seconds)
    setElapsed(0)
    setCycles(0)
    setSaveState('idle')
    setSaveError('')
  }, [pattern])

  // The breathing heartbeat.
  useEffect(() => {
    if (!running || finished) return undefined

    const id = window.setInterval(() => {
      setElapsed((value) => value + 1)

      setPhaseRemaining((value) => {
        if (value > 1) return value - 1

        // Move to the next phase, wrapping into a new cycle at the end.
        setPhaseIndex((currentIndex) => {
          const nextIndex = (currentIndex + 1) % pattern.phases.length
          if (nextIndex === 0) setCycles((count) => count + 1)
          chime(nextIndex === 0 ? 528 : 396, 0.3)
          return nextIndex
        })

        return 0
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [running, finished, pattern, chime])

  // Whenever the phase index changes, arm the next countdown.
  useEffect(() => {
    if (!running || finished) return
    const seconds = pattern.phases[phaseIndex]?.seconds || 0
    setPhaseRemaining((value) => (value <= 0 ? seconds : value))
  }, [phaseIndex, running, finished, pattern])

  // Session length reached.
  useEffect(() => {
    if (elapsed < totalSeconds || finished) return
    setFinished(true)
    setRunning(false)
    stopAmbient()
    setAmbientOn(false)
    chime(660, 0.6)
  }, [elapsed, totalSeconds, finished, chime, stopAmbient])

  const toggleBreathing = () => {
    if (finished) {
      resetBreathing()
      setRunning(true)
      return
    }
    setRunning((value) => !value)
  }

  // Ambient sound follows the play/pause state.
  useEffect(() => {
    if (ambientOn && running) startAmbient()
    else stopAmbient()
  }, [ambientOn, running, startAmbient, stopAmbient])

  // The circle only grows on an inhale and shrinks on an exhale — holds keep
  // whatever size the last breath left it at.
  const [circleScale, setCircleScale] = useState(0.96)
  useEffect(() => {
    const label = String(currentPhase?.label || '').toLowerCase()
    if (label.startsWith('inhale')) setCircleScale(1.2)
    else if (label.startsWith('exhale')) setCircleScale(0.72)
  }, [currentPhase])

  const saveBreathingSession = async () => {
    setSaveState('saving')
    setSaveError('')
    try {
      const { data, message } = await progressService.saveSession({
        title: `${pattern.name} · ${durationMinutes} min`,
        type: 'breathing',
        durationMinutes: Math.max(1, Math.round(elapsed / 60)),
        completedPoses: [],
      })
      toast.success(message || 'Breathing session saved.')
      ;(data?.newlyEarned || []).forEach((badge) =>
        toast.success(`Badge unlocked: ${badge.name}`, { title: 'Milestone reached' })
      )
      setSaveState('saved')
    } catch (error) {
      setSaveError(getErrorMessage(error, 'We could not save this session.'))
      setSaveState('error')
    }
  }

  // ---------------------------------------------------------------- //
  // Guided meditation                                               //
  // ---------------------------------------------------------------- //
  const secondsPerStep = Math.round((meditation.minutes * 60) / meditation.steps.length)

  useEffect(() => {
    setMeditationStep(0)
    setMeditationElapsed(0)
    setMeditationRunning(false)
    setMeditationFinished(false)
  }, [meditation])

  useEffect(() => {
    if (!meditationRunning || meditationFinished) return undefined
    const id = window.setInterval(() => setMeditationElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [meditationRunning, meditationFinished])

  const meditationTotal = meditation.steps.length * secondsPerStep
  const currentMeditationStep = Math.min(meditation.steps.length - 1, Math.floor(meditationElapsed / secondsPerStep))

  useEffect(() => {
    if (meditationElapsed < meditationTotal || meditationFinished) return
    setMeditationFinished(true)
    setMeditationRunning(false)
    chime(660, 0.6)
  }, [meditationElapsed, meditationTotal, meditationFinished, chime])

  const saveMeditationSession = async () => {
    setMeditationSaving(true)
    try {
      const { data, message } = await progressService.saveSession({
        title: meditation.name,
        type: 'meditation',
        durationMinutes: meditation.minutes,
        completedPoses: [],
      })
      toast.success(message || 'Meditation session saved.')
      ;(data?.newlyEarned || []).forEach((badge) =>
        toast.success(`Badge unlocked: ${badge.name}`, { title: 'Milestone reached' })
      )
    } catch (error) {
      toast.error(getErrorMessage(error, 'We could not save that session.'))
    } finally {
      setMeditationSaving(false)
    }
  }

  const noHoldPattern = BREATHING_PATTERNS.find((item) => item.key === 'diaphragmatic')

  return (
    <div className="container-x section">
      <SectionHeading
        eyebrow="Breathing & meditation studio"
        title="Slow the breath, steady the mind"
        description="Follow the animated circle through box breathing, gentle diaphragmatic breathing, relaxing breath or a sleep preparation pattern — then finish with a short guided meditation if you have time."
      />

      {/* ------------------------------------------------------------ */}
      {/* Breathing studio                                             */}
      {/* ------------------------------------------------------------ */}
      <FadeIn className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div>
              <p className="eyebrow">Now practising</p>
              <h2 className="text-lg font-semibold text-ink">{pattern.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAmbientOn((value) => !value)}
                aria-pressed={ambientOn}
                className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                  ambientOn ? 'border-lavender-400 bg-lavender-50 text-lavender-700 dark:bg-lavender-900/50 dark:text-lavender-100' : 'border-line bg-card text-muted'
                }`}
                title={ambientOn ? 'Ambient sound on' : 'Ambient sound off'}
                aria-label={ambientOn ? 'Turn ambient sound off' : 'Turn ambient sound on'}
              >
                <Moon size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSoundOn((value) => !value)}
                aria-pressed={soundOn}
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-ink"
                title={soundOn ? 'Cue sounds on' : 'Cue sounds off'}
                aria-label={soundOn ? 'Disable cue sounds' : 'Enable cue sounds'}
              >
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="flex flex-col items-center">
              <div className="relative grid h-64 w-64 place-items-center">
                <motion.span
                  aria-hidden="true"
                  animate={{ scale: running || finished ? circleScale : 0.96, opacity: running ? 0.9 : 0.6 }}
                  transition={{ duration: Math.max(2, currentPhase?.seconds || 4), ease: 'easeInOut' }}
                  className="absolute h-56 w-56 rounded-full bg-gradient-to-br from-sage-300/70 via-lavender-300/60 to-cream-200/70 blur-[2px] dark:from-sage-700/70 dark:via-lavender-800/60 dark:to-sage-900/70"
                />
                <motion.span
                  aria-hidden="true"
                  animate={{ scale: running || finished ? circleScale : 0.96 }}
                  transition={{ duration: Math.max(2, currentPhase?.seconds || 4), ease: 'easeInOut' }}
                  className="absolute h-44 w-44 rounded-full border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                />
                <div className="relative flex flex-col items-center text-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted" aria-live="polite">
                    {finished ? 'Complete' : currentPhase?.label}
                  </span>
                  <span className="font-display text-5xl font-semibold text-ink">
                    {finished ? '✓' : Math.max(0, phaseRemaining)}
                  </span>
                  <span className="mt-1 text-xs text-muted">
                    {finished ? 'well done' : `${cycles} cycle${cycles === 1 ? '' : 's'}`}
                  </span>
                </div>
              </div>

              <div className="mt-6 w-full max-w-md">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{formatSeconds(elapsed)} of {formatDuration(durationMinutes)}</span>
                  <span>{Math.round((elapsed / Math.max(1, totalSeconds)) * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-sage-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sage-500 to-lavender-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((elapsed / Math.max(1, totalSeconds)) * 100))}%` }}
                  />
                </div>
                <p className="mt-3 text-center text-xs text-muted">{patternLine(pattern)}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={toggleBreathing} className="btn-primary btn-lg">
                  {finished ? (
                    <>
                      <RotateCcw size={17} aria-hidden="true" /> Start again
                    </>
                  ) : running ? (
                    <>
                      <Pause size={17} aria-hidden="true" /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={17} aria-hidden="true" /> {elapsed > 0 ? 'Resume' : 'Start breathing'}
                    </>
                  )}
                </button>
                <button type="button" onClick={resetBreathing} className="btn-outline">
                  <RotateCcw size={16} aria-hidden="true" /> Reset
                </button>
              </div>

              {!running && elapsed > 0 && !finished && (
                <p className="mt-3 text-xs text-muted">Paused — take your time. Nothing is being recorded yet.</p>
              )}
            </div>

            {/* Completion screen */}
            <AnimatePresence>
              {finished && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 rounded-3xl border border-line bg-sage-50/70 p-5 text-center dark:bg-sage-900/30"
                >
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100">
                    <Check size={22} aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">Breathing session complete</h3>
                  <p className="mt-1 text-sm text-muted">
                    {formatDuration(Math.max(1, Math.round(elapsed / 60)))} of {pattern.name.toLowerCase()} across {cycles}{' '}
                    cycle{cycles === 1 ? '' : 's'}. Notice how your shoulders feel.
                  </p>

                  {saveError && (
                    <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                      {saveError}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={saveBreathingSession}
                      disabled={saveState === 'saving' || saveState === 'saved'}
                      className="btn-primary"
                    >
                      {saveState === 'saving' ? (
                        'Saving…'
                      ) : saveState === 'saved' ? (
                        <>
                          <Check size={16} aria-hidden="true" /> Saved
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} aria-hidden="true" /> Save to my progress
                        </>
                      )}
                    </button>
                    <Link to="/progress" className="btn-outline">
                      View progress
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Settings + guidance */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-ink">Choose a pattern</h2>
            <div className="mt-4 space-y-2">
              {BREATHING_PATTERNS.map((item) => {
                const active = item.key === patternKey
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPatternKey(item.key)}
                    aria-pressed={active}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/50' : 'border-line bg-card hover:border-sage-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Wind size={15} aria-hidden="true" /> {item.name}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{item.description}</span>
                    <span className="mt-1.5 block text-[11px] font-medium text-sage-700 dark:text-sage-300">
                      {item.phases.map((phase) => `${phase.label} ${phase.seconds}s`).join(' · ')}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5">
              <p className="label">Session length</p>
              <div className="flex flex-wrap gap-2">
                {DURATION_CHOICES.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setDurationMinutes(minutes)}
                    aria-pressed={durationMinutes === minutes}
                    className={`chip ${durationMinutes === minutes ? 'chip-active' : ''}`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-lavender-200 bg-lavender-50/70 p-6 dark:border-lavender-800 dark:bg-lavender-950/30">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-lavender-600 dark:text-lavender-300" aria-hidden="true" />
              <h2 className="text-base font-semibold text-ink">Breath holds not for you?</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{pattern.note}</p>
            {patternKey !== 'diaphragmatic' && (
              <button
                type="button"
                onClick={() => setPatternKey(noHoldPattern.key)}
                className="btn-outline btn-sm mt-4"
              >
                <Leaf size={14} aria-hidden="true" /> Switch to a no-hold pattern
              </button>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Never force a breath. If you feel light-headed, stop, breathe normally and sit quietly for a minute.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* ------------------------------------------------------------ */}
      {/* Guided meditation                                            */}
      {/* ------------------------------------------------------------ */}
      <section className="mt-16">
        <SectionHeading
          eyebrow="Guided practice"
          title="Meditation, relaxation & sleep preparation"
          description="Short guided sessions you can follow with your eyes closed. Pick one, press play and let the steps guide you."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            {MEDITATION_SESSIONS.map((session) => {
              const active = session.key === meditationKey
              return (
                <button
                  key={session.key}
                  type="button"
                  onClick={() => setMeditationKey(session.key)}
                  aria-pressed={active}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    active ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/40' : 'border-line bg-card hover:border-lavender-300'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{session.name}</span>
                    <span className="chip">{session.minutes} min</span>
                  </span>
                  <span className="mt-1 block text-xs text-muted">{session.description}</span>
                </button>
              )
            })}
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Guided session</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-ink">{meditation.name}</h3>
              </div>
              <span className="chip">{formatDuration(meditation.minutes)}</span>
            </div>

            <div className="mt-6 rounded-3xl border border-line bg-surface/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Step {Math.min(meditation.steps.length, currentMeditationStep + 1)} of {meditation.steps.length}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${meditation.key}-${currentMeditationStep}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 font-display text-lg leading-relaxed text-ink"
                  aria-live="polite"
                >
                  {meditationFinished
                    ? 'Session complete. Take one more slow breath before you open your eyes.'
                    : meditation.steps[currentMeditationStep]}
                </motion.p>
              </AnimatePresence>

              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-lavender-100 dark:bg-lavender-900/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-sage-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((meditationElapsed / Math.max(1, meditationTotal)) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {formatSeconds(Math.min(meditationElapsed, meditationTotal))} of {formatDuration(meditation.minutes)}
                {!meditationFinished && meditationRunning
                  ? ` · next step in ${Math.max(0, secondsPerStep - (meditationElapsed % secondsPerStep))}s`
                  : ''}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (meditationFinished) {
                    setMeditationElapsed(0)
                    setMeditationFinished(false)
                    setMeditationRunning(true)
                    return
                  }
                  setMeditationRunning((value) => !value)
                }}
                className="btn-secondary"
              >
                {meditationFinished ? (
                  <>
                    <RotateCcw size={16} aria-hidden="true" /> Restart
                  </>
                ) : meditationRunning ? (
                  <>
                    <Pause size={16} aria-hidden="true" /> Pause
                  </>
                ) : (
                  <>
                    <Play size={16} aria-hidden="true" /> {meditationElapsed > 0 ? 'Resume' : 'Begin'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMeditationElapsed((value) => Math.max(0, (currentMeditationStep - 1) * secondsPerStep))}
                disabled={meditationElapsed === 0}
                className="btn-ghost btn-sm"
              >
                <ChevronLeft size={15} aria-hidden="true" /> Previous step
              </button>
              <button
                type="button"
                onClick={() =>
                  setMeditationElapsed((value) =>
                    Math.min(meditationTotal, (currentMeditationStep + 2) * secondsPerStep)
                  )
                }
                disabled={meditationFinished}
                className="btn-ghost btn-sm"
              >
                Next step <ChevronRight size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMeditationRunning(false)
                  setMeditationElapsed(0)
                  setMeditationFinished(false)
                }}
                className="btn-ghost btn-sm"
              >
                <RotateCcw size={14} aria-hidden="true" /> Reset
              </button>
            </div>

            {meditationFinished && (
              <div className="mt-5 rounded-2xl border border-line bg-sage-50/70 px-4 py-4 text-center dark:bg-sage-900/30">
                <p className="text-sm text-muted">Finished {meditation.name}. Save it to keep your streak going?</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={saveMeditationSession}
                    disabled={meditationSaving}
                    className="btn-primary btn-sm"
                  >
                    {meditationSaving ? (
                      'Saving…'
                    ) : (
                      <>
                        <Sparkles size={14} aria-hidden="true" /> Save to my progress
                      </>
                    )}
                  </button>
                  <Link to="/progress" className="btn-outline btn-sm">
                    View progress
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <FadeIn className="mt-12">
        <div className="card flex flex-col gap-3 border-amber-200 bg-amber-50/70 p-6 dark:border-amber-800 dark:bg-amber-950/30 sm:flex-row sm:items-start">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-ink">A note on breathing practice</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Breath work is generally safe and calming, but it is not a treatment for any medical or mental-health
              condition. If you are pregnant, have a respiratory or heart condition, or feel unwell, speak to a qualified
              professional before practising longer holds. Stop immediately if you feel dizzy or short of breath.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
