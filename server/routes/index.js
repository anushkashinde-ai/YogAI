import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import poseRoutes from './pose.routes.js'
import routineRoutes from './routine.routes.js'
import progressRoutes from './progress.routes.js'
import favoriteRoutes from './favorite.routes.js'
import aiRoutes from './ai.routes.js'
import achievementRoutes from './achievement.routes.js'
import moodRoutes from './mood.routes.js'
import communityRoutes from './community.routes.js'
import { sendSuccess } from '../utils/apiResponse.js'

const router = Router()

/** Lightweight health probe for uptime monitors and deployment platforms. */
router.get('/health', (_req, res) =>
  sendSuccess(res, {
    message: 'YogAI API is running.',
    data: { status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
  })
)

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/poses', poseRoutes)
router.use('/routines', routineRoutes)
router.use('/progress', progressRoutes)
router.use('/favorites', favoriteRoutes)
router.use('/ai', aiRoutes)
router.use('/achievements', achievementRoutes)
router.use('/mood', moodRoutes)
router.use('/community', communityRoutes)

export default router
