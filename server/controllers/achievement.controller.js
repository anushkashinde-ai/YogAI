import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getAchievementBoard } from '../services/achievementService.js'

/**
 * GET /api/achievements
 * Full badge board: earned + locked, with progress towards each target.
 */
export const listAchievements = asyncHandler(async (req, res) => {
  const board = await getAchievementBoard(req.user._id)

  return sendSuccess(res, {
    message: 'Achievements loaded.',
    data: board.badges,
    meta: { earnedCount: board.earnedCount, totalCount: board.totalCount },
  })
})

export default { listAchievements }
