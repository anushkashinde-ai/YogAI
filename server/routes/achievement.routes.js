import { Router } from 'express'
import * as achievementController from '../controllers/achievement.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, achievementController.listAchievements)

export default router
