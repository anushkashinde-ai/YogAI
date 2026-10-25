import { Router } from 'express'
import { body, param } from 'express-validator'
import * as communityController from '../controllers/community.controller.js'
import validate from '../middleware/validate.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = Router()

router.get('/posts', optionalAuth, communityController.listPosts)

router.post(
  '/posts',
  protect,
  body('content').trim().isLength({ min: 2, max: 1200 }).withMessage('Post must be 2–1200 characters'),
  body('type').optional().isIn(['achievement', 'routine', 'note', 'challenge']).withMessage('Invalid post type'),
  body('achievementKey').optional().trim().isLength({ max: 60 }).withMessage('Invalid achievement key'),
  body('routineId').optional({ nullable: true }).isMongoId().withMessage('Invalid routine id'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be true or false'),
  validate,
  communityController.createPost
)

router.delete('/posts/:id', protect, param('id').isMongoId().withMessage('Invalid post id'), validate, communityController.deletePost)

router.post(
  '/posts/:id/like',
  protect,
  param('id').isMongoId().withMessage('Invalid post id'),
  validate,
  communityController.toggleLike
)

router.post(
  '/posts/:id/report',
  protect,
  param('id').isMongoId().withMessage('Invalid post id'),
  body('reason').optional().trim().isLength({ max: 300 }).withMessage('Reason is too long'),
  validate,
  communityController.reportPost
)

// Challenges — kept above any dynamic segment so the paths never collide.
router.get('/challenges', optionalAuth, communityController.listChallenges)
router.post('/challenges/:key/join', protect, communityController.joinChallenge)
router.delete('/challenges/:key/join', protect, communityController.leaveChallenge)

export default router
