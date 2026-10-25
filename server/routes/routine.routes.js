import { Router } from 'express'
import { body, param } from 'express-validator'
import * as routineController from '../controllers/routine.controller.js'
import validate from '../middleware/validate.js'
import { protect, optionalAuth } from '../middleware/auth.js'
import { EXPERIENCE_LEVELS, INTENSITIES, POSE_DIFFICULTIES } from '../config/constants.js'

const router = Router()

router.get('/', optionalAuth, routineController.listRoutines)

router.post(
  '/generate',
  optionalAuth,
  body('experienceLevel').optional().isIn(EXPERIENCE_LEVELS).withMessage('Invalid experience level'),
  body('durationMinutes').optional().isInt({ min: 5, max: 120 }).withMessage('Duration must be 5–120 minutes'),
  body('intensity').optional().isIn(INTENSITIES).withMessage('Invalid intensity'),
  body('equipment').optional().isArray().withMessage('Equipment must be a list'),
  body('focusAreas').optional().isArray().withMessage('Focus areas must be a list'),
  body('save').optional().isBoolean().withMessage('save must be true or false'),
  validate,
  routineController.generateRoutineForUser
)

router.post(
  '/',
  protect,
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3–120 characters'),
  body('durationMinutes').optional().isInt({ min: 5, max: 180 }).withMessage('Duration must be 5–180 minutes'),
  body('difficulty').optional().isIn(POSE_DIFFICULTIES).withMessage('Invalid difficulty'),
  body('intensity').optional().isIn(INTENSITIES).withMessage('Invalid intensity'),
  body('poses').isArray({ min: 1 }).withMessage('A routine needs at least one pose'),
  body('poses.*.pose').isMongoId().withMessage('Each routine pose needs a valid pose id'),
  body('poses.*.durationSeconds').optional().isInt({ min: 5, max: 900 }).withMessage('Invalid pose duration'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be true or false'),
  validate,
  routineController.createRoutine
)

router.get('/:id', optionalAuth, param('id').isMongoId().withMessage('Invalid routine id'), validate, routineController.getRoutine)

router.put(
  '/:id',
  protect,
  param('id').isMongoId().withMessage('Invalid routine id'),
  body('title').optional().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3–120 characters'),
  body('durationMinutes').optional().isInt({ min: 5, max: 180 }).withMessage('Duration must be 5–180 minutes'),
  body('poses').optional().isArray({ min: 1 }).withMessage('A routine needs at least one pose'),
  validate,
  routineController.updateRoutine
)

router.delete('/:id', protect, param('id').isMongoId().withMessage('Invalid routine id'), validate, routineController.deleteRoutine)

router.post(
  '/:id/publish',
  protect,
  param('id').isMongoId().withMessage('Invalid routine id'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be true or false'),
  validate,
  routineController.toggleRoutineVisibility
)

export default router
