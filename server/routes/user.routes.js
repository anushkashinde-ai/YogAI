import { Router } from 'express'
import { body } from 'express-validator'
import * as userController from '../controllers/user.controller.js'
import validate from '../middleware/validate.js'
import { protect } from '../middleware/auth.js'
import { EXPERIENCE_LEVELS, INTENSITIES, YOGA_GOALS } from '../config/constants.js'

const router = Router()

router.use(protect)

router.get('/me', userController.getProfile)

router.patch(
  '/me',
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('email').optional().trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('experienceLevel').optional().isIn(EXPERIENCE_LEVELS).withMessage('Invalid experience level'),
  body('yogaGoals').optional().isArray({ max: 6 }).withMessage('Choose at most 6 goals'),
  body('yogaGoals.*').optional().isIn(YOGA_GOALS).withMessage('Invalid yoga goal'),
  validate,
  userController.updateProfile
)

router.patch(
  '/me/preferences',
  body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Invalid theme'),
  body('practiceDuration').optional().isInt({ min: 5, max: 180 }).withMessage('Practice duration must be 5–180 minutes'),
  body('intensity').optional().isIn(INTENSITIES).withMessage('Invalid intensity'),
  body('weeklyGoalSessions').optional().isInt({ min: 1, max: 21 }).withMessage('Weekly goal must be 1–21 sessions'),
  body('reminderEnabled').optional().isBoolean().withMessage('reminderEnabled must be true or false'),
  body('soundEnabled').optional().isBoolean().withMessage('soundEnabled must be true or false'),
  validate,
  userController.updatePreferences
)

router.post(
  '/me/change-password',
  body('currentPassword').notEmpty().withMessage('Please enter your current password'),
  body('newPassword')
    .isLength({ min: 8, max: 72 })
    .withMessage('New password must be between 8 and 72 characters')
    .matches(/[a-z]/)
    .withMessage('New password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('New password must contain an uppercase letter')
    .matches(/\d/)
    .withMessage('New password must contain a number'),
  validate,
  userController.changePassword
)

export default router
