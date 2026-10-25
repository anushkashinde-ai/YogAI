import YogaPose from '../models/YogaPose.js'
import ApiError from '../utils/ApiError.js'
import { MOODS, MOOD_RULES } from '../config/constants.js'
import { generateRoutine } from './recommendationService.js'

const DISCLAIMER =
  'These are general wellness suggestions based on how you feel — they are not medical or mental-health advice or a diagnosis. Stop if anything feels painful and speak to a qualified professional if symptoms persist.'

/** Breathing pattern suggestions attached to each mood. */
const BREATHING_GUIDES = {
  box: {
    key: 'box',
    name: 'Box Breathing',
    pattern: [4, 4, 4, 4],
    phases: ['Inhale', 'Hold', 'Exhale', 'Hold'],
    note: 'The holds are optional — breathe 4 in and 6 out if holding feels uncomfortable.',
  },
  diaphragmatic: {
    key: 'diaphragmatic',
    name: 'Gentle Diaphragmatic Breathing',
    pattern: [4, 0, 6, 0],
    phases: ['Inhale', '', 'Exhale', ''],
    note: 'Let the belly rise rather than the chest. Keep the exhale slightly longer than the inhale.',
  },
  relaxation: {
    key: 'relaxation',
    name: 'Relaxing Breath (4-7-8 style, holds optional)',
    pattern: [4, 4, 8, 0],
    phases: ['Inhale', 'Hold', 'Exhale', ''],
    note: 'If the hold is uncomfortable, simply inhale for 4 and exhale for 8.',
  },
  sleep: {
    key: 'sleep',
    name: 'Sleep Preparation Breath',
    pattern: [4, 0, 8, 0],
    phases: ['Inhale', '', 'Exhale', ''],
    note: 'Practice lying down with one hand on the belly. Long, quiet exhales help the body settle.',
  },
}

/** All moods the client can render. */
export function listMoods() {
  return MOODS.map((mood) => ({
    key: mood,
    label: MOOD_RULES[mood].label,
    summary: MOOD_RULES[mood].summary,
  }))
}

function rankPoses(poses, rule) {
  return poses
    .map((pose) => {
      let score = 0
      const categoryRank = rule.categories.indexOf(pose.category)
      if (categoryRank >= 0) score += 40 - categoryRank * 8
      if (rule.difficulties.includes(pose.difficulty)) score += 20
      score += Math.min((pose.benefits?.length || 0) * 2, 10)
      return { pose, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.pose)
}

/**
 * Transparent, rule-based mood recommendations.
 * `moods` is an array so multi-select from the UI is supported.
 */
export async function getMoodRecommendations(moods = []) {
  const selected = (Array.isArray(moods) ? moods : [moods]).filter((mood) => MOOD_RULES[mood])
  if (selected.length === 0) {
    throw ApiError.badRequest(`Choose at least one mood from: ${MOODS.join(', ')}`)
  }

  const primary = selected[0]
  const rule = MOOD_RULES[primary]

  const poses = await YogaPose.find({
    category: { $in: rule.categories },
    difficulty: { $in: rule.difficulties },
  }).lean()

  const pool = poses.length
    ? poses
    : await YogaPose.find({ difficulty: { $in: rule.difficulties } }).lean()

  const recommended = rankPoses(pool, rule).slice(0, 6)

  // A ready-to-run routine built from the same rule set.
  const routine = await generateRoutine({
    experienceLevel: rule.difficulties.includes('advanced') ? 'advanced' : 'beginner',
    goal: primary === 'stressed' ? 'stress-relief' : 'general-wellness',
    durationMinutes: rule.durationMinutes,
    intensity: rule.intensity,
    focusAreas: rule.categories.filter((category) =>
      ['restorative', 'seated', 'forward-bend', 'balance', 'standing', 'twist', 'core', 'backbend'].includes(
        category
      )
    ),
  })

  return {
    moods: selected.map((mood) => ({
      key: mood,
      label: MOOD_RULES[mood].label,
      summary: MOOD_RULES[mood].summary,
    })),
    summary: selected.map((mood) => MOOD_RULES[mood].summary).join(' '),
    poses: recommended,
    routine,
    breathing: BREATHING_GUIDES[rule.breathing] || BREATHING_GUIDES.diaphragmatic,
    intensity: rule.intensity,
    durationMinutes: rule.durationMinutes,
    disclaimer: DISCLAIMER,
    algorithm: 'mood-rules-v1',
  }
}

export default { getMoodRecommendations, listMoods }
