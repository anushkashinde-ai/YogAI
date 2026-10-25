import { Router } from 'express'
import { body } from 'express-validator'
import * as progressController from '../controllers/progress.controller.js'
import validate from '../middleware/validate.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)

router.get('/', progressController.getProgress)
router.get('/weekly', progressController.getWeeklyProgress)
router.get('/history', progressController.getHistory)

router.post(
  '/sessions',
  body('durationMinutes').isFloat({ min: 0.1, max: 600 }).withMessage('Duration must be between 0.1 and 600 minutes'),
  body('title').optional().trim().isLength({ max: 140 }).withMessage('Title is too long'),
  body('type')
    .optional()
    .isIn(['routine', 'pose', 'breathing', 'meditation', 'free-practice'])
    .withMessage('Invalid session type'),
  body('routineId').optional({ nullable: true }).isMongoId().withMessage('Invalid routine id'),
  body('completedPoses').optional().isArray().withMessage('completedPoses must be a list'),
  body('completedPoses.*.pose').optional().isMongoId().withMessage('Invalid pose id'),
  body('mood').optional().trim().isLength({ max: 40 }).withMessage('Mood is too long'),
  body('notes').optional().trim().isLength({ max: 600 }).withMessage('Notes are too long'),
  validate,
  progressController.createSession
)

export default router
