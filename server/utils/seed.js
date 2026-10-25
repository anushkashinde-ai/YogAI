/**
 * YogAI database seeder.
 *
 *   npm run seed            → idempotently upsert poses, routines, achievements,
 *                             an admin account, a demo account and sample activity
 *   npm run seed:destroy    → remove everything created by the seeder
 *
 * Safe to run repeatedly: poses are matched by slug, routines by title and
 * achievements by key.
 */
import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db.js'
import config from '../config/env.js'
import User from '../models/User.js'
import YogaPose from '../models/YogaPose.js'
import YogaRoutine from '../models/YogaRoutine.js'
import PracticeSession from '../models/PracticeSession.js'
import Achievement from '../models/Achievement.js'
import UserAchievement from '../models/UserAchievement.js'
import CommunityPost from '../models/CommunityPost.js'
import { syncAchievementCatalogue, evaluateAchievements } from '../services/achievementService.js'
import { POSES, ROUTINES } from './poseData.js'

const log = (...args) => console.log('[seed]', ...args)

/* ------------------------------- Destroy ---------------------------------- */

async function destroy() {
  const emails = [config.seed.adminEmail.toLowerCase(), config.seed.demoEmail.toLowerCase()]
  const users = await User.find({ email: { $in: emails } }).select('_id').lean()
  const userIds = users.map((user) => user._id)

  const [poses, routines, sessions, posts, userAchievements, achievements] = await Promise.all([
    YogaPose.deleteMany({ isSystem: true }),
    YogaRoutine.deleteMany({ source: 'system' }),
    PracticeSession.deleteMany({ userId: { $in: userIds } }),
    CommunityPost.deleteMany({ userId: { $in: userIds } }),
    UserAchievement.deleteMany({ userId: { $in: userIds } }),
    Achievement.deleteMany({}),
  ])

  await User.deleteMany({ email: { $in: emails } })

  log('Removed seeded data:')
  log(`  poses         ${poses.deletedCount}`)
  log(`  routines      ${routines.deletedCount}`)
  log(`  sessions      ${sessions.deletedCount}`)
  log(`  posts         ${posts.deletedCount}`)
  log(`  user badges   ${userAchievements.deletedCount}`)
  log(`  achievements  ${achievements.deletedCount}`)
  log(`  users         ${emails.length}`)
}

/* --------------------------------- Seed ----------------------------------- */

async function seed() {
  /* ---------------------------------- Poses -------------------------------- */
  let posesCreated = 0
  let posesUpdated = 0

  for (const pose of POSES) {
    const { relatedSlugs, ...fields } = pose
    const existing = await YogaPose.findOne({ slug: fields.slug })

    if (existing) {
      Object.assign(existing, fields, { isSystem: true })
      await existing.save()
      posesUpdated += 1
    } else {
      await YogaPose.create({ ...fields, isSystem: true })
      posesCreated += 1
    }
  }

  log(`Poses: ${posesCreated} created, ${posesUpdated} updated`)

  /* ------------------- Resolve related pose references --------------------- */
  const allPoses = await YogaPose.find({}).select('_id slug').lean()
  const poseBySlug = new Map(allPoses.map((pose) => [pose.slug, pose._id]))

  for (const pose of POSES) {
    const related = (pose.relatedSlugs || [])
      .map((slug) => poseBySlug.get(slug))
      .filter((id) => id && String(id) !== String(poseBySlug.get(pose.slug)))

    if (related.length > 0) {
      await YogaPose.updateOne({ slug: pose.slug }, { $set: { relatedPoses: related } })
    }
  }

  log('Related pose links resolved')

  /* ------------------------------ Achievements ----------------------------- */
  const achievementResult = await syncAchievementCatalogue()
  log(`Achievements synced (${achievementResult.upserted} new)`)

  /* ---------------------------------- Users -------------------------------- */
  const admin = await upsertUser({
    name: config.seed.adminName,
    email: config.seed.adminEmail,
    password: config.seed.adminPassword,
    role: 'admin',
    experienceLevel: 'advanced',
    yogaGoals: ['flexibility', 'strength', 'focus'],
    preferences: { practiceDuration: 45, intensity: 'moderate', weeklyGoalSessions: 5 },
  })

  const demo = await upsertUser({
    name: 'Aarohi Demo',
    email: config.seed.demoEmail,
    password: config.seed.demoPassword,
    role: 'user',
    experienceLevel: 'beginner',
    yogaGoals: ['stress-relief', 'flexibility', 'better-sleep'],
    preferences: { practiceDuration: 20, intensity: 'gentle', weeklyGoalSessions: 4, theme: 'light' },
  })

  /* -------------------------------- Routines ------------------------------- */
  let routinesUpserted = 0

  for (const routine of ROUTINES) {
    const routinePoses = routine.poses
      .map((entry) => {
        const poseId = poseBySlug.get(entry.slug)
        if (!poseId) return null
        return {
          pose: poseId,
          durationSeconds: entry.durationSeconds,
          restSeconds: entry.restSeconds,
          part: entry.part,
          notes: entry.notes,
        }
      })
      .filter(Boolean)

    if (routinePoses.length === 0) continue

    await YogaRoutine.findOneAndUpdate(
      { title: routine.title, source: 'system' },
      {
        $set: {
          description: routine.description,
          goal: routine.goal,
          difficulty: routine.difficulty,
          intensity: routine.intensity,
          durationMinutes: routine.durationMinutes,
          tags: routine.tags,
          warmUp: routine.warmUp,
          coolDown: routine.coolDown,
          breathingReminders: routine.breathingReminders,
          poses: routinePoses,
          isPublic: true,
          createdBy: admin._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    routinesUpserted += 1
  }

  log(`System routines upserted: ${routinesUpserted}`)

  /* --------------------------- Demo practice history ----------------------- */
  const existingSessions = await PracticeSession.countDocuments({ userId: demo._id })

  if (existingSessions === 0) {
    const morningRoutine = await YogaRoutine.findOne({ title: 'Morning Energiser' }).lean()
    const unwindRoutine = await YogaRoutine.findOne({ title: 'Stress Melt & Unwind' }).lean()
    const poseDocs = await YogaPose.find({ slug: { $in: ['cat-cow-pose', 'mountain-pose', 'childs-pose', 'tree-pose'] } })
      .select('_id name category')
      .lean()

    // A believable week of activity: 4 sessions across the last 5 days.
    const plan = [
      { daysAgo: 5, hour: 8, minutes: 20, routine: morningRoutine, title: 'Morning Energiser', type: 'routine' },
      { daysAgo: 3, hour: 7, minutes: 18, routine: unwindRoutine, title: 'Stress Melt & Unwind', type: 'routine' },
      { daysAgo: 1, hour: 21, minutes: 10, routine: null, title: 'Evening breathing', type: 'breathing' },
      { daysAgo: 0, hour: 8, minutes: 22, routine: morningRoutine, title: 'Morning Energiser', type: 'routine' },
    ]

    for (const entry of plan) {
      const completedAt = new Date()
      completedAt.setUTCDate(completedAt.getUTCDate() - entry.daysAgo)
      completedAt.setUTCHours(entry.hour, 15, 0, 0)

      const completedPoses =
        entry.type === 'breathing'
          ? []
          : poseDocs.slice(0, 3).map((pose) => ({
              pose: pose._id,
              name: pose.name,
              category: pose.category,
              seconds: 45,
            }))

      await PracticeSession.create({
        userId: demo._id,
        routineId: entry.routine?._id || null,
        title: entry.title,
        type: entry.type,
        durationMinutes: entry.minutes,
        completedPoses,
        categories: [...new Set(completedPoses.map((pose) => pose.category))],
        mood: entry.daysAgo === 0 ? 'calm' : '',
        completedAt,
      })
    }

    log(`Demo practice history created (${plan.length} sessions)`)
  } else {
    log(`Demo practice history already present (${existingSessions} sessions)`)
  }

  const { newlyEarned } = await evaluateAchievements(demo._id)
  log(`Demo account badges evaluated (${newlyEarned.length} newly earned)`)

  /* --------------------------- Community starter --------------------------- */
  const existingPosts = await CommunityPost.countDocuments({ userId: { $in: [admin._id, demo._id] } })

  if (existingPosts === 0) {
    await CommunityPost.create([
      {
        userId: admin._id,
        content:
          'Welcome to the YogAI community! Our weekly challenge is live — join from the Community page and share how it goes. Remember: consistency over intensity.',
        type: 'challenge',
        isPublic: true,
        moderationStatus: 'approved',
        likes: [demo._id],
      },
      {
        userId: demo._id,
        content:
          'Two weeks of three short sessions a week and my morning lower-back stiffness is noticeably better. Ten minutes really does count.',
        type: 'note',
        isPublic: true,
        moderationStatus: 'approved',
      },
    ])
    log('Community starter posts created')
  }

  /* --------------------------------- Summary ------------------------------- */
  const counts = {
    poses: await YogaPose.countDocuments({}),
    routines: await YogaRoutine.countDocuments({}),
    achievements: await Achievement.countDocuments({}),
    users: await User.countDocuments({}),
    sessions: await PracticeSession.countDocuments({}),
  }

  log('---------------------------------------------')
  log('Database now contains:')
  Object.entries(counts).forEach(([key, value]) => log(`  ${key.padEnd(14)} ${value}`))
  log('---------------------------------------------')
  log('Sign in with:')
  log(`  admin  ${config.seed.adminEmail}  /  ${config.seed.adminPassword}`)
  log(`  demo   ${config.seed.demoEmail}  /  ${config.seed.demoPassword}`)
  log('---------------------------------------------')
}

async function upsertUser({ name, email, password, role, experienceLevel, yogaGoals, preferences }) {
  const normalisedEmail = email.toLowerCase()
  let user = await User.findOne({ email: normalisedEmail })

  if (user) {
    user.name = name
    user.role = role
    user.experienceLevel = experienceLevel
    user.yogaGoals = yogaGoals
    user.preferences = { ...user.preferences?.toObject?.(), ...preferences }
    await user.save({ validateBeforeSave: false })
    log(`User updated: ${normalisedEmail} (${role})`)
    return user
  }

  user = await User.create({
    name,
    email: normalisedEmail,
    passwordHash: await User.hashPassword(password),
    role,
    experienceLevel,
    yogaGoals,
    preferences,
  })

  log(`User created: ${normalisedEmail} (${role})`)
  return user
}

/* --------------------------------- Runner --------------------------------- */

async function run() {
  const shouldDestroy = process.argv.includes('--destroy')

  try {
    await connectDB()
    if (shouldDestroy) await destroy()
    else await seed()
    log('Done.')
  } catch (error) {
    console.error('[seed] Failed:', error)
    process.exitCode = 1
  } finally {
    await disconnectDB()
    await mongoose.connection.close().catch(() => {})
  }
}

run()
