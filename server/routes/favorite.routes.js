import { Router } from 'express'
import { param } from 'express-validator'
import * as favoriteController from '../controllers/favorite.controller.js'
import validate from '../middleware/validate.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)

router.get('/', favoriteController.listFavorites)

router.post(
  '/:poseId',
  param('poseId').isMongoId().withMessage('Invalid pose id'),
  validate,
  favoriteController.addFavorite
)

router.delete(
  '/:poseId',
  param('poseId').isMongoId().withMessage('Invalid pose id'),
  validate,
  favoriteController.removeFavorite
)

export default router
