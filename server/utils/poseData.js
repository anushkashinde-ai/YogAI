/**
 * Seed content for the YogAI pose library and system routines.
 * Kept separate from utils/seed.js so the data is easy to review and extend.
 */

/** Consistent, on-brand demonstration imagery for each pose. */
const poseImage = (prompt) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=portrait_4_3`

export const POSES = [
  {
    name: 'Mountain Pose',
    slug: 'mountain-pose',
    sanskritName: 'Tadasana',
    description:
      'The foundation of every standing pose. Mountain Pose teaches you to stand with steady, effortless alignment, stacking the joints so the whole body can relax while staying awake and alert.',
    difficulty: 'beginner',
    category: 'standing',
    benefits: [
      'Improves posture and body awareness',
      'Strengthens thighs, ankles and feet',
      'Calms the breath and steadies the mind',
      'A safe reference point for every other standing pose',
    ],
    instructions: [
      'Stand with the feet hip-width apart, weight evenly spread across both feet.',
      'Press down through all four corners of each foot to feel the legs engage.',
      'Lengthen the tailbone towards the floor and gently draw the lower ribs in.',
      'Let the arms rest beside the body, palms facing forward or inwards.',
      'Lift through the crown of the head and soften the jaw and shoulders.',
      'Hold for 30 seconds, breathing slowly and evenly.',
    ],
    breathingInstructions: [
      'Breathe in and out through the nose with a smooth, even rhythm.',
      'On each inhale feel the body lengthen; on each exhale feel the shoulders soften.',
    ],
    commonMistakes: [
      'Locking the knees, which blocks the natural spring in the legs',
      'Letting the ribs flare forward while the pelvis tucks under',
      'Holding the breath or tensing the jaw without noticing',
    ],
    modifications: [
      'Stand with the back against a wall to feel the alignment',
      'Keep the feet wider apart if balance feels uncertain',
      'Practise seated in a chair for the same alignment cues',
    ],
    precautions: [
      'Avoid long holds if you have low blood pressure and feel dizzy — sit down instead.',
      'Keep the knees very slightly soft if you have joint hypermobility.',
    ],
    duration: 30,
    imageUrl: poseImage('woman standing tall in mountain pose tadasana on a sage green yoga mat'),
    relatedSlugs: ['tree-pose', 'warrior-ii', 'corpse-pose'],
    isSystem: true,
  },
  {
    name: 'Tree Pose',
    slug: 'tree-pose',
    sanskritName: 'Vrksasana',
    description:
      'A single-leg balance that builds focus. Tree Pose trains the small stabilising muscles of the ankle and hip while asking you to keep a soft, steady gaze.',
    difficulty: 'beginner',
    category: 'balance',
    benefits: [
      'Improves balance and ankle stability',
      'Strengthens the standing leg and core',
      'Sharpens concentration',
      'Opens the hips and inner thighs',
    ],
    instructions: [
      'Start in Mountain Pose with your gaze fixed on one still point ahead of you.',
      'Shift the weight into the left foot and lift the right foot off the floor.',
      'Place the right foot on the inner calf or inner thigh — never on the knee joint.',
      'Press the right foot into the left leg and the left leg back into the foot.',
      'Bring the hands together at the heart, or reach them overhead if balance is steady.',
      'Hold for 20–30 seconds, then repeat on the other side.',
    ],
    breathingInstructions: [
      'Inhale to lengthen through the spine and stand tall.',
      'Exhale to soften the shoulders and settle deeper into the standing foot.',
    ],
    commonMistakes: [
      'Pressing the foot directly onto the side of the knee joint',
      'Hiking the hip of the lifted leg upwards',
      'Staring at the moving feet instead of a fixed point',
    ],
    modifications: [
      'Rest the toes on the floor with the heel lifted, keeping the toe touching like a kickstand',
      'Keep one hand on a wall for support',
      'Practise lying down with the sole of one foot on the inner thigh of the other leg',
    ],
    precautions: [
      'Skip the pose if you have a recent ankle or knee injury.',
      'Come out of the pose if you feel unsteady rather than forcing the balance.',
    ],
    duration: 30,
    imageUrl: poseImage('woman balancing in tree pose vrksasana with hands at heart centre'),
    relatedSlugs: ['mountain-pose', 'warrior-iii', 'bridge-pose'],
    isSystem: true,
  },
  {
    name: 'Downward-Facing Dog',
    slug: 'downward-facing-dog',
    sanskritName: 'Adho Mukha Svanasana',
    description:
      'An inverted, full-body stretch that lengthens the hamstrings and spine while strengthening the shoulders and arms. It also gives the heart a gentle moment above the head.',
    difficulty: 'beginner',
    category: 'forward-bend',
    benefits: [
      'Lengthens hamstrings, calves and the whole back line',
      'Strengthens shoulders, arms and core',
      'Gently energises the body while calming the mind',
      'A useful transition between standing poses',
    ],
    instructions: [
      'Come onto all fours with the hands slightly ahead of the shoulders.',
      'Spread the fingers wide and press the whole hand into the mat.',
      'Tuck the toes and lift the knees off the floor.',
      'Send the hips up and back, keeping a generous bend in the knees.',
      'Lengthen the spine first — straighten the legs only as much as the back allows.',
      'Hold for 30–60 seconds, letting the head hang between the upper arms.',
    ],
    breathingInstructions: [
      'Breathe steadily through the nose for the full hold.',
      'If the breath becomes short, bend the knees more until it smooths out again.',
    ],
    commonMistakes: [
      'Locking the knees to force the heels to the floor',
      'Rounding the lower back instead of lengthening the spine',
      'Collapsing into the shoulders and letting the arms bend',
    ],
    modifications: [
      'Bend the knees generously and prioritise a long spine',
      'Place the hands on a wall or on blocks to reduce the load',
      'Rest the forehead on a block or cushion for a supported version',
    ],
    precautions: [
      'Avoid during late pregnancy — use a wall-supported version instead.',
      'Skip if you have glaucoma, uncontrolled high blood pressure or a wrist injury.',
    ],
    duration: 45,
    imageUrl: poseImage('person holding downward facing dog pose on a light wooden floor'),
    relatedSlugs: ['childs-pose', 'cat-cow-pose', 'legs-up-the-wall'],
    isSystem: true,
  },
  {
    name: 'Warrior I',
    slug: 'warrior-i',
    sanskritName: 'Virabhadrasana I',
    description:
      'A grounded, powerful standing pose. Warrior I builds strength in the legs and hips while opening the chest and lifting the gaze.',
    difficulty: 'intermediate',
    category: 'standing',
    benefits: [
      'Strengthens thighs, calves and ankles',
      'Opens the hip flexors and chest',
      'Builds confidence and steady focus',
      'Improves balance through the hip complex',
    ],
    instructions: [
      'Stand at the top of the mat and step the left foot back about one leg length.',
      'Turn the left toes out to roughly 45 degrees and plant the heel down.',
      'Bend the right knee until it sits above the ankle.',
      'Square the hips towards the front of the mat as far as is comfortable.',
      'Sweep both arms overhead, palms facing each other.',
      'Hold for 30–40 seconds, then change sides.',
    ],
    breathingInstructions: [
      'Inhale as the arms lift overhead and the chest opens.',
      'Exhale as you sink a little deeper into the front knee.',
    ],
    commonMistakes: [
      'Letting the front knee travel past the toes',
      'Over-arching the lower back to get the arms higher',
      'Lifting the back heel off the floor',
    ],
    modifications: [
      'Shorten the stance to reduce the hip flexor stretch',
      'Keep the hands on the hips instead of reaching overhead',
      'Practise against a wall to feel the hips squaring',
    ],
    precautions: [
      'Reduce the depth of the lunge if you have knee or hip pain.',
      'Keep the back heel grounded to protect the lower back.',
    ],
    duration: 40,
    imageUrl: poseImage('person in warrior one pose virabhadrasana one on a cream yoga mat'),
    relatedSlugs: ['warrior-ii', 'warrior-iii', 'mountain-pose'],
    isSystem: true,
  },
  {
    name: 'Warrior II',
    slug: 'warrior-ii',
    sanskritName: 'Virabhadrasana II',
    description:
      'A wide, stable standing pose that builds endurance in the legs and opens the chest and shoulders towards the side. Warrior II is an excellent pose for practising an even, focused gaze.',
    difficulty: 'beginner',
    category: 'standing',
    benefits: [
      'Strengthens legs, hips and shoulders',
      'Stretches the groin and inner thighs',
      'Builds stamina and mental steadiness',
      'Opens the chest for fuller breathing',
    ],
    instructions: [
      'Step the feet wide apart, roughly one leg length.',
      'Turn the right toes out 90 degrees and the left toes in slightly.',
      'Bend the right knee towards a right angle, tracking over the second toe.',
      'Extend both arms parallel to the floor, reaching in opposite directions.',
      'Turn the head to gaze over the front hand.',
      'Hold for 30–40 seconds, breathing evenly, then repeat on the other side.',
    ],
    breathingInstructions: [
      'Keep the breath slow and full, especially on the exhale.',
      'If the breath shortens, straighten the front knee slightly.',
    ],
    commonMistakes: [
      'Letting the front knee collapse inwards',
      'Leaning the torso forward over the front thigh',
      'Shrugging the shoulders up towards the ears',
    ],
    modifications: [
      'Reduce the knee bend and shorten the stance',
      'Rest the front hand on the hip or a block if the shoulders tire',
      'Practise seated in a chair with the arms extended',
    ],
    precautions: [
      'Avoid deep knee bends if you have knee instability.',
      'Keep the front knee tracking in line with the toes at all times.',
    ],
    duration: 40,
    imageUrl: poseImage('person in warrior two pose virabhadrasana two with arms extended'),
    relatedSlugs: ['warrior-i', 'tree-pose', 'mountain-pose'],
    isSystem: true,
  },
  {
    name: "Child's Pose",
    slug: 'childs-pose',
    sanskritName: 'Balasana',
    description:
      'A resting pose that gently lengthens the back and hips. Child\u2019s Pose is the classic place to return to whenever the breath needs to slow down.',
    difficulty: 'beginner',
    category: 'restorative',
    benefits: [
      'Releases the lower back and hips',
      'Calms the nervous system',
      'Gently stretches the spine and shoulders',
      'A safe resting position at any point in a practice',
    ],
    instructions: [
      'Kneel on the mat with the big toes touching and the knees hip-width apart.',
      'Sit the hips back towards the heels.',
      'Fold forward and rest the forehead on the mat or on a cushion.',
      'Extend the arms forward or rest them alongside the body.',
      'Let the whole body feel heavy and supported.',
      'Stay for 1–3 minutes, breathing into the back of the ribs.',
    ],
    breathingInstructions: [
      'Breathe into the back of the body, feeling the ribs widen.',
      'Let the exhale be slightly longer than the inhale.',
    ],
    commonMistakes: [
      'Forcing the hips down towards the heels when they are tight',
      'Tensing the neck instead of letting the head rest',
      'Holding the breath while waiting for the pose to feel comfortable',
    ],
    modifications: [
      'Place a cushion or folded blanket between the hips and heels',
      'Widen the knees to make room for the belly or a pregnancy',
      'Place a cushion under the chest and turn the head to one side',
    ],
    precautions: [
      'Avoid deep knee flexion if you have knee pain — sit on a cushion instead.',
      'Modify with wide knees in pregnancy.',
    ],
    duration: 60,
    imageUrl: poseImage('person resting in childs pose balasana with forehead on the mat'),
    relatedSlugs: ['downward-facing-dog', 'corpse-pose', 'cat-cow-pose'],
    isSystem: true,
  },
  {
    name: 'Cobra Pose',
    slug: 'cobra-pose',
    sanskritName: 'Bhujangasana',
    description:
      'A gentle backbend that strengthens the spine and opens the chest. Cobra Pose counteracts hours of sitting by moving the spine in the opposite direction.',
    difficulty: 'beginner',
    category: 'backbend',
    benefits: [
      'Strengthens the spinal muscles and upper back',
      'Opens the chest and shoulders',
      'Gently stretches the abdomen',
      'Helps improve posture',
    ],
    instructions: [
      'Lie on the belly with the legs extended and the tops of the feet on the mat.',
      'Place the hands under the shoulders, elbows hugging the ribs.',
      'Press the tops of the feet and pubic bone down into the mat.',
      'On an inhale, peel the chest off the floor using the back muscles first.',
      'Use the hands only lightly — keep the elbows slightly bent.',
      'Hold for 15–30 seconds, then lower down slowly on an exhale.',
    ],
    breathingInstructions: [
      'Inhale to lift into the pose.',
      'Exhale to lower the chest back to the mat with control.',
    ],
    commonMistakes: [
      'Pushing up with straight arms and jamming the lower back',
      'Cranking the neck backwards instead of lengthening it',
      'Lifting the shoulders towards the ears',
    ],
    modifications: [
      'Keep the forearms on the mat for a gentler Sphinx variation',
      'Lift only a few centimetres if the back feels sensitive',
      'Place a folded blanket under the hips for support',
    ],
    precautions: [
      'Avoid during pregnancy and with acute lower back or wrist injury.',
      'Stop if you feel pinching in the lower back — reduce the height of the lift.',
    ],
    duration: 30,
    imageUrl: poseImage('person practising cobra pose bhujangasana backbend on a mat'),
    relatedSlugs: ['bridge-pose', 'cat-cow-pose', 'childs-pose'],
    isSystem: true,
  },
  {
    name: 'Cat-Cow Pose',
    slug: 'cat-cow-pose',
    sanskritName: 'Marjaryasana-Bitilasana',
    description:
      'A gentle, rhythmic spinal warm-up that moves the spine through flexion and extension. It is one of the safest ways to begin any practice.',
    difficulty: 'beginner',
    category: 'seated',
    benefits: [
      'Mobilises the whole spine',
      'Eases tension in the back and neck',
      'Synchronises movement with breath',
      'Excellent warm-up before stronger poses',
    ],
    instructions: [
      'Come onto all fours with the wrists under the shoulders and knees under the hips.',
      'Place a blanket under the knees for comfort.',
      'On an inhale, drop the belly, lift the chest and look slightly up (Cow).',
      'On an exhale, round the spine, tuck the chin and press the floor away (Cat).',
      'Move slowly, one vertebra at a time.',
      'Repeat for 8–10 rounds.',
    ],
    breathingInstructions: [
      'Inhale into Cow, exhale into Cat — let the breath lead the movement.',
      'Keep the breath smooth and unforced throughout.',
    ],
    commonMistakes: [
      'Rushing the movement instead of moving with the breath',
      'Forcing the neck to move further than comfortable',
      'Letting the elbows hyperextend',
    ],
    modifications: [
      'Practise seated in a chair, moving the spine gently',
      'Reduce the range of motion if the back feels sensitive',
      'Support the wrists with a folded blanket',
    ],
    precautions: [
      'Keep the neck movement small if you have cervical issues.',
      'Avoid if you have an acute wrist injury — use the seated version.',
    ],
    duration: 45,
    imageUrl: poseImage('person on hands and knees flowing through cat cow spinal stretch'),
    relatedSlugs: ['childs-pose', 'cobra-pose', 'downward-facing-dog'],
    isSystem: true,
  },
  {
    name: 'Bridge Pose',
    slug: 'bridge-pose',
    sanskritName: 'Setu Bandha Sarvangasana',
    description:
      'A supported backbend that strengthens the glutes and opens the chest. Bridge Pose is a gentler alternative to a full shoulder stand.',
    difficulty: 'beginner',
    category: 'backbend',
    benefits: [
      'Strengthens glutes, hamstrings and lower back',
      'Opens the chest and hip flexors',
      'Can ease mild lower-back tension',
      'Accessible backbend for most practitioners',
    ],
    instructions: [
      'Lie on the back with the knees bent and the feet hip-width apart.',
      'Walk the heels close to the hips, keeping the feet parallel.',
      'Press the feet down and lift the hips off the mat.',
      'Roll the shoulders under and clasp the hands beneath the back if comfortable.',
      'Keep the knees tracking straight ahead, not splaying outwards.',
      'Hold for 20–30 seconds, then lower down one vertebra at a time.',
    ],
    breathingInstructions: [
      'Inhale to lift the hips.',
      'Exhale slowly as you lower the spine back to the mat.',
    ],
    commonMistakes: [
      'Pushing the hips up with the lower back instead of the glutes',
      'Letting the knees fall outwards',
      'Turning the head from side to side while the hips are lifted',
    ],
    modifications: [
      'Place a block under the sacrum for a supported Bridge',
      'Lift only part of the way and hold for a shorter time',
      'Place a blanket under the shoulders for comfort',
    ],
    precautions: [
      'Avoid if you have a neck injury or recent spinal surgery.',
      'Keep the head still while the hips are lifted.',
    ],
    duration: 30,
    imageUrl: poseImage('person in bridge pose setu bandha sarvangasana on a cream mat'),
    relatedSlugs: ['cobra-pose', 'corpse-pose', 'cat-cow-pose'],
    isSystem: true,
  },
  {
    name: 'Corpse Pose',
    slug: 'corpse-pose',
    sanskritName: 'Savasana',
    description:
      'The final resting pose. Corpse Pose lets the nervous system absorb the practice, and it is often described as the most important pose of the session.',
    difficulty: 'beginner',
    category: 'restorative',
    benefits: [
      'Deeply relaxes body and mind',
      'Lowers the heart rate and breathing rate',
      'Helps integrate the effects of the practice',
      'Supports better sleep when practised in the evening',
    ],
    instructions: [
      'Lie on the back with the legs extended and the feet falling slightly apart.',
      'Let the arms rest beside the body, palms turned up.',
      'Slide the shoulder blades down away from the ears.',
      'Close the eyes and let the whole body be heavy.',
      'If the lower back aches, place a bolster under the knees.',
      'Stay for 3–10 minutes, then roll to one side before sitting up.',
    ],
    breathingInstructions: [
      'Let the breath be completely natural — do not control it.',
      'Notice the pause at the end of each exhale.',
    ],
    commonMistakes: [
      'Fidgeting or checking the time instead of settling',
      'Skipping the pose to save time',
      'Getting up quickly and feeling light-headed',
    ],
    modifications: [
      'Place a bolster or cushion under the knees for lower-back comfort',
      'Cover the eyes with a light cloth',
      'Practise with the lower legs resting on a chair',
    ],
    precautions: [
      'Avoid lying flat in late pregnancy — lie on the left side instead.',
      'Roll to one side and pause before standing up.',
    ],
    duration: 300,
    imageUrl: poseImage('person resting in corpse pose savasana lying calmly on a yoga mat'),
    relatedSlugs: ['childs-pose', 'legs-up-the-wall', 'bridge-pose'],
    isSystem: true,
  },
  {
    name: 'Legs-Up-the-Wall',
    slug: 'legs-up-the-wall',
    sanskritName: 'Viparita Karani',
    description:
      'A restorative inversion that lets the legs rest above the heart. It is a favourite for tired legs and for winding down in the evening.',
    difficulty: 'beginner',
    category: 'inversion',
    benefits: [
      'Eases tired legs and feet',
      'Gently calms the nervous system',
      'A mild, supported inversion',
      'Helpful before sleep',
    ],
    instructions: [
      'Sit sideways next to a wall with one hip close to it.',
      'Swing the legs up the wall as you lower onto the back.',
      'Move the hips a comfortable distance from the wall — 15–20 cm is plenty.',
      'Rest the arms out to the sides with the palms up.',
      'Cover the eyes if you like and let the legs be heavy.',
      'Stay for 3–5 minutes, then bend the knees and roll to one side.',
    ],
    breathingInstructions: [
      'Let the belly rise and fall naturally.',
      'Try lengthening the exhale slightly to encourage relaxation.',
    ],
    commonMistakes: [
      'Wriggling the hips too close to the wall and straining the hamstrings',
      'Lifting the head to look around',
      'Coming out of the pose too quickly',
    ],
    modifications: [
      'Place a folded blanket under the hips',
      'Bend the knees if the hamstrings feel tight',
      'Rest the legs on a chair instead of the wall',
    ],
    precautions: [
      'Avoid during menstruation if it feels uncomfortable, and in late pregnancy.',
      'Skip if you have glaucoma or uncontrolled high blood pressure.',
    ],
    duration: 240,
    imageUrl: poseImage('person resting with legs up the wall viparita karani restorative pose'),
    relatedSlugs: ['corpse-pose', 'childs-pose', 'downward-facing-dog'],
    isSystem: true,
  },
  {
    name: 'Supine Spinal Twist',
    slug: 'supine-spinal-twist',
    sanskritName: 'Supta Matsyendrasana',
    description:
      'A gentle reclined twist that releases the lower back and outer hips. Because you are lying down, it is easy to let the twist happen rather than forcing it.',
    difficulty: 'beginner',
    category: 'twist',
    benefits: [
      'Releases the lower back and glutes',
      'Gently mobilises the spine',
      'Aids digestion when practised slowly',
      'Very calming before sleep',
    ],
    instructions: [
      'Lie on the back and hug the right knee towards the chest.',
      'Guide the right knee across the body towards the left with the left hand.',
      'Extend the right arm out to the side at shoulder height.',
      'Keep both shoulders resting on the mat.',
      'Stay for 45–60 seconds, breathing slowly, then change sides.',
    ],
    breathingInstructions: [
      'Inhale to lengthen the spine.',
      'Exhale to let the knee soften a little further towards the floor.',
    ],
    commonMistakes: [
      'Forcing the knee down and lifting the opposite shoulder',
      'Turning the head in the opposite direction too aggressively',
      'Rushing from one side to the other',
    ],
    modifications: [
      'Place a cushion under the twisting knee for support',
      'Keep both knees bent and drop them to one side together',
      'Reduce the twist if the lower back feels sensitive',
    ],
    precautions: [
      'Avoid deep twists during pregnancy and after recent spinal surgery.',
      'Keep the movement gentle if you have a disc-related condition.',
    ],
    duration: 60,
    imageUrl: poseImage('person lying in supine spinal twist reclined on a yoga mat'),
    relatedSlugs: ['corpse-pose', 'childs-pose', 'cat-cow-pose'],
    isSystem: true,
  },
  {
    name: 'Seated Forward Bend',
    slug: 'seated-forward-bend',
    sanskritName: 'Paschimottanasana',
    description:
      'A calm, grounding forward fold that stretches the whole back line of the body. With bent knees and a long spine, it is far more accessible than it looks.',
    difficulty: 'beginner',
    category: 'forward-bend',
    benefits: [
      'Stretches hamstrings and lower back',
      'Calms the mind and reduces restlessness',
      'Gently stimulates digestion',
      'Encourages a longer exhale',
    ],
    instructions: [
      'Sit on the mat with the legs extended in front of you.',
      'Sit up on a folded blanket so the pelvis can tip forward.',
      'Bend the knees generously to begin with.',
      'Inhale and lengthen the spine, then exhale and fold forward from the hips.',
      'Hold the shins, ankles or use a strap around the feet.',
      'Stay for 45–60 seconds, breathing into the back of the ribs.',
    ],
    breathingInstructions: [
      'Inhale to lengthen, exhale to fold a little deeper.',
      'Keep the breath slow — never force the fold by pulling with the arms.',
    ],
    commonMistakes: [
      'Rounding the spine and yanking with the arms',
      'Locking the knees to appear more flexible',
      'Holding the breath while reaching for the feet',
    ],
    modifications: [
      'Bend the knees generously and hold the shins',
      'Loop a strap around the feet to keep the shoulders relaxed',
      'Sit on a cushion to make the forward tilt easier',
    ],
    precautions: [
      'Avoid if you have an acute lower-back or hamstring injury.',
      'Modify with a wide-legged fold during pregnancy.',
    ],
    duration: 60,
    imageUrl: poseImage('person seated forward bend paschimottanasana calm stretch on a mat'),
    relatedSlugs: ['childs-pose', 'supine-spinal-twist', 'downward-facing-dog'],
    isSystem: true,
  },
]

export const ROUTINES = [
  {
    title: 'Morning Energiser',
    description:
      'A gentle 20-minute wake-up flow. It mobilises the spine, warms the legs and finishes with a short rest so you start the day steady rather than rushed.',
    goal: 'general-wellness',
    difficulty: 'beginner',
    intensity: 'gentle',
    durationMinutes: 20,
    tags: ['morning', 'beginner', 'energising'],
    warmUp: [
      'Sit on the mat and take five slow breaths before you begin.',
      'Move through Cat-Cow for a full minute to wake the spine.',
    ],
    coolDown: [
      'Finish with 3 minutes of Corpse Pose.',
      'Notice how the body feels compared with when you started.',
    ],
    breathingReminders: [
      'Keep the breath smooth throughout — no straining.',
      'If you are short on time, do the warm-up and the first two poses only.',
    ],
    poses: [
      { slug: 'cat-cow-pose', durationSeconds: 45, restSeconds: 10, part: 'warm-up', notes: 'One breath per movement.' },
      { slug: 'mountain-pose', durationSeconds: 30, restSeconds: 10, part: 'warm-up', notes: 'Find an even, grounded stance.' },
      { slug: 'downward-facing-dog', durationSeconds: 45, restSeconds: 20, part: 'main', notes: 'Bend the knees as much as you need.' },
      { slug: 'warrior-ii', durationSeconds: 40, restSeconds: 15, part: 'main', notes: 'Hold each side and breathe steadily.' },
      { slug: 'tree-pose', durationSeconds: 30, restSeconds: 15, part: 'main', notes: 'Fix the gaze on one still point.' },
      { slug: 'bridge-pose', durationSeconds: 30, restSeconds: 15, part: 'main', notes: 'Press through the feet, not the lower back.' },
      { slug: 'supine-spinal-twist', durationSeconds: 60, restSeconds: 10, part: 'cool-down', notes: 'Both sides, letting gravity do the work.' },
      { slug: 'corpse-pose', durationSeconds: 180, restSeconds: 0, part: 'cool-down', notes: 'Let the breath return to normal.' },
    ],
  },
  {
    title: 'Stress Melt & Unwind',
    description:
      'A slow 18-minute evening practice built around long exhales. Everything is supported and floor-based, so it works even on a low-energy day.',
    goal: 'stress-relief',
    difficulty: 'beginner',
    intensity: 'gentle',
    durationMinutes: 18,
    tags: ['evening', 'stress', 'restorative'],
    warmUp: [
      'Lie down and take ten natural breaths before starting.',
      'Keep a cushion nearby for support.',
    ],
    coolDown: [
      'Finish with 4 minutes of Corpse Pose.',
      'Try 8 slow breaths with a longer exhale before you get up.',
    ],
    breathingReminders: [
      'Aim for a 4-count inhale and a 6-count exhale.',
      'Never hold the breath — the exhale is doing the work here.',
    ],
    poses: [
      { slug: 'cat-cow-pose', durationSeconds: 60, restSeconds: 10, part: 'warm-up', notes: 'Slow and rhythmic.' },
      { slug: 'childs-pose', durationSeconds: 90, restSeconds: 15, part: 'main', notes: 'Use a cushion under the hips.' },
      { slug: 'seated-forward-bend', durationSeconds: 60, restSeconds: 15, part: 'main', notes: 'Bend the knees generously.' },
      { slug: 'supine-spinal-twist', durationSeconds: 60, restSeconds: 15, part: 'main', notes: 'One minute on each side.' },
      { slug: 'legs-up-the-wall', durationSeconds: 180, restSeconds: 10, part: 'main', notes: 'Let the legs be completely heavy.' },
      { slug: 'corpse-pose', durationSeconds: 240, restSeconds: 0, part: 'cool-down', notes: 'Do not skip this one.' },
    ],
  },
  {
    title: 'Core & Strength Builder',
    description:
      'A 25-minute intermediate session that builds leg and core strength through longer holds, with a full cool-down so you are not left feeling wired.',
    goal: 'strength',
    difficulty: 'intermediate',
    intensity: 'moderate',
    durationMinutes: 25,
    tags: ['strength', 'intermediate', 'core'],
    warmUp: [
      'Two minutes of Cat-Cow and a few Downward Dogs to warm the shoulders.',
      'Shake out the wrists and ankles before the standing work.',
    ],
    coolDown: [
      'Finish with a Supine Spinal Twist on both sides.',
      'Close with 3 minutes of Corpse Pose.',
    ],
    breathingReminders: [
      'Keep the breath strong but never ragged.',
      'Come out of a hold one breath earlier than you think you need to.',
    ],
    poses: [
      { slug: 'cat-cow-pose', durationSeconds: 60, restSeconds: 10, part: 'warm-up', notes: 'Warm the spine thoroughly.' },
      { slug: 'downward-facing-dog', durationSeconds: 60, restSeconds: 20, part: 'warm-up', notes: 'Press the floor away.' },
      { slug: 'warrior-i', durationSeconds: 45, restSeconds: 20, part: 'main', notes: 'Both sides, keep the back heel down.' },
      { slug: 'warrior-ii', durationSeconds: 45, restSeconds: 20, part: 'main', notes: 'Front knee over the ankle.' },
      { slug: 'bridge-pose', durationSeconds: 40, restSeconds: 20, part: 'main', notes: 'Squeeze through the glutes.' },
      { slug: 'cobra-pose', durationSeconds: 30, restSeconds: 20, part: 'main', notes: 'Lift with the back, not the hands.' },
      { slug: 'tree-pose', durationSeconds: 40, restSeconds: 20, part: 'main', notes: 'Balance is the strength work here.' },
      { slug: 'supine-spinal-twist', durationSeconds: 60, restSeconds: 10, part: 'cool-down', notes: 'Release the lower back.' },
      { slug: 'corpse-pose', durationSeconds: 180, restSeconds: 0, part: 'cool-down', notes: 'Let the heart rate settle.' },
    ],
  },
]

export default { POSES, ROUTINES }
