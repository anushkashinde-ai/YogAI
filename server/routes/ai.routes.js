import { Router } from 'express'
import { body } from 'express-validator'
import * as aiController from '../controllers/ai.controller.js'
import validate from '../middleware/validate.js'
import { optionalAuth } from '../middleware/auth.js'
import { aiLimiter } from '../middleware/rateLimit.js'

const router = Router()

router.get('/status', aiController.status)

router.post(
  '/chat',
  aiLimiter,
  optionalAuth,
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Please enter a question (max 1000 characters)'),
  body('history').optional().isArray({ max: 20 }).withMessage('History must be a short list of messages'),
  body('history.*.role').optional().isIn(['user', 'assistant']).withMessage('Invalid history role'),
  body('history.*.content').optional().isString().withMessage('Invalid history content'),
  validate,
  aiController.chat
)

export default router
