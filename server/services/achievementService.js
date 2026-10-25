import Achievement from '../models/Achievement.js'
import UserAchievement from '../models/UserAchievement.js'
import { ACHIEVEMENTS } from '../config/constants.js'
import { computeMetrics } from './progressService.js'

/**
 * Keep the achievement catalogue in MongoDB in sync with config/constants.js.
 * Idempotent — safe to call on every boot or from the seeder.
 */
export async function syncAchievementCatalogue() {
  const operations = ACHIEVEMENTS.map((achievement) => ({
    updateOne: {
      filter: { key: achievement.key },
      update: {
        $set: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          color: achievement.color,
          criteria: achievement.criteria,
          isActive: true,
        },
        $setOnInsert: { key: achievement.key },
      },
      upsert: true,
    },
  }))

  if (operations.length === 0) return { upserted: 0 }
  const result = await Achievement.bulkWrite(operations)
  return { upserted: result.upsertedCount || 0, matched: result.matchedCount || 0 }
}

/** Current value of the metric a given criteria measures. */
function metricValueFor(criteria, metrics) {
  switch (criteria.type) {
    case 'sessions':
      return metrics.totalSessions
    case 'minutes':
      return metrics.totalMinutes
    case 'streak':
      return Math.max(metrics.currentStreak, metrics.longestStreak)
    case 'breathing':
      return metrics.breathingSessions
    case 'meditation':
      return metrics.meditationSessions
    case 'timeOfDay':
      return metrics.morningSessions
    case 'category':
      return metrics.categoryCounts[criteria.category] || 0
    default:
      return 0
  }
}

function isUnlocked(criteria, metrics) {
  return metricValueFor(criteria, metrics) >= (criteria.target || 1)
}

/**
 * Evaluate every active achievement for a user and persist the newly unlocked
 * ones. Returns the achievements earned during this call so the UI can show a
 * milestone notification.
 */
export async function evaluateAchievements(userId, metricsInput) {
  const metrics = metricsInput || (await computeMetrics(userId))

  const catalogue = await Achievement.find({ isActive: true }).lean()
  if (catalogue.length === 0) return { newlyEarned: [], total: 0, metrics }

  const alreadyEarned = await UserAchievement.find({ userId }).select('achievementId').lean()
  const earnedIds = new Set(alreadyEarned.map((item) => String(item.achievementId)))

  const toAward = catalogue.filter(
    (achievement) => !earnedIds.has(String(achievement._id)) && isUnlocked(achievement.criteria, metrics)
  )

  if (toAward.length > 0) {
    await UserAchievement.insertMany(
      toAward.map((achievement) => ({ userId, achievementId: achievement._id })),
      { ordered: false }
    ).catch((error) => {
      // Concurrent requests can race on the unique index — that is fine.
      if (error?.code !== 11000) throw error
    })
  }

  return {
    newlyEarned: toAward.map((achievement) => ({
      key: achievement.key,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      color: achievement.color,
    })),
    total: earnedIds.size + toAward.length,
    metrics,
  }
}

/** Full badge wall — earned and locked, with progress towards each target. */
export async function getAchievementBoard(userId) {
  const [catalogue, earned, metrics] = await Promise.all([
    Achievement.find({ isActive: true }).sort({ createdAt: 1 }).lean(),
    UserAchievement.find({ userId }).lean(),
    computeMetrics(userId),
  ])

  const earnedMap = new Map(earned.map((item) => [String(item.achievementId), item.earnedAt]))

  const badges = catalogue.map((achievement) => {
    const target = achievement.criteria?.target || 1
    const value = metricValueFor(achievement.criteria, metrics)
    return {
      id: achievement._id,
      key: achievement.key,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      color: achievement.color,
      earned: earnedMap.has(String(achievement._id)),
      earnedAt: earnedMap.get(String(achievement._id)) || null,
      progress: {
        value: Math.min(value, target),
        target,
        percent: Math.min(100, Math.round((value / target) * 100)),
      },
    }
  })

  return {
    badges,
    earnedCount: badges.filter((badge) => badge.earned).length,
    totalCount: badges.length,
  }
}

export default { syncAchievementCatalogue, evaluateAchievements, getAchievementBoard }
