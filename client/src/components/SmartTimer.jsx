import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Clock,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { formatSeconds } from '../utils/format.js'

/**
 * Smart Yoga Timer.
 *
 * Runs a routine through preparation → pose → rest → pose … → completion.
 * Everything happens in the browser: the parent is only told about the session
 * when the user chooses to save it.
 *
 * Props
 *  - routine:      { title, poses: [{ pose: poseDoc|id, durationSeconds, restSeconds, part, notes }] }
 *  - onComplete:   async (summary) => void  — called when the user saves the summary
 *  - onExit:       () => void
 *  - onClose:      () => void               — closes the timer without saving
 *  - prepSeconds:  preparation countdown length (default 5)
 *  - soundEnabled: initial sound preference (default true)
 */

const PREP_LABEL = 'Get ready'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Tiny Web Audio chime — no audio files, no external requests. */
function useChime(enabled) {
  const contextRef = useRef(null)

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    if (!contextRef.current) contextRef.current = new AudioCtx()
    if (contextRef.current.state === 'suspended') contextRef.current.resume().catch(() => {})
    return contextRef.current
  }, [])

  const play = useCallback(
    (frequency = 660, duration = 0.18) => {
      if (!enabled) return
      try {
        const context = ensureContext()
        if (!context) return
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.0001, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + duration + 0.02)
      } catch {
        // Audio is a nice-to-have — never let it break the session.
      }
    },
    [enabled, ensureContext]
  )

  useEffect(
    () => () => {
      contextRef.current?.close?.().catch(() => {})
      contextRef.current = null
    },
    []
  )

  return play
}

export default function SmartTimer({
  routine,
  onComplete,
  onExit,
  prepSeconds = 5,
  soundEnabled = true,
  className = '',
}) {
  const entries = useMemo(
    () =>
      (routine?.poses || []).map((entry, index) => {
        const pose = entry?.pose && typeof entry.pose === 'object' ? entry.pose : null
        return {
          key: `${pose?._id || entry?.pose || index}-${index}`,
          poseId: pose?._id || (typeof entry?.pose === 'string' ? entry.pose : null),
          name: pose?.name || entry?.name || `Pose ${index + 1}`,
          category: pose?.category || entry?.category || '',
          imageUrl: pose?.imageUrl || '',
          durationSeconds: clamp(Number(entry?.durationSeconds) || 30, 5, 900),
          restSeconds: clamp(Number(entry?.restSeconds) || 0, 0, 300),
          part: entry?.part || 'main',
          notes: entry?.notes || pose?.breathingInstructions?.[0] || '',
        }
      }),
    [routine]
  )

  const [phase, setPhase] = useState('prepare') // prepare | pose | rest | complete
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(prepSeconds)
  const [running, setRunning] = useState(true)
  const [sound, setSound] = useState(Boolean(soundEnabled))
  const [elapsed, setElapsed] = useState(0)
  const [completed, setCompleted] = useState([])
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState('')

  const completedRef = useRef([])
  const elapsedRef = useRef(0)
  const finishedRef = useRef(false)

  const chime = useChime(sound)

  const current = entries[index]

  const recordPose = useCallback((entry) => {
    if (!entry) return
    const item = {
      pose: entry.poseId || undefined,
      name: entry.name,
      category: entry.category,
      seconds: entry.durationSeconds,
    }
    completedRef.current = [...completedRef.current, item]
    setCompleted(completedRef.current)
  }, [])

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setPhase('complete')
    setRunning(false)
    setRemaining(0)
    chime(880, 0.4)
  }, [chime])

  const goToPose = useCallback(
    (nextIndex) => {
      const entry = entries[nextIndex]
      if (!entry) {
        finish()
        return
      }
      setIndex(nextIndex)
      setPhase('pose')
      setRemaining(entry.durationSeconds)
      setRunning(true)
      chime(620)
    },
    [entries, finish, chime]
  )

  /** Move the session forward. `record` decides whether the hold is logged. */
  const moveOn = useCallback(
    ({ record }) => {
      if (entries.length === 0) return
      if (phase === 'complete') return

      if (phase === 'prepare') {
        goToPose(0)
        return
      }

      const entry = entries[index]
      if (record && phase === 'pose') recordPose(entry)

      const isLast = index >= entries.length - 1
      const restAfter = phase === 'pose' ? entry?.restSeconds || 0 : 0

      if (!isLast && restAfter > 0) {
        setPhase('rest')
        setRemaining(restAfter)
        setRunning(true)
        chime(440, 0.14)
        return
      }
      if (isLast) {
        finish()
        return
      }
      goToPose(index + 1)
    },
    [entries, index, phase, goToPose, recordPose, finish, chime]
  )

  // The one-second heartbeat.
  useEffect(() => {
    if (!running || phase === 'complete' || entries.length === 0) return undefined

    const id = window.setInterval(() => {
      setRemaining((value) => value - 1)
      if (phase === 'pose') {
        elapsedRef.current += 1
        setElapsed(elapsedRef.current)
      }
    }, 1000)

    return () => window.clearInterval(id)
  }, [running, phase, entries.length])

  // When a phase's countdown reaches zero, advance (but only once per phase).
  const advancingRef = useRef(false)
  useEffect(() => {
    if (phase === 'complete' || entries.length === 0 || !running) return
    if (remaining > 0) {
      advancingRef.current = false
      return
    }
    if (advancingRef.current) return
    advancingRef.current = true
    moveOn({ record: phase === 'pose' })
  }, [remaining, running, phase, entries.length, moveOn])

  const restart = useCallback(() => {
    completedRef.current = []
    elapsedRef.current = 0
    finishedRef.current = false
    advancingRef.current = false
    setCompleted([])
    setElapsed(0)
    setIndex(0)
    setPhase('prepare')
    setRemaining(prepSeconds)
    setRunning(true)
    setSaveState('idle')
    setSaveError('')
    chime(520)
  }, [prepSeconds, chime])

  // Keyboard shortcuts: space = pause/resume, S = skip, R = restart.
  useEffect(() => {
    const handleKey = (event) => {
      const tag = event.target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) return

      if (event.code === 'Space') {
        event.preventDefault()
        setRunning((value) => !value)
      } else if (event.key === 's' || event.key === 'S') {
        moveOn({ record: false })
      } else if (event.key === 'r' || event.key === 'R') {
        restart()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [moveOn, restart])

  const handleSave = useCallback(async () => {
    if (!onComplete || saveState === 'saving' || saveState === 'saved') return
    setSaveState('saving')
    setSaveError('')
    try {
      await onComplete({
        routineId: routine?._id || null,
        title: routine?.title || 'Practice session',
        durationMinutes: Math.max(1, Math.round(completedRef.current.reduce((sum, item) => sum + item.seconds, 0) / 60)),
        completedPoses: completedRef.current,
        elapsedSeconds: elapsedRef.current,
      })
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      setSaveError(error?.message || 'We could not save this session.')
    }
  }, [onComplete, routine, saveState])

  if (entries.length === 0) {
    return (
      <div className={`card p-8 text-center ${className}`}>
        <h3 className="text-lg font-semibold text-ink">This routine has no poses yet</h3>
        <p className="mt-2 text-sm text-muted">Generate or pick a routine that contains at least one pose.</p>
        {onExit && (
          <button type="button" onClick={onExit} className="btn-outline mt-5">
            Go back
          </button>
        )}
      </div>
    )
  }

  const total = phase === 'prepare' ? prepSeconds : current?.durationSeconds || 1
  const progress = phase === 'complete' ? 1 : clamp(1 - remaining / total, 0, 1)
  const circumference = 2 * Math.PI * 86
  const nextEntry = entries[index + 1]

  const phaseTone =
    phase === 'prepare'
      ? 'from-lavender-400 to-lavender-600'
      : phase === 'rest'
        ? 'from-amber-300 to-amber-500'
        : 'from-sage-400 to-sage-600'

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="eyebrow">Smart timer</p>
          <h3 className="text-base font-semibold text-ink sm:text-lg">{routine?.title || 'Practice session'}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSound((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-ink"
            aria-pressed={sound}
            aria-label={sound ? 'Mute sound alerts' : 'Enable sound alerts'}
            title={sound ? 'Sound alerts on' : 'Sound alerts off'}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-ink"
              aria-label="Close the timer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase !== 'complete' ? (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 py-8"
          >
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
              {/* Countdown ring */}
              <div className="relative grid h-56 w-56 shrink-0 place-items-center">
                <svg viewBox="0 0 192 192" className="h-56 w-56 -rotate-90" aria-hidden="true">
                  <circle cx="96" cy="96" r="86" fill="none" strokeWidth="10" className="stroke-sage-100 dark:stroke-sage-800" />
                  <circle
                    cx="96"
                    cy="96"
                    r="86"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    className="transition-[stroke-dashoffset] duration-500 ease-linear"
                    stroke="url(#timerGradient)"
                  />
                  <defs>
                    <linearGradient id="timerGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#75a583" />
                      <stop offset="100%" stopColor="#8b68c7" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    {phase === 'prepare' ? PREP_LABEL : phase === 'rest' ? 'Rest' : current?.part || 'Hold'}
                  </span>
                  <span className="font-display text-5xl font-semibold text-ink" aria-live="polite">
                    {formatSeconds(Math.max(0, remaining))}
                  </span>
                  <span className="mt-1 text-xs text-muted">
                    {phase === 'prepare' ? 'coming up' : `pose ${index + 1} of ${entries.length}`}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-sm">
                <div
                  className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${phaseTone} px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white`}
                >
                  {phase === 'prepare' ? 'Preparation' : phase === 'rest' ? 'Rest interval' : 'Pose'}
                </div>

                <h4 className="mt-3 font-display text-2xl font-semibold text-ink">
                  {phase === 'rest' ? 'Breathe and reset' : current?.name}
                </h4>

                {phase !== 'rest' && current?.notes && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{current.notes}</p>
                )}

                {phase === 'rest' && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Let the breath return to normal. The next pose starts automatically.
                  </p>
                )}

                {nextEntry && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface/60 px-3 py-2.5">
                    <Clock size={15} className="shrink-0 text-muted" aria-hidden="true" />
                    <p className="text-xs text-muted">
                      <span className="font-semibold text-ink">Next:</span> {nextEntry.name} ·{' '}
                      {formatSeconds(nextEntry.durationSeconds)}
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-sage-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sage-500 to-lavender-500 transition-all duration-500"
                      style={{ width: `${Math.round((elapsed / Math.max(1, entries.reduce((s, e) => s + e.durationSeconds, 0))) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {formatSeconds(elapsed)} practised · {completed.length} pose{completed.length === 1 ? '' : 's'} done
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => setRunning((value) => !value)} className="btn-primary btn-lg">
                {running ? (
                  <>
                    <Pause size={17} aria-hidden="true" /> Pause
                  </>
                ) : (
                  <>
                    <Play size={17} aria-hidden="true" /> Resume
                  </>
                )}
              </button>
              <button type="button" onClick={() => moveOn({ record: false })} className="btn-outline">
                <SkipForward size={16} aria-hidden="true" /> Skip
              </button>
              <button type="button" onClick={restart} className="btn-ghost">
                <RotateCcw size={16} aria-hidden="true" /> Restart
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-muted">
              Shortcuts: <span className="font-semibold text-ink">Space</span> pause/resume ·{' '}
              <span className="font-semibold text-ink">S</span> skip · <span className="font-semibold text-ink">R</span> restart
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 py-8"
          >
            <div className="flex flex-col items-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100">
                <Check size={28} aria-hidden="true" />
              </span>
              <h4 className="mt-4 font-display text-2xl font-semibold text-ink">Session complete</h4>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                {completed.length} pose{completed.length === 1 ? '' : 's'} completed in{' '}
                {Math.max(1, Math.round(completed.reduce((sum, item) => sum + item.seconds, 0) / 60))} minutes. Notice how
                your body feels before you move on.
              </p>
            </div>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {completed.map((item, itemIndex) => (
                <li
                  key={`${item.name}-${itemIndex}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-surface/60 px-3 py-2 text-sm"
                >
                  <span className="truncate font-medium text-ink">{item.name}</span>
                  <span className="ml-3 shrink-0 text-xs text-muted">{formatSeconds(item.seconds)}</span>
                </li>
              ))}
            </ul>

            {completed.length === 0 && (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                No poses were completed, so there is nothing to save. Restart the session to practise along.
              </p>
            )}

            {saveError && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                {saveError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === 'saving' || saveState === 'saved' || completed.length === 0}
                className="btn-primary btn-lg"
              >
                {saveState === 'saving' ? (
                  'Saving…'
                ) : saveState === 'saved' ? (
                  <>
                    <Check size={17} aria-hidden="true" /> Saved to your progress
                  </>
                ) : (
                  <>
                    <Sparkles size={17} aria-hidden="true" /> Save this session
                  </>
                )}
              </button>
              <button type="button" onClick={restart} className="btn-outline">
                <RotateCcw size={16} aria-hidden="true" /> Practise again
              </button>
              {onExit && (
                <button type="button" onClick={onExit} className="btn-ghost">
                  Finish
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
