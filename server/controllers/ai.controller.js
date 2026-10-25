import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { askAssistant, assistantStatus } from '../services/aiService.js'
import YogaPose from '../models/YogaPose.js'

/**
 * POST /api/ai/chat
 * Body: { message: string, history?: [{ role, content }] }
 *
 * The AI provider key lives only on the server. When no key is configured the
 * endpoint answers in clearly-labelled demo mode.
 */
export const chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body

  // Give the assistant light awareness of the actual pose library.
  const poseNames = await YogaPose.find({}).select('name').limit(60).lean()

  const { reply, mode } = await askAssistant({
    message,
    history,
    knowledge: poseNames.map((pose) => pose.name),
  })

  return sendSuccess(res, {
    message: 'Assistant replied.',
    data: {
      reply,
      mode,
      demo: mode !== 'live',
      disclaimer:
        'Yogi Assistant offers general yoga information only and is not a substitute for medical advice.',
    },
  })
})

/**
 * GET /api/ai/status
 * Lets the UI show an honest badge about the assistant's current mode.
 */
export const status = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Assistant status loaded.', data: assistantStatus() })
)

export default { chat, status }
