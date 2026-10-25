import config from '../config/env.js'
import ApiError from '../utils/ApiError.js'

/**
 * Yogi Assistant — the conversational yoga helper.
 *
 * When AI_API_KEY is configured the request is proxied through this backend
 * (the key never reaches the browser). When it is not configured we fall back
 * to DEMO MODE: transparent, rule-based answers from the knowledge base below.
 */

const SYSTEM_PROMPT = `You are "Yogi Assistant", the friendly yoga guide inside the YogAI app.
You help beginners and experienced practitioners understand yoga poses, breathing
techniques (pranayama), routine planning, and common yoga terminology.

Hard rules:
- Keep answers warm, concise (max 180 words) and practical.
- Never diagnose medical or mental-health conditions and never promise that a pose
  cures anything. Suggest consulting a qualified teacher or doctor when relevant.
- Always mention a safety note when recommending an advanced pose or an inversion.
- Encourage consistency and kindness to the body over flexibility or appearance.
- If a user describes sharp pain, dizziness or injury, tell them to stop and seek
  professional medical advice.
- Politely decline topics unrelated to yoga, wellness and the YogAI app.`

const DEMO_TOPICS = [
  {
    key: 'sun-salutation',
    match: [/sun\s*salutation|surya\s*namaskar/i],
    answer:
      'Surya Namaskar (Sun Salutation) is a flowing sequence of about 12 linked poses. It warms the whole body, so it works beautifully as a warm-up. Start with 3 rounds, moving one breath per position, and build up slowly. Beginners can keep the knees bent in the forward folds.',
  },
  {
    key: 'beginner-routine',
    match: [/beginner|start|new to yoga|first routine|where do i/i],
    answer:
      'A gentle starting point: 5 minutes of Cat-Cow and Child\u2019s Pose to warm up, 3 rounds of Mountain Pose with slow breathing to find your base, then Tree Pose holding each side for 20 seconds, and finish with 3 minutes of Corpse Pose. Three sessions a week is plenty to begin with.',
  },
  {
    key: 'breathing',
    match: [/breath|pranayama|breathing|box breath|inhale|exhale/i],
    answer:
      'Try Box Breathing: inhale for 4, hold gently for 4, exhale for 4, hold for 4. Always make breath-holding optional \u2014 if it feels uncomfortable, simply breathe in for 4 and out for 6 with no holds. Sit tall, soften your shoulders and let the breath be smooth rather than deep.',
  },
  {
    key: 'terminology',
    match: [/asana|pranayama|namaste|vinyasa|hatha|sanskrit|what does .* mean/i],
    answer:
      'Quick glossary: "Asana" = a physical pose. "Pranayama" = breath control. "Vinyasa" = a flowing sequence linked to breath. "Hatha" = a slower style that holds poses. "Namaste" = a respectful greeting, usually with hands at the heart.',
  },
  {
    key: 'back-pain',
    match: [/back pain|lower back|sciatica|neck pain/i],
    answer:
      'Gentle options that many people find supportive are Cat-Cow, Child\u2019s Pose with a cushion under the hips, and a supported Bridge. Please treat this as general information only \u2014 if the pain is sharp, sudden or radiates down a leg, stop and speak to a physiotherapist or doctor.',
  },
  {
    key: 'flexibility',
    match: [/flexib|touch my toes|hamstring|stiff/i],
    answer:
      'Flexibility grows with consistency, not force. Warm up first, then hold a forward fold for 30\u201360 seconds while breathing slowly and letting the muscles release. Bent knees are completely fine. Progress is measured in weeks, so practise little and often.',
  },
  {
    key: 'balance',
    match: [/balance|wobbl|fal(l|ling) over/i],
    answer:
      'For steadiness, fix your gaze on one still point, spread your toes, and press the standing foot down firmly. Start with a hand resting on a wall in Tree Pose. Wobbling is normal and it still trains your balance \u2014 hold each side for 20\u201330 seconds.',
  },
  {
    key: 'progress',
    match: [/streak|progress|how often|how many times|habit/i],
    answer:
      'Aim for 3\u20135 sessions a week rather than daily intensity. YogAI tracks your streak, total minutes and completed routines on the Progress page, and each finished session unlocks badges. Consistency beats duration every time.',
  },
  {
    key: 'equipment',
    match: [/equipment|mat|block|strap|prop/i],
    answer:
      'You need very little: a non-slip mat is the main one. Blocks (or thick books) help reach the floor comfortably, and a strap (or a towel) extends your reach in forward folds. A folded blanket under the knees makes seated poses kinder.',
  },
  {
    key: 'pain',
    match: [/pain|hurt|injur|dizzy|numb/i],
    answer:
      'Please stop the practice if you feel sharp pain, dizziness or numbness. Yoga should never hurt. Rest, and if the sensation continues, consult a qualified doctor or physiotherapist before returning to practice.',
  },
]

const DEMO_FALLBACK =
  'I am currently in **Demo Mode** because no `AI_API_KEY` is configured in the server `.env` file. In this mode, I only answer specific questions about yoga poses, breathing, and terminology. To enable my full live AI capabilities, please add a valid API key to your server environment and restart the server.'

/** Pick the closest predefined response for demo mode. */
export function buildDemoReply(message) {
  const topic = DEMO_TOPICS.find((item) => item.match.some((regex) => regex.test(message)))
  return topic ? topic.answer : DEMO_FALLBACK
}

/**
 * Normalise the conversation for the upstream API.
 * Only role/content pairs are forwarded — nothing else from the client.
 */
function normaliseHistory(history = []) {
  if (!Array.isArray(history)) return []
  return history
    .filter((item) => item && typeof item.content === 'string' && item.content.trim())
    .slice(-8)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content).slice(0, 2000),
    }))
}

/**
 * Ask the assistant. Returns { reply, mode } where mode is 'live' or 'demo'.
 * `knowledge` is an optional list of pose names the assistant may reference.
 */
export async function askAssistant({ message, history = [], knowledge = [] }) {
  const trimmed = String(message || '').trim()
  if (!trimmed) throw ApiError.badRequest('Please type a question for Yogi Assistant.')
  if (trimmed.length > 1000) throw ApiError.badRequest('Please keep your question under 1000 characters.')

  if (!config.ai.enabled) {
    return { reply: buildDemoReply(trimmed), mode: 'demo' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.ai.timeoutMs)

  try {
    const contextLine = knowledge.length
      ? `\nPoses available in the YogAI library: ${knowledge.slice(0, 60).join(', ')}.`
      : ''

    const response = await fetch(`${config.ai.apiBase.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextLine },
          ...normaliseHistory(history),
          { role: 'user', content: trimmed },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      // eslint-disable-next-line no-console
      console.warn(`[YogAI] AI provider responded ${response.status}: ${detail.slice(0, 240)}`)
      // Graceful degradation — never break the chat UI because of an upstream issue.
      return {
        reply: `${buildDemoReply(trimmed)}\n\n_(Live AI is temporarily unavailable, so this answer came from YogAI's built-in guide.)_`,
        mode: 'demo-fallback',
      }
    }

    const payload = await response.json()
    const reply = payload?.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return { reply: buildDemoReply(trimmed), mode: 'demo-fallback' }
    }

    return { reply, mode: 'live' }
  } catch (error) {
    const aborted = error.name === 'AbortError'
    // eslint-disable-next-line no-console
    console.warn(`[YogAI] AI request failed: ${aborted ? 'timeout' : error.message}`)
    return {
      reply: `${buildDemoReply(trimmed)}\n\n_(YogAI could not reach the AI provider just now, so this answer came from the built-in guide.)_`,
      mode: 'demo-fallback',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export const assistantStatus = () => ({
  mode: config.ai.enabled ? 'live' : 'demo',
  model: config.ai.enabled ? config.ai.model : 'yogai-knowledge-base',
  label: config.ai.enabled
    ? 'Live AI assistant'
    : 'Demo mode — no AI API key configured, answers come from the built-in yoga guide.',
})

export default { askAssistant, assistantStatus, buildDemoReply }
