/**
 * Shared enums + catalogues used by models, controllers and services.
 * Keeping them in one place guarantees the API and the UI agree on values.
 */

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced']

export const YOGA_GOALS = [
  'flexibility',
  'strength',
  'stress-relief',
  'weight-management',
  'better-sleep',
  'focus',
  'posture',
  'general-wellness',
]

export const POSE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export const POSE_CATEGORIES = [
  'standing',
  'seated',
  'backbend',
  'forward-bend',
  'twist',
  'balance',
  'inversion',
  'restorative',
  'core',
]

export const INTENSITIES = ['gentle', 'moderate', 'energetic']

export const SESSION_PARTS = ['warm-up', 'main', 'cool-down', 'breathing', 'meditation']

export const MOODS = [
  'stressed',
  'tired',
  'energetic',
  'unfocused',
  'calm',
  'gentle-movement',
]

export const MODERATION_STATUS = ['pending', 'approved', 'rejected', 'flagged']

export const BREATHING_PATTERNS = ['box', 'diaphragmatic', 'relaxation', 'sleep']

/**
 * Achievement catalogue. `criteria` is intentionally data-driven so the
 * achievement service can evaluate progress generically.
 *
 * type:
 *  - sessions     → total completed sessions
 *  - streak       → consecutive practice days
 *  - minutes      → total practice minutes
 *  - category     → completed poses in a category
 *  - breathing    → completed breathing sessions
 *  - timeOfDay    → completed a session before 9am
 */
export const ACHIEVEMENTS = [
  {
    key: 'first-session',
    name: 'First Yoga Session',
    description: 'Complete your very first practice session on YogAI.',
    icon: 'sparkles',
    color: 'sage',
    criteria: { type: 'sessions', target: 1 },
  },
  {
    key: 'five-day-streak',
    name: 'Five-Day Practice Streak',
    description: 'Practise on five consecutive days.',
    icon: 'flame',
    color: 'lavender',
    criteria: { type: 'streak', target: 5 },
  },
  {
    key: 'breathing-beginner',
    name: 'Breathing Beginner',
    description: 'Finish your first guided breathing session.',
    icon: 'wind',
    color: 'sky',
    criteria: { type: 'breathing', target: 1 },
  },
  {
    key: 'balance-builder',
    name: 'Balance Builder',
    description: 'Complete 5 balance poses across your sessions.',
    icon: 'footprints',
    color: 'amber',
    criteria: { type: 'category', target: 5, category: 'balance' },
  },
  {
    key: 'mindful-morning',
    name: 'Mindful Morning',
    description: 'Complete a session before 9:00 AM.',
    icon: 'sunrise',
    color: 'cream',
    criteria: { type: 'timeOfDay', target: 1, beforeHour: 9 },
  },
  {
    key: 'ten-sessions',
    name: 'Ten Sessions Completed',
    description: 'Reach a total of 10 completed practice sessions.',
    icon: 'medal',
    color: 'sage',
    criteria: { type: 'sessions', target: 10 },
  },
  {
    key: 'hundred-minutes',
    name: '100 Mindful Minutes',
    description: 'Accumulate 100 minutes of total practice time.',
    icon: 'clock',
    color: 'lavender',
    criteria: { type: 'minutes', target: 100 },
  },
  {
    key: 'thirty-day-streak',
    name: 'Thirty-Day Streak',
    description: 'Build an unbroken 30-day practice habit.',
    icon: 'trophy',
    color: 'amber',
    criteria: { type: 'streak', target: 30 },
  },
]

export const ACHIEVEMENT_KEYS = ACHIEVEMENTS.map((item) => item.key)

/**
 * Mood → recommendation rules. Deliberately transparent and rule-based.
 * This is a wellness suggestion engine, NOT a diagnostic tool.
 */
export const MOOD_RULES = {
  stressed: {
    label: 'Stressed',
    summary: 'Slow, grounding practices to settle a busy nervous system.',
    categories: ['restorative', 'forward-bend', 'seated'],
    difficulties: ['beginner'],
    intensity: 'gentle',
    breathing: 'box',
    durationMinutes: 15,
  },
  tired: {
    label: 'Tired',
    summary: 'Gentle movement and breath work to restore energy without strain.',
    categories: ['restorative', 'seated', 'twist'],
    difficulties: ['beginner'],
    intensity: 'gentle',
    breathing: 'diaphragmatic',
    durationMinutes: 12,
  },
  energetic: {
    label: 'Energetic',
    summary: 'A stronger flow to channel your energy into steady strength.',
    categories: ['standing', 'core', 'balance'],
    difficulties: ['intermediate', 'advanced'],
    intensity: 'energetic',
    breathing: 'diaphragmatic',
    durationMinutes: 30,
  },
  unfocused: {
    label: 'Unfocused',
    summary: 'Balancing poses and steady breathing to sharpen attention.',
    categories: ['balance', 'standing'],
    difficulties: ['beginner', 'intermediate'],
    intensity: 'moderate',
    breathing: 'box',
    durationMinutes: 20,
  },
  calm: {
    label: 'Calm',
    summary: 'Maintain your steadiness with a balanced, mindful session.',
    categories: ['seated', 'forward-bend', 'twist'],
    difficulties: ['beginner', 'intermediate'],
    intensity: 'moderate',
    breathing: 'relaxation',
    durationMinutes: 20,
  },
  'gentle-movement': {
    label: 'Looking for gentle movement',
    summary: 'Soft, accessible movement to keep the body comfortable.',
    categories: ['restorative', 'seated', 'standing'],
    difficulties: ['beginner'],
    intensity: 'gentle',
    breathing: 'diaphragmatic',
    durationMinutes: 18,
  },
}

export const DEFAULT_PAGE_SIZE = 12
export const MAX_PAGE_SIZE = 60

/**
 * Community challenges. One is featured each ISO week (rotating), and users
 * may join any of them. Participation is stored on the User document.
 */
export const CHALLENGES = [
  {
    key: 'mindful-mornings',
    title: 'Mindful Mornings',
    description: 'Complete 3 practice sessions before 9 AM this week.',
    target: 3,
    unit: 'morning sessions',
    focus: 'morningSessions',
  },
  {
    key: 'balance-week',
    title: 'Balance Week',
    description: 'Hold 5 balance poses across the week — wobbling counts.',
    target: 5,
    unit: 'balance poses',
    focus: 'category:balance',
  },
  {
    key: 'breathe-easy',
    title: 'Breathe Easy',
    description: 'Finish 4 guided breathing sessions this week.',
    target: 4,
    unit: 'breathing sessions',
    focus: 'breathingSessions',
  },
  {
    key: 'consistency-club',
    title: 'Consistency Club',
    description: 'Practise on 4 different days this week.',
    target: 4,
    unit: 'practice days',
    focus: 'activeDays',
  },
]

/** ISO week key such as 2026-W42 — used to scope weekly challenge progress. */
export function currentWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNumber = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3)
  const week = 1 + Math.round((target - firstThursday) / (7 * 24 * 60 * 60 * 1000))
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

