import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getMoodRecommendations, listMoods } from '../services/moodService.js'

/**
 * GET /api/mood/options
 * Public. Powers the "How are you feeling today?" selector.
 */
export const getMoodOptions = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Mood options loaded.', data: listMoods() })
)

/**
 * POST /api/mood/recommend
 * Body: { moods: string[] } — rule-based, transparent recommendations.
 */
export const recommendForMood = asyncHandler(async (req, res) => {
  const { moods } = req.body
  const result = await getMoodRecommendations(moods)

  return sendSuccess(res, { message: 'Recommendations ready.', data: result })
})

export default { getMoodOptions, recommendForMood }
