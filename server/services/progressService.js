import PracticeSession from '../models/PracticeSession.js'
import UserAchievement from '../models/UserAchievement.js'
import User from '../models/User.js'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants.js'

/** YYYY-MM-DD in UTC — used as the canonical "practice day" key. */
export function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function startOfDay(date) {
  const copy = new Date(date)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

function addDays(date, days) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

/**
 * Streak maths over the set of days on which a session was completed.
 * The current streak stays alive if the user practised today OR yesterday.
 */
export function calculateStreaks(completedDates) {
  const uniqueDays = [...new Set(completedDates.map(dayKey))].sort().reverse()
  if (uniqueDays.length === 0) return { currentStreak: 0, longestStreak: 0, lastPracticeDay: null }

  const today = dayKey(new Date())
  const yesterday = dayKey(addDays(new Date(), -1))

  let currentStreak = 0
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    currentStreak = 1
    for (let i = 1; i < uniqueDays.length; i += 1) {
      const expected = dayKey(addDays(new Date(`${uniqueDays[i - 1]}T00:00:00.000Z`), -1))
      if (uniqueDays[i] === expected) currentStreak += 1
      else break
    }
  }

  // Longest run anywhere in the history.
  let longestStreak = 1
  let run = 1
  const ascending = [...uniqueDays].reverse()
  for (let i = 1; i < ascending.length; i += 1) {
    const expected = dayKey(addDays(new Date(`${ascending[i - 1]}T00:00:00.000Z`), 1))
    if (ascending[i] === expected) {
      run += 1
      longestStreak = Math.max(longestStreak, run)
    } else {
      run = 1
    }
  }

  return { currentStreak, longestStreak, lastPracticeDay: uniqueDays[0] }
}

/**
 * Aggregate everything the progress dashboard + achievement engine need.
 */
export async function computeMetrics(userId) {
  const sessions = await PracticeSession.find({ userId })
    .select('durationMinutes completedPoses categories type completedAt routineId')
    .sort({ completedAt: -1 })
    .lean()

  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
  const totalPoses = sessions.reduce((sum, session) => sum + (session.completedPoses?.length || 0), 0)

  const { currentStreak, longestStreak, lastPracticeDay } = calculateStreaks(
    sessions.map((session) => session.completedAt)
  )

  const categoryCounts = {}
  sessions.forEach((session) => {
    ;(session.completedPoses || []).forEach((pose) => {
      if (!pose.category) return
      categoryCounts[pose.category] = (categoryCounts[pose.category] || 0) + 1
    })
  })

  const breathingSessions = sessions.filter((session) => session.type === 'breathing').length
  const meditationSessions = sessions.filter((session) => session.type === 'meditation').length
  const morningSessions = sessions.filter((session) => new Date(session.completedAt).getUTCHours() < 9).length
  const uniqueRoutines = new Set(
    sessions.filter((session) => session.routineId).map((session) => String(session.routineId))
  ).size

  return {
    totalSessions,
    totalMinutes,
    totalPoses,
    breathingSessions,
    meditationSessions,
    morningSessions,
    uniqueRoutines,
    currentStreak,
    longestStreak,
    lastPracticeDay,
    categoryCounts,
    sessions,
  }
}

/** Last `days` days of activity, oldest first — feeds the Recharts bar chart. */
export function buildActivitySeries(sessions, days = 7) {
  const today = startOfDay(new Date())
  const buckets = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset)
    buckets.push({
      date: dayKey(date),
      label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      minutes: 0,
      sessions: 0,
    })
  }

  const index = new Map(buckets.map((bucket) => [bucket.date, bucket]))

  sessions.forEach((session) => {
    const bucket = index.get(dayKey(session.completedAt))
    if (!bucket) return
    bucket.minutes += session.durationMinutes || 0
    bucket.sessions += 1
  })

  return buckets
}

/** Sessions completed in the current ISO week (Monday → today). */
export function sessionsThisWeek(sessions) {
  const now = new Date()
  const weekday = (now.getUTCDay() + 6) % 7 // Monday = 0
  const monday = startOfDay(addDays(now, -weekday))
  return sessions.filter((session) => new Date(session.completedAt) >= monday).length
}

/**
 * Full dashboard payload.
 */
export async function getProgressSummary(userId) {
  const [metrics, user, earned] = await Promise.all([
    computeMetrics(userId),
    User.findById(userId).populate('favoritePoses', 'name slug difficulty category imageUrl duration').lean(),
    UserAchievement.find({ userId })
      .populate('achievementId')
      .sort({ earnedAt: -1 })
      .lean(),
  ])

  const weekly = buildActivitySeries(metrics.sessions, 7)
  const weeklyGoal = user?.preferences?.weeklyGoalSessions || 4
  const completedThisWeek = sessionsThisWeek(metrics.sessions)

  const categoryMinutes = Object.entries(metrics.categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const recentSessions = metrics.sessions.slice(0, 10).map((session) => ({
    id: session._id,
    title: session.title,
    type: session.type,
    durationMinutes: session.durationMinutes,
    completedAt: session.completedAt,
    poseCount: session.completedPoses?.length || 0,
  }))

  return {
    totals: {
      sessions: metrics.totalSessions,
      minutes: metrics.totalMinutes,
      poses: metrics.totalPoses,
      routines: metrics.uniqueRoutines,
      breathingSessions: metrics.breathingSessions,
      meditationSessions: metrics.meditationSessions,
    },
    streak: {
      current: metrics.currentStreak,
      longest: metrics.longestStreak,
      lastPracticeDay: metrics.lastPracticeDay,
    },
    weekly,
    weeklyGoal: {
      target: weeklyGoal,
      completed: completedThisWeek,
      percent: weeklyGoal ? Math.min(100, Math.round((completedThisWeek / weeklyGoal) * 100)) : 0,
    },
    categoryMinutes,
    favoritePoses: user?.favoritePoses || [],
    achievements: earned
      .filter((item) => item.achievementId)
      .map((item) => ({
        id: item.achievementId._id,
        key: item.achievementId.key,
        name: item.achievementId.name,
        description: item.achievementId.description,
        icon: item.achievementId.icon,
        color: item.achievementId.color,
        earnedAt: item.earnedAt,
      })),
    recentSessions,
    averageSessionMinutes: metrics.totalSessions
      ? Math.round(metrics.totalMinutes / metrics.totalSessions)
      : 0,
  }
}

/** Paginated practice history. */
export async function getPracticeHistory(userId, { page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const safePage = Math.max(Number(page) || 1, 1)
  const skip = (safePage - 1) * safeLimit

  const [items, total] = await Promise.all([
    PracticeSession.find({ userId })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('routineId', 'title goal difficulty')
      .lean(),
    PracticeSession.countDocuments({ userId }),
  ])

  return {
    items,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  }
}

export default {
  computeMetrics,
  calculateStreaks,
  buildActivitySeries,
  getProgressSummary,
  getPracticeHistory,
  sessionsThisWeek,
  dayKey,
}
