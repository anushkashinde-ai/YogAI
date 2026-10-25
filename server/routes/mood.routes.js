import { Router } from 'express'
import { body } from 'express-validator'
import * as moodController from '../controllers/mood.controller.js'
import validate from '../middleware/validate.js'
import { MOODS } from '../config/constants.js'

const router = Router()

router.get('/options', moodController.getMoodOptions)

router.post(
  '/recommend',
  body('moods').isArray({ min: 1, max: 3 }).withMessage('Choose between 1 and 3 moods'),
  body('moods.*').isIn(MOODS).withMessage('Unknown mood selection'),
  validate,
  moodController.recommendForMood
)

export default router
