import { Router } from 'express'
import { body, param } from 'express-validator'
import * as poseController from '../controllers/pose.controller.js'
import validate from '../middleware/validate.js'
import { protect, optionalAuth, requireAdmin } from '../middleware/auth.js'
import { uploadImage } from '../middleware/upload.js'
import { POSE_CATEGORIES, POSE_DIFFICULTIES } from '../config/constants.js'

const router = Router()

const poseBodyRules = (optional = false) => {
  const maybe = (chain) => (optional ? chain.optional() : chain)
  return [
    maybe(body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Pose name must be 2–80 characters')),
    maybe(body('description').trim().isLength({ min: 10, max: 1200 }).withMessage('Description must be 10–1200 characters')),
    maybe(body('difficulty').isIn(POSE_DIFFICULTIES).withMessage('Invalid difficulty')),
    maybe(body('category').isIn(POSE_CATEGORIES).withMessage('Invalid category')),
    body('benefits').optional().isArray().withMessage('Benefits must be a list'),
    body('instructions').optional().isArray({ max: 20 }).withMessage('Provide at most 20 instruction steps'),
    body('precautions').optional().isArray().withMessage('Precautions must be a list'),
    body('duration').optional().isInt({ min: 5, max: 900 }).withMessage('Duration must be 5–900 seconds'),
    body('imageUrl').optional().isString().withMessage('imageUrl must be a string'),
  ]
}

// Public reads (optionalAuth enriches the response with favourite status).
router.get('/', optionalAuth, poseController.listPoses)
router.get('/:id', optionalAuth, poseController.getPose)

// Admin-only writes.
router.post('/', protect, requireAdmin, ...poseBodyRules(false), validate, poseController.createPose)

router.put(
  '/:id',
  protect,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid pose id'),
  ...poseBodyRules(true),
  validate,
  poseController.updatePose
)

router.delete(
  '/:id',
  protect,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid pose id'),
  validate,
  poseController.deletePose
)

router.post(
  '/:id/image',
  protect,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid pose id'),
  validate,
  uploadImage,
  poseController.uploadPoseImage
)

export default router
