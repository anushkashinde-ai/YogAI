import YogaPose from '../models/YogaPose.js'
import ApiError from '../utils/ApiError.js'
import { INTENSITIES, EXPERIENCE_LEVELS } from '../config/constants.js'

/**
 * Rule-based, fully transparent routine generator.
 * Every threshold lives here so the algorithm can be tuned without touching
 * the controllers, and so it can be swapped for a smarter model later.
 */

export const ALGORITHM_VERSION = 'rule-based-v1'

/** Which pose categories serve which wellness goal (ordered by weight). */
const GOAL_CATEGORY_MAP = {
  flexibility: ['forward-bend', 'seated', 'twist', 'standing'],
  strength: ['standing', 'core', 'balance'],
  'stress-relief': ['restorative', 'forward-bend', 'seated'],
  'weight-management': ['standing', 'core', 'balance'],
  'better-sleep': ['restorative', 'seated', 'forward-bend'],
  focus: ['balance', 'standing', 'seated'],
  posture: ['backbend', 'standing', 'core'],
  'general-wellness': ['standing', 'seated', 'forward-bend', 'twist', 'balance'],
}

/** Difficulty tiers unlocked by experience level. */
const EXPERIENCE_DIFFICULTY = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
}

/** Intensity shapes hold length, rest length and how many poses we pack in. */
const INTENSITY_PROFILE = {
  gentle: { holdMultiplier: 1.25, restSeconds: 20, poseDensity: 0.75 },
  moderate: { holdMultiplier: 1, restSeconds: 12, poseDensity: 0.9 },
  energetic: { holdMultiplier: 0.85, restSeconds: 8, poseDensity: 1.05 },
}

/** Share of the session spent in each phase. */
const PHASE_SPLIT = { warmUp: 0.2, main: 0.62, coolDown: 0.18 }

const MIN_HOLD_SECONDS = 20
const MAX_HOLD_SECONDS = 90

const WARM_UP_CATEGORIES = ['seated', 'forward-bend', 'standing']
const COOL_DOWN_CATEGORIES = ['restorative', 'seated', 'forward-bend']

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Score a pose for a given request — higher is a better match. */
function scorePose(pose, { categories, difficultyTier, focusAreas }) {
  let score = 0

  const categoryRank = categories.indexOf(pose.category)
  if (categoryRank === -1) score += 4
  else if (categoryRank === 0) score += 60
  else if (categoryRank === 1) score += 42
  else if (categoryRank === 2) score += 30
  else score += 20

  // Prefer the difficulty tier the user is closest to.
  const tierIndex = difficultyTier.indexOf(pose.difficulty)
  if (tierIndex === difficultyTier.length - 1) score += 8
  else if (tierIndex === 0) score += 4

  if (focusAreas?.includes(pose.category)) score += 25

  // Slight preference for poses with richer guidance.
  score += Math.min((pose.instructions?.length || 0) * 1.5, 9)

  return score
}

function pickPhasePoses(pool, { count, budgetSeconds, usedIds, intensity }) {
  const profile = INTENSITY_PROFILE[intensity] || INTENSITY_PROFILE.moderate
  const picked = []
  let remaining = budgetSeconds

  for (const pose of pool) {
    if (picked.length >= count) break
    if (usedIds.has(String(pose._id))) continue

    const holdSeconds = clamp(
      Math.round((pose.duration || 30) * profile.holdMultiplier),
      MIN_HOLD_SECONDS,
      MAX_HOLD_SECONDS
    )

    if (remaining < holdSeconds) {
      // Not enough budget left for a full hold — stop unless we have nothing.
      if (picked.length > 0) break
    }

    picked.push({
      pose,
      durationSeconds: holdSeconds,
      restSeconds: profile.restSeconds,
    })
    usedIds.add(String(pose._id))
    remaining -= holdSeconds + profile.restSeconds
  }

  return picked
}

function toRoutinePose({ pose, durationSeconds, restSeconds }, part) {
  return {
    pose: pose._id,
    durationSeconds,
    restSeconds,
    part,
    notes: pose.breathingInstructions?.[0] || '',
  }
}

/**
 * Build a personalised routine. Returns a plain object (not persisted) so the
 * caller decides whether to save it.
 */
export async function generateRoutine(input = {}) {
  const experienceLevel = EXPERIENCE_LEVELS.includes(input.experienceLevel)
    ? input.experienceLevel
    : 'beginner'
  const intensity = INTENSITIES.includes(input.intensity) ? input.intensity : 'moderate'
  const goal = GOAL_CATEGORY_MAP[input.goal] ? input.goal : 'general-wellness'
  const durationMinutes = clamp(Number(input.durationMinutes) || 20, 5, 120)
  const focusAreas = Array.isArray(input.focusAreas)
    ? input.focusAreas.filter((area) => typeof area === 'string')
    : []
  const equipment = Array.isArray(input.equipment) ? input.equipment : []

  const categories = [
    ...focusAreas,
    ...GOAL_CATEGORY_MAP[goal].filter((category) => !focusAreas.includes(category)),
  ]
  const difficultyTier = EXPERIENCE_DIFFICULTY[experienceLevel]

  const allPoses = await YogaPose.find({ difficulty: { $in: difficultyTier } }).lean()
  if (allPoses.length === 0) {
    throw ApiError.notFound(
      'The pose library is empty for this experience level. Run `npm run seed` in the server folder first.'
    )
  }

  const ranked = shuffle(allPoses)
    .map((pose) => ({ pose, score: scorePose(pose, { categories, difficultyTier, focusAreas }) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.pose)

  const totalSeconds = durationMinutes * 60
  const profile = INTENSITY_PROFILE[intensity]

  const warmUpPool = ranked.filter((pose) => WARM_UP_CATEGORIES.includes(pose.category))
  const coolDownPool = ranked.filter((pose) => COOL_DOWN_CATEGORIES.includes(pose.category))
  const mainPool = ranked

  const usedIds = new Set()

  const warmUp = pickPhasePoses(warmUpPool.length ? warmUpPool : ranked, {
    count: 2,
    budgetSeconds: Math.round(totalSeconds * PHASE_SPLIT.warmUp),
    usedIds,
    intensity: 'gentle',
  })

  const main = pickPhasePoses(mainPool, {
    count: Math.max(3, Math.round((totalSeconds * PHASE_SPLIT.main) / 60) + 2),
    budgetSeconds: Math.round(totalSeconds * PHASE_SPLIT.main * profile.poseDensity),
    usedIds,
    intensity,
  })

  const coolDown = pickPhasePoses(coolDownPool.length ? coolDownPool : ranked, {
    count: 2,
    budgetSeconds: Math.round(totalSeconds * PHASE_SPLIT.coolDown),
    usedIds,
    intensity: 'gentle',
  })

  if (main.length === 0 && warmUp.length === 0) {
    throw ApiError.badRequest('Could not build a routine from the current pose library. Please try a longer duration.')
  }

  const poses = [
    ...warmUp.map((entry) => toRoutinePose(entry, 'warm-up')),
    ...main.map((entry) => toRoutinePose(entry, 'main')),
    ...coolDown.map((entry) => toRoutinePose(entry, 'cool-down')),
  ]

  const actualSeconds = poses.reduce(
    (sum, pose) => sum + pose.durationSeconds + pose.restSeconds,
    0
  )

  const goalLabel = goal.replace(/-/g, ' ')
  const title = `${durationMinutes}-minute ${goalLabel} flow`
  const description = `A ${intensity} ${goalLabel} session for ${experienceLevel} practitioners. ${
    warmUp.length
  } warm-up pose(s), ${main.length} main pose(s) and ${coolDown.length} cool-down pose(s), generated by YogAI's rule-based planner.`

  const breathingReminders = [
    'Match the length of your exhale to your inhale — never strain the breath.',
    'If a hold feels like too much, come out early. That is still a complete practice.',
  ]

  if (equipment.includes('blocks')) {
    breathingReminders.push('Use your blocks to bring the floor closer instead of forcing a stretch.')
  }
  if (equipment.includes('strap')) {
    breathingReminders.push('A strap keeps the shoulders relaxed in forward folds and seated stretches.')
  }

  return {
    title,
    description,
    goal,
    difficulty: experienceLevel === 'advanced' ? 'advanced' : experienceLevel === 'intermediate' ? 'intermediate' : 'beginner',
    intensity,
    durationMinutes,
    poses,
    warmUp: [
      'Settle onto the mat and take 5 slow breaths.',
      'Warm the spine with gentle Cat-Cow before the first hold.',
    ],
    coolDown: [
      'Finish with 3 minutes in Corpse Pose, letting the breath return to normal.',
      'Notice one thing that felt good today before you leave the mat.',
    ],
    breathingReminders,
    equipment,
    tags: [goal, intensity, experienceLevel],
    source: 'generated',
    meta: {
      algorithm: ALGORITHM_VERSION,
      poseCount: poses.length,
      estimatedMinutes: Math.round(actualSeconds / 60),
      phases: { warmUp: warmUp.length, main: main.length, coolDown: coolDown.length },
    },
  }
}

export default { generateRoutine, ALGORITHM_VERSION }
