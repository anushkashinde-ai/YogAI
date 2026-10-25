/**
 * Static app configuration shared across the UI.
 * Values mirror the enums defined in the API so both sides stay in sync.
 */

export const APP_NAME = 'YogAI'
export const APP_TAGLINE = 'Smart Yoga Companion'

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Explore Poses', to: '/poses' },
  { label: 'AI Yoga Coach', to: '/coach' },
  { label: 'Yoga Plans', to: '/plans' },
  { label: 'Breathing', to: '/breathing' },
  { label: 'Progress', to: '/progress' },
  { label: 'Community', to: '/community' },
]

/** Secondary links shown in the footer. */
export const FOOTER_LINKS = {
  explore: [
    { label: 'Explore Poses', to: '/poses' },
    { label: 'AI Yoga Coach', to: '/coach' },
    { label: 'Yoga Plans', to: '/plans' },
    { label: 'Breathing Studio', to: '/breathing' },
    { label: 'How are you feeling?', to: '/mood' },
  ],
  account: [
    { label: 'Progress Dashboard', to: '/progress' },
    { label: 'Community', to: '/community' },
    { label: 'Yogi Assistant', to: '/assistant' },
    { label: 'My Profile', to: '/profile' },
  ],
  legal: [
    { label: 'Privacy & Camera Use', to: '/privacy' },
    { label: 'Terms of Use', to: '/terms' },
    { label: 'Safety Disclaimer', to: '/safety' },
  ],
}

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', hint: 'New to yoga or returning after a long break' },
  { value: 'intermediate', label: 'Intermediate', hint: 'Comfortable with the basics and regular practice' },
  { value: 'advanced', label: 'Advanced', hint: 'Confident with strong flows and longer holds' },
]

export const YOGA_GOALS = [
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'strength', label: 'Strength' },
  { value: 'stress-relief', label: 'Stress relief' },
  { value: 'weight-management', label: 'Weight management' },
  { value: 'better-sleep', label: 'Better sleep' },
  { value: 'focus', label: 'Focus' },
  { value: 'posture', label: 'Posture' },
  { value: 'general-wellness', label: 'General wellness' },
]

export const INTENSITIES = [
  { value: 'gentle', label: 'Gentle', hint: 'Slow, supported and restorative' },
  { value: 'moderate', label: 'Moderate', hint: 'Balanced effort with steady holds' },
  { value: 'energetic', label: 'Energetic', hint: 'Stronger flows and shorter rests' },
]

export const EQUIPMENT_OPTIONS = [
  { value: 'mat', label: 'Yoga mat' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'strap', label: 'Strap' },
  { value: 'blanket', label: 'Blanket' },
  { value: 'chair', label: 'Chair' },
]

export const POSE_CATEGORIES = [
  'standing',
  'seated',
  'backbend',
  'forward-bend',
  'twist',
  'balance',
  'inversion',
  'restorative',
  'core',
]

export const POSE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export const DIFFICULTY_STYLES = {
  beginner: 'bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100',
  intermediate: 'bg-lavender-100 text-lavender-700 dark:bg-lavender-900/60 dark:text-lavender-100',
  advanced: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100',
}

/** Category labels get a readable, human label in the UI. */
export const CATEGORY_LABELS = {
  standing: 'Standing',
  seated: 'Seated',
  backbend: 'Backbend',
  'forward-bend': 'Forward bend',
  twist: 'Twist',
  balance: 'Balance',
  inversion: 'Inversion',
  restorative: 'Restorative',
  core: 'Core',
}

export const SORT_OPTIONS = [
  { value: 'name', label: 'Alphabetical' },
  { value: 'newest', label: 'Newest first' },
  { value: 'duration', label: 'Shortest hold' },
  { value: 'duration-desc', label: 'Longest hold' },
  { value: 'difficulty', label: 'Difficulty' },
]

/** Breathing patterns used by the Breathing & Meditation Studio. */
export const BREATHING_PATTERNS = [
  {
    key: 'box',
    name: 'Box Breathing',
    description: 'Equal counts in, hold, out and hold. Steadies a busy mind.',
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold', seconds: 4 },
      { label: 'Exhale', seconds: 4 },
      { label: 'Hold', seconds: 4 },
    ],
    note: 'The holds are optional. If they feel uncomfortable, breathe in for 4 and out for 6 instead.',
  },
  {
    key: 'diaphragmatic',
    name: 'Gentle Diaphragmatic Breathing',
    description: 'Belly breathing that calms the body without any breath holding.',
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale', seconds: 6 },
    ],
    note: 'Let the belly rise rather than the chest. No holds in this pattern.',
  },
  {
    key: 'relaxation',
    name: 'Relaxing Breath',
    description: 'A long exhale pattern to release tension.',
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold', seconds: 4 },
      { label: 'Exhale', seconds: 8 },
    ],
    note: 'Skip the hold entirely if you prefer — 4 in and 8 out works just as well.',
  },
  {
    key: 'sleep',
    name: 'Sleep Preparation',
    description: 'Slow, quiet breathing with a very long exhale.',
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale', seconds: 8 },
    ],
    note: 'Practice lying down with one hand on the belly. Let the exhale be silent.',
  },
]

/** Guided meditation & relaxation sessions for the studio. */
export const MEDITATION_SESSIONS = [
  {
    key: 'body-scan',
    name: 'Guided Body Scan',
    minutes: 10,
    description: 'Move attention slowly from the feet to the crown of the head.',
    steps: [
      'Lie down in a comfortable position and let the arms rest beside you.',
      'Bring attention to the soles of the feet. Notice temperature and contact.',
      'Slowly move up through the calves, knees and thighs.',
      'Notice the hips, lower back and belly rising with each breath.',
      'Move through the chest, shoulders, arms and hands.',
      'Finish with the neck, jaw, face and the crown of the head.',
      'Let the whole body be felt as one piece before you open your eyes.',
    ],
  },
  {
    key: 'breath-awareness',
    name: 'Breath Awareness',
    minutes: 8,
    description: 'A simple practice of following the natural breath.',
    steps: [
      'Sit comfortably with the spine tall and the shoulders soft.',
      'Let the breath be completely natural — do not change it.',
      'Follow one full breath from start to finish.',
      'When the mind wanders, gently return to the next breath.',
      'Notice the tiny pause at the end of each exhale.',
      'Widen attention to the whole body breathing.',
    ],
  },
  {
    key: 'release-tension',
    name: 'Progressive Relaxation',
    minutes: 12,
    description: 'Tense and release muscle groups to discharge held tension.',
    steps: [
      'Lie down and take three slow breaths.',
      'Curl the toes and tense the legs for five seconds, then release.',
      'Squeeze the glutes and belly, then release completely.',
      'Make fists and tense the arms, then let them drop.',
      'Raise the shoulders towards the ears, then let them fall.',
      'Scrunch the face gently, then soften everything.',
      'Rest for a full minute noticing the difference.',
    ],
  },
  {
    key: 'sleep-wind-down',
    name: 'Sleep Wind-Down',
    minutes: 15,
    description: 'A slow sequence to help the body prepare for sleep.',
    steps: [
      'Dim the lights and lie on your back.',
      'Take ten breaths with a longer, quiet exhale.',
      'Let the legs fall open and the feet drop outwards.',
      'Release the jaw and let the tongue rest soft.',
      'If thoughts appear, label them "thinking" and return to the exhale.',
      'Let the practice end without needing to get up straight away.',
    ],
  },
]

/** Suggested prompts for the Yogi Assistant. */
export const ASSISTANT_SUGGESTIONS = [
  'Which poses suit a complete beginner?',
  'How do I do Tree Pose without wobbling?',
  'Can you explain box breathing?',
  'What does Vinyasa mean?',
  'How many times a week should I practise?',
  'My lower back feels stiff — what should I try?',
]

export const ACHIEVEMENT_ICONS = {
  sparkles: 'sparkles',
  flame: 'flame',
  wind: 'wind',
  footprints: 'footprints',
  sunrise: 'sunrise',
  medal: 'medal',
  clock: 'clock',
  trophy: 'trophy',
  award: 'award',
}
