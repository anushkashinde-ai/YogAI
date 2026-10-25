import { Router } from 'express'
import { body } from 'express-validator'
import * as authController from '../controllers/auth.controller.js'
import validate from '../middleware/validate.js'
import { protect } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { EXPERIENCE_LEVELS, YOGA_GOALS } from '../config/constants.js'

const router = Router()

const passwordRule = (field = 'password') =>
  body(field)
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain a number')

router.post(
  '/register',
  authLimiter,
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Please enter your name (2–60 characters)'),
  body('email').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  passwordRule('password'),
  body('experienceLevel').optional().isIn(EXPERIENCE_LEVELS).withMessage('Invalid experience level'),
  body('yogaGoals').optional().isArray({ max: 6 }).withMessage('Choose at most 6 goals'),
  body('yogaGoals.*').optional().isIn(YOGA_GOALS).withMessage('Invalid yoga goal'),
  validate,
  authController.register
)

router.post(
  '/login',
  authLimiter,
  body('email').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Please enter your password'),
  validate,
  authController.login
)

router.post('/logout', authController.logout)

router.post(
  '/forgot-password',
  authLimiter,
  body('email').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  validate,
  authController.forgotPassword
)

router.post(
  '/reset-password',
  authLimiter,
  body('token').trim().notEmpty().withMessage('A reset token is required'),
  passwordRule('password'),
  validate,
  authController.resetPassword
)

router.get('/me', protect, authController.me)

export default router
