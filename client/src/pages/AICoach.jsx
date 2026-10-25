import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  Check,
  Info,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  VideoOff,
  X,
} from 'lucide-react'

import SmartTimer from '../components/SmartTimer.jsx'
import { DemoBadge, FadeIn, SectionHeading } from '../components/ui.jsx'
import { Spinner } from '../components/Loader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { poseService, progressService } from '../services/yogaService.js'

/* -------------------------------------------------------------------------- */
/* MediaPipe assets                                                           */
/* -------------------------------------------------------------------------- */

const TASKS_VISION_VERSION = '0.10.14'
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

/* -------------------------------------------------------------------------- */
/* Landmark helpers                                                           */
/* -------------------------------------------------------------------------- */

const L = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFoot: 31,
  rightFoot: 32,
}

const SKELETON_CONNECTIONS = [
  [L.leftShoulder, L.rightShoulder],
  [L.leftShoulder, L.leftElbow],
  [L.leftElbow, L.leftWrist],
  [L.rightShoulder, L.rightElbow],
  [L.rightElbow, L.rightWrist],
  [L.leftShoulder, L.leftHip],
  [L.rightShoulder, L.rightHip],
  [L.leftHip, L.rightHip],
  [L.leftHip, L.leftKnee],
  [L.leftKnee, L.leftAnkle],
  [L.leftAnkle, L.leftHeel],
  [L.leftHeel, L.leftFoot],
  [L.rightHip, L.rightKnee],
  [L.rightKnee, L.rightAnkle],
  [L.rightAnkle, L.rightHeel],
  [L.rightHeel, L.rightFoot],
]

/** Landmarks that must be visible for posture feedback to be meaningful. */
const KEY_LANDMARKS = [
  L.leftShoulder,
  L.rightShoulder,
  L.leftHip,
  L.rightHip,
  L.leftKnee,
  L.rightKnee,
  L.leftAnkle,
  L.rightAnkle,
]

const MIN_VISIBILITY = 0.55

/** Angle at point `b`, in degrees. */
function jointAngle(a, b, c) {
  if (!a || !b || !c) return null
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const magnitude = Math.hypot(abx, aby) * Math.hypot(cbx, cby)
  if (magnitude === 0) return null
  const cosine = Math.max(-1, Math.min(1, (abx * cbx + aby * cby) / magnitude))
  return Math.round((Math.acos(cosine) * 180) / Math.PI)
}

/** How far the torso leans away from vertical, in degrees (0 = perfectly upright). */
function torsoLean(landmarks) {
  const shoulder = landmarks[L.leftShoulder]
  const hip = landmarks[L.leftHip]
  if (!shoulder || !hip) return null
  const dx = shoulder.x - hip.x
  const dy = shoulder.y - hip.y
  if (dy === 0 && dx === 0) return null
  return Math.round(Math.abs((Math.atan2(dx, dy) * 180) / Math.PI))
}

/**
 * All tunable numbers live here so the thresholds are easy to inspect and adjust.
 * They are deliberately generous — this is a practice aid, not a measuring tool.
 */
const THRESHOLDS = {
  levelTolerance: 0.05, // normalised screen units
  straightArm: 150, // degrees at the elbow
  straightLeg: 155, // degrees at the knee
  bentKnee: [75, 115], // degrees at the knee for a right-angle lunge
  uprightTorso: 22, // degrees of lean allowed before we comment
  overheadWrist: -0.02, // wrists should be at/above shoulder height
}

/* -------------------------------------------------------------------------- */
/* Reference poses — slug, guidance and the checks we can honestly run         */
/* -------------------------------------------------------------------------- */

const REFERENCE_POSES = [
  {
    slug: 'mountain-pose',
    name: 'Mountain Pose',
    cameraTip: 'Stand side-on so your whole body, from feet to head, fills the frame.',
    checks: [
      {
        id: 'shoulders-level',
        label: 'Shoulders roughly level',
        hint: 'Try keeping your shoulders level — soften the side that is riding higher.',
        test: (p) => Math.abs(p[L.leftShoulder].y - p[L.rightShoulder].y) < THRESHOLDS.levelTolerance,
      },
      {
        id: 'hips-level',
        label: 'Hips even',
        hint: 'Your hips look uneven. Spread your weight evenly across both feet.',
        test: (p) => Math.abs(p[L.leftHip].y - p[L.rightHip].y) < THRESHOLDS.levelTolerance,
      },
      {
        id: 'torso-upright',
        label: 'Back upright',
        hint: 'Try keeping your back more upright — lengthen through the crown of the head.',
        test: (p) => (torsoLean(p) ?? 0) < THRESHOLDS.uprightTorso,
      },
      {
        id: 'arms-relaxed',
        label: 'Arms alongside the body',
        hint: 'Let your arms rest down beside you rather than lifting them.',
        test: (p) => p[L.leftWrist].y > p[L.leftShoulder].y && p[L.rightWrist].y > p[L.rightShoulder].y,
      },
    ],
  },
  {
    slug: 'tree-pose',
    name: 'Tree Pose',
    cameraTip: 'Face the camera with a little space around you so both legs stay visible.',
    checks: [
      {
        id: 'foot-lifted',
        label: 'One foot lifted',
        hint: 'Lift one foot so it rests on the standing leg — calf or inner thigh.',
        test: (p) => {
          const lifted = [L.leftAnkle, L.rightAnkle]
          return lifted.some((ankle, index) => {
            const other = lifted[(index + 1) % 2]
            const knee = index === 0 ? L.leftKnee : L.rightKnee
            return p[ankle].y < p[other].y && p[ankle].y > p[knee].y
          })
        },
      },
      {
        id: 'standing-leg-straight',
        label: 'Standing leg steady',
        hint: 'Keep the standing leg strong but not locked — engage the thigh.',
        test: (p) => {
          const left = jointAngle(p[L.leftHip], p[L.leftKnee], p[L.leftAnkle])
          const right = jointAngle(p[L.rightHip], p[L.rightKnee], p[L.rightAnkle])
          return Math.max(left ?? 0, right ?? 0) > 150
        },
      },
      {
        id: 'shoulders-level',
        label: 'Shoulders level',
        hint: 'Your shoulders look uneven — even them out before lifting the arms.',
        test: (p) => Math.abs(p[L.leftShoulder].y - p[L.rightShoulder].y) < THRESHOLDS.levelTolerance * 1.4,
      },
      {
        id: 'hands-together',
        label: 'Arms in a steady position',
        hint: 'Bring the palms together at the chest, or overhead if that is available today.',
        test: (p) => {
          const handsClose = Math.abs(p[L.leftWrist].x - p[L.rightWrist].x) < 0.28
          const bothUp = p[L.leftWrist].y < p[L.leftHip].y && p[L.rightWrist].y < p[L.rightHip].y
          return handsClose && bothUp
        },
      },
    ],
  },
  {
    slug: 'warrior-ii',
    name: 'Warrior II',
    cameraTip: 'Stand side-on to the camera so both legs and both arms are in view.',
    checks: [
      {
        id: 'front-knee-bent',
        label: 'Front knee bent to about 90°',
        hint: 'Bend the front knee so it stacks over the ankle, around a right angle.',
        test: (p) => {
          const left = jointAngle(p[L.leftHip], p[L.leftKnee], p[L.leftAnkle])
          const right = jointAngle(p[L.rightHip], p[L.rightKnee], p[L.rightAnkle])
          return [left, right].some(
            (angle) => angle !== null && angle >= THRESHOLDS.bentKnee[0] && angle <= THRESHOLDS.bentKnee[1]
          )
        },
      },
      {
        id: 'arms-horizontal',
        label: 'Arms reaching out level',
        hint: 'Your arms appear uneven — reach them out at shoulder height in both directions.',
        test: (p) =>
          Math.abs(p[L.leftWrist].y - p[L.leftShoulder].y) < 0.12 &&
          Math.abs(p[L.rightWrist].y - p[L.rightShoulder].y) < 0.12,
      },
      {
        id: 'torso-upright',
        label: 'Torso stacked and upright',
        hint: 'Try keeping your back more upright rather than leaning forward over the front leg.',
        test: (p) => (torsoLean(p) ?? 0) < THRESHOLDS.uprightTorso + 8,
      },
    ],
  },
  {
    slug: 'warrior-i',
    name: 'Warrior I',
    cameraTip: 'Stand side-on with room above your head for the raised arms.',
    checks: [
      {
        id: 'front-knee-bent',
        label: 'Front knee bent',
        hint: 'Bend the front knee towards a right angle, keeping it over the ankle.',
        test: (p) => {
          const left = jointAngle(p[L.leftHip], p[L.leftKnee], p[L.leftAnkle])
          const right = jointAngle(p[L.rightHip], p[L.rightKnee], p[L.rightAnkle])
          return [left, right].some(
            (angle) => angle !== null && angle >= THRESHOLDS.bentKnee[0] && angle <= THRESHOLDS.bentKnee[1]
          )
        },
      },
      {
        id: 'arms-overhead',
        label: 'Arms reaching up',
        hint: 'Reach both arms overhead rather than out to the sides.',
        test: (p) => p[L.leftWrist].y < p[L.leftShoulder].y && p[L.rightWrist].y < p[L.rightShoulder].y,
      },
      {
        id: 'torso-upright',
        label: 'Spine long and upright',
        hint: 'Try keeping your back more upright — lift through the chest.',
        test: (p) => (torsoLean(p) ?? 0) < THRESHOLDS.uprightTorso + 8,
      },
    ],
  },
  {
    slug: 'downward-facing-dog',
    name: 'Downward-Facing Dog',
    cameraTip: 'Side-on is easiest here: the hips should sit higher than the shoulders.',
    checks: [
      {
        id: 'hips-high',
        label: 'Hips above the shoulders',
        hint: 'Lift the hips higher and press the floor away so the shape becomes an inverted V.',
        test: (p) => {
          const hipY = (p[L.leftHip].y + p[L.rightHip].y) / 2
          const shoulderY = (p[L.leftShoulder].y + p[L.rightShoulder].y) / 2
          return hipY < shoulderY
        },
      },
      {
        id: 'arms-straight',
        label: 'Arms strong and long',
        hint: 'Straighten the arms and draw the shoulders away from the ears.',
        test: (p) =>
          (jointAngle(p[L.leftShoulder], p[L.leftElbow], p[L.leftWrist]) ?? 0) > THRESHOLDS.straightArm &&
          (jointAngle(p[L.rightShoulder], p[L.rightElbow], p[L.rightWrist]) ?? 0) > THRESHOLDS.straightArm,
      },
      {
        id: 'legs-straight',
        label: 'Legs relatively straight',
        hint: 'Lengthen the legs, lifting the heels if the hamstrings feel tight.',
        test: (p) =>
          (jointAngle(p[L.leftHip], p[L.leftKnee], p[L.leftAnkle]) ?? 0) > 140 &&
          (jointAngle(p[L.rightHip], p[L.rightKnee], p[L.rightAnkle]) ?? 0) > 140,
      },
    ],
  },
  {
    slug: 'cat-cow-pose',
    name: 'Cat-Cow Pose',
    cameraTip: 'Side-on works best: keep wrists, shoulders, hips and knees visible.',
    checks: [
      {
        id: 'tabletop',
        label: 'Hips and shoulders roughly level',
        hint: 'Set up on all fours with the back roughly parallel to the floor.',
        test: (p) => Math.abs(p[L.leftShoulder].y - p[L.leftHip].y) < 0.22,
      },
      {
        id: 'wrists-under-shoulders',
        label: 'Wrists under the shoulders',
        hint: 'Stack the wrists beneath the shoulders rather than reaching forward.',
        test: (p) =>
          Math.abs(p[L.leftWrist].x - p[L.leftShoulder].x) < 0.12 &&
          Math.abs(p[L.rightWrist].x - p[L.rightShoulder].x) < 0.12,
      },
      {
        id: 'knees-under-hips',
        label: 'Knees under the hips',
        hint: 'Bring the knees beneath the hips to protect the lower back.',
        test: (p) =>
          Math.abs(p[L.leftKnee].x - p[L.leftHip].x) < 0.16 &&
          Math.abs(p[L.rightKnee].x - p[L.rightHip].x) < 0.16,
      },
    ],
  },
  {
    slug: 'cobra-pose',
    name: 'Cobra Pose',
    cameraTip: 'A low camera angle works best — place the device on the floor beside the mat.',
    checks: [
      {
        id: 'chest-lifted',
        label: 'Chest lifting away from the floor',
        hint: 'Press the tops of the feet down and draw the chest forward and up.',
        test: (p) => p[L.leftShoulder].y < p[L.leftHip].y && p[L.rightShoulder].y < p[L.rightHip].y,
      },
      {
        id: 'elbows-supported',
        label: 'Elbows softly bent',
        hint: 'Keep a slight bend in the elbows instead of locking the arms.',
        test: (p) => {
          const left = jointAngle(p[L.leftShoulder], p[L.leftElbow], p[L.leftWrist])
          const right = jointAngle(p[L.rightShoulder], p[L.rightElbow], p[L.rightWrist])
          return [left, right].some((angle) => angle !== null && angle > 120)
        },
      },
      {
        id: 'torso-long',
        label: 'Length through the spine',
        hint: 'Lengthen the spine as you lift rather than compressing the lower back.',
        test: (p) => Math.abs(p[L.leftShoulder].y - p[L.rightShoulder].y) < THRESHOLDS.levelTolerance * 1.5,
      },
    ],
  },
]

/** Poses that a front-facing webcam genuinely cannot assess. */
const UNSUPPORTED_SLUGS = ['childs-pose', 'bridge-pose', 'corpse-pose']

export default function AICoach() {
  const { user } = useAuth()
  const toast = useToast()

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const pausedRef = useRef(false)
  const poseRef = useRef(null)

  const [modelState, setModelState] = useState('idle') // idle | loading | ready | error
  const [cameraState, setCameraState] = useState('idle') // idle | requesting | live | error
  const [permissionAccepted, setPermissionAccepted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(REFERENCE_POSES[0].slug)
  const [referencePose, setReferencePose] = useState(null)
  const [referenceLoading, setReferenceLoading] = useState(false)
  const [observations, setObservations] = useState([])
  const [confidence, setConfidence] = useState(null)
  const [bodyVisible, setBodyVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const [cameraFree, setCameraFree] = useState(false)
  const [detections, setDetections] = useState(0)

  const reference = useMemo(
    () => REFERENCE_POSES.find((pose) => pose.slug === selectedSlug) || REFERENCE_POSES[0],
    [selectedSlug]
  )

  useEffect(() => {
    poseRef.current = reference
  }, [reference])

  /* ------------------------------------------------------------------ */
  /* Reference pose library data (instructions + duration for the timer) */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let active = true
    setReferenceLoading(true)

    poseService
      .get(selectedSlug)
      .then(({ data }) => {
        if (active) setReferencePose(data || null)
      })
      .catch(() => {
        if (active) setReferencePose(null)
      })
      .finally(() => {
        if (active) setReferenceLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedSlug])

  /* ------------------------------------------------------------------ */
  /* Model + camera lifecycle                                            */
  /* ------------------------------------------------------------------ */

  const loadModel = useCallback(async () => {
    if (landmarkerRef.current || modelState === 'loading') return landmarkerRef.current

    setModelState('loading')
    setErrorMessage('')
    try {
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE)

      const options = {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }

      let landmarker
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, options)
      } catch {
        // Some machines/GPUs fall back to CPU more reliably.
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
        })
      }

      landmarkerRef.current = landmarker
      setModelState('ready')
      return landmarker
    } catch (error) {
      setModelState('error')
      setErrorMessage(
        'The on-device pose model could not be downloaded. Check your internet connection (the model loads from a public CDN the first time), or use the camera-free practice mode below.'
      )
      return null
    }
  }, [modelState])

  const drawFrame = useCallback((landmarks) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
    }

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    if (!landmarks || landmarks.length === 0) return

    // Mirror the overlay so it matches the selfie view of the video.
    context.save()
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.lineWidth = 3
    context.strokeStyle = '#75a583'
    context.lineCap = 'round'

    SKELETON_CONNECTIONS.forEach(([start, end]) => {
      const a = landmarks[start]
      const b = landmarks[end]
      if (!a || !b) return
      if ((a.visibility ?? 1) < MIN_VISIBILITY || (b.visibility ?? 1) < MIN_VISIBILITY) return
      context.beginPath()
      context.moveTo(a.x * canvas.width, a.y * canvas.height)
      context.lineTo(b.x * canvas.width, b.y * canvas.height)
      context.stroke()
    })

    context.fillStyle = '#8b68c7'
    landmarks.forEach((point, index) => {
      if ((point.visibility ?? 1) < MIN_VISIBILITY) return
      // Draw the joints we actually reason about more prominently.
      const isKey = KEY_LANDMARKS.includes(index)
      context.beginPath()
      context.arc(point.x * canvas.width, point.y * canvas.height, isKey ? 5 : 3, 0, Math.PI * 2)
      context.fill()
    })

    context.restore()
  }, [])

  const analyse = useCallback((landmarks) => {
    const active = poseRef.current
    if (!active) return

    const visibleKeys = KEY_LANDMARKS.filter((index) => (landmarks[index]?.visibility ?? 0) >= MIN_VISIBILITY).length
    const keysVisible = visibleKeys >= 6

    const meanVisibility =
      KEY_LANDMARKS.reduce((sum, index) => sum + (landmarks[index]?.visibility ?? 0), 0) / KEY_LANDMARKS.length
    setConfidence(Math.round(Math.min(1, Math.max(0, meanVisibility)) * 100))
    setBodyVisible(keysVisible)

    if (!keysVisible) {
      setObservations([])
      return
    }

    const results = active.checks.map((check) => {
      let pass = false
      try {
        pass = Boolean(check.test(landmarks))
      } catch {
        pass = false
      }
      return { id: check.id, label: check.label, hint: check.hint, pass }
    })

    setObservations(results)
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const loop = useCallback(() => {
    const video = videoRef.current
    const landmarker = landmarkerRef.current

    if (!video || !landmarker) {
      rafRef.current = requestAnimationFrame(loop)
      return
    }

    if (!pausedRef.current && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime
      try {
        const result = landmarker.detectForVideo(video, performance.now())
        const landmarks = result?.landmarks?.[0]
        drawFrame(landmarks)
        if (landmarks) {
          analyse(landmarks)
          setDetections((count) => count + 1)
        } else {
          setConfidence(null)
          setBodyVisible(false)
          setObservations([])
        }
      } catch {
        // A single dropped frame should never kill the session.
      }
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [analyse, drawFrame])

  const stopCamera = useCallback(() => {
    stopLoop()
    pausedRef.current = false
    setPaused(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null

    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)

    setCameraState('idle')
    setConfidence(null)
    setObservations([])
    setBodyVisible(false)
  }, [stopLoop])

  const startCamera = useCallback(async () => {
    setErrorMessage('')
    setCameraState('requesting')

    const landmarker = await loadModel()
    if (!landmarker) {
      setCameraState('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })

      streamRef.current = stream
      const video = videoRef.current
      if (!video) return

      video.srcObject = stream
      await video.play().catch(() => {})
      setCameraState('live')
      pausedRef.current = false
      setPaused(false)
      stopLoop()
      rafRef.current = requestAnimationFrame(loop)
    } catch (error) {
      setCameraState('error')
      setErrorMessage(
        error?.name === 'NotAllowedError'
          ? 'Camera permission was declined. You can still practise without a camera using the camera-free mode below.'
          : 'We could not start the camera. Check that no other app is using it, then try again — or use the camera-free mode.'
      )
    }
  }, [loadModel, loop, stopLoop])

  const togglePause = () => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }

  // Tear everything down when the page unmounts.
  useEffect(
    () => () => {
      stopLoop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      landmarkerRef.current?.close?.()
      landmarkerRef.current = null
    },
    [stopLoop]
  )

  /* ------------------------------------------------------------------ */
  /* Camera-free practice                                               */
  /* ------------------------------------------------------------------ */

  const cameraFreeRoutine = useMemo(() => {
    if (!referencePose) return null
    return {
      _id: null,
      title: `${referencePose.name} · guided practice`,
      sessionType: 'pose',
      poses: [
        {
          pose: referencePose,
          durationSeconds: Math.max(20, Math.min(referencePose.duration || 30, 90)),
          restSeconds: 0,
          part: 'main',
          notes: referencePose.breathingInstructions?.[0] || '',
        },
      ],
    }
  }, [referencePose])

  const handleCameraFreeComplete = async (summary) => {
    try {
      const { data, message } = await progressService.saveSession({
        routineId: null,
        title: summary.title,
        type: 'pose',
        durationMinutes: summary.durationMinutes,
        completedPoses: summary.completedPoses,
      })
      toast.success(message || 'Session saved.')
      ;(data?.newlyEarned || []).forEach((badge) =>
        toast.success(`Badge unlocked: ${badge.name}`, { title: 'Milestone reached' })
      )
    } catch (error) {
      throw new Error(getErrorMessage(error, 'We could not save this session.'))
    }
  }

  const isSupported = !UNSUPPORTED_SLUGS.includes(selectedSlug)
  const passingCount = observations.filter((item) => item.pass).length

  return (
    <div className="container-x section">
      <SectionHeading
        eyebrow="AI yoga coach"
        title="Practise with gentle posture feedback"
        description="Your camera feed is analysed entirely inside this browser tab. Nothing is uploaded, stored or recorded — only the practice session you choose to save is written to your account."
        action={<DemoBadge>On-device pose estimation</DemoBadge>}
      />

      {/* Privacy + limitations ---------------------------------------- */}
      <FadeIn className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card flex items-start gap-3 border-sage-200 bg-sage-50/70 p-5 dark:border-sage-700 dark:bg-sage-900/30">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-sage-600 dark:text-sage-300" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-ink">How your camera is used</h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
              <li>· We ask for permission before the camera is switched on, and you can stop it at any time.</li>
              <li>· Frames are processed on your device by the MediaPipe Pose Landmarker model.</li>
              <li>· No video or image ever leaves your browser, and nothing is recorded by YogAI.</li>
              <li>· Only the session summary (duration and poses) is saved, and only if you ask us to.</li>
            </ul>
          </div>
        </div>

        <div className="card flex items-start gap-3 border-amber-200 bg-amber-50/70 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-ink">What this honestly cannot do</h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
              <li>· It cannot guarantee that your posture is correct, and it is not a medical assessment.</li>
              <li>· Accuracy varies with lighting, camera angle, clothing and body proportions.</li>
              <li>· Feedback is approximate and limited to a few joint angles.</li>
              <li>· Stop immediately if you feel any pain, and speak to a qualified professional if it continues.</li>
            </ul>
            <Link to="/safety" className="link mt-2 inline-block text-xs">
              Read the safety disclaimer
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Pose selector ------------------------------------------------ */}
      <FadeIn className="mt-6">
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Choose a pose to check</h2>
              <p className="mt-1 text-sm text-muted">{reference.cameraTip}</p>
            </div>
            <button
              type="button"
              onClick={() => setCameraFree((value) => !value)}
              className={`btn ${cameraFree ? 'btn-secondary' : 'btn-outline'} btn-sm`}
              aria-pressed={cameraFree}
            >
              {cameraFree ? <Camera size={14} aria-hidden="true" /> : <VideoOff size={14} aria-hidden="true" />}
              {cameraFree ? 'Back to camera mode' : 'Practise without a camera'}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {REFERENCE_POSES.map((pose) => {
              const active = pose.slug === selectedSlug
              return (
                <button
                  key={pose.slug}
                  type="button"
                  onClick={() => setSelectedSlug(pose.slug)}
                  aria-pressed={active}
                  className={`chip ${active ? 'chip-active' : ''}`}
                >
                  {pose.name}
                </button>
              )
            })}
            {UNSUPPORTED_SLUGS.map((slug) => (
              <span
                key={slug}
                className="chip cursor-not-allowed opacity-60"
                title="This pose cannot be assessed reliably from a front-facing webcam"
              >
                {slug.replace(/-/g, ' ')}
              </span>
            ))}
          </div>

          {!isSupported && (
            <p className="mt-4 rounded-2xl border border-lavender-200 bg-lavender-50 px-4 py-3 text-xs leading-relaxed text-lavender-900 dark:border-lavender-700 dark:bg-lavender-950/40 dark:text-lavender-100">
              Poses like Child&apos;s Pose, Bridge and Corpse are lying-down shapes that a front-facing camera cannot judge
              reliably, so YogAI will not pretend to score them. Use the camera-free guided practice instead.
            </p>
          )}
        </div>
      </FadeIn>

      {/* Main experience ---------------------------------------------- */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Camera panel ------------------------------------------------ */}
        <FadeIn className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Live session</h2>
            <div className="flex flex-wrap items-center gap-2">
              {modelState === 'loading' && (
                <span className="chip">
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" /> Loading pose model…
                </span>
              )}
              {cameraState === 'live' && (
                <span className="chip border-sage-300 text-sage-700 dark:text-sage-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage-500" aria-hidden="true" /> Camera on
                </span>
              )}
              {cameraState === 'live' && (
                <span className="chip">
                  <Sparkles size={12} aria-hidden="true" /> {detections} frames analysed
                </span>
              )}
            </div>
          </div>

          <div className="relative aspect-video w-full bg-sage-900/90">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full scale-x-[-1] object-cover"
              aria-label="Live camera preview"
            />
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />

            {cameraState !== 'live' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white/90">
                {cameraState === 'requesting' ? (
                  <>
                    <Loader2 size={26} className="animate-spin" aria-hidden="true" />
                    <p className="text-sm font-medium">Starting the camera…</p>
                  </>
                ) : (
                  <>
                    <Camera size={30} aria-hidden="true" />
                    <p className="max-w-sm text-sm">
                      {cameraFree
                        ? 'Camera mode is off. Follow the guided practice on the right instead.'
                        : 'Turn on your camera to see the skeleton overlay and posture observations on screen.'}
                    </p>
                    {!cameraFree && (
                      <button
                        type="button"
                        onClick={() => {
                          setPermissionAccepted(true)
                          startCamera()
                        }}
                        disabled={cameraState === 'requesting'}
                        className="btn-primary mt-1"
                      >
                        <Camera size={16} aria-hidden="true" /> Turn on camera
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {cameraState === 'live' && paused && (
              <div className="absolute inset-0 grid place-items-center bg-sage-900/60 text-white">
                <p className="text-sm font-semibold">Paused — analysis is stopped</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {cameraState === 'live' ? (
                <>
                  <button type="button" onClick={togglePause} className="btn-outline btn-sm">
                    {paused ? (
                      <>
                        <Play size={14} aria-hidden="true" /> Resume analysis
                      </>
                    ) : (
                      <>
                        <Pause size={14} aria-hidden="true" /> Pause analysis
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="btn-ghost btn-sm text-red-600 dark:text-red-300"
                  >
                    <X size={14} aria-hidden="true" /> Stop session
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPermissionAccepted(true)
                    startCamera()
                  }}
                  disabled={cameraState === 'requesting'}
                  className="btn-primary btn-sm"
                >
                  {cameraState === 'requesting' ? (
                    <>
                      <Spinner size="sm" /> Starting…
                    </>
                  ) : (
                    <>
                      <Camera size={14} aria-hidden="true" /> {cameraState === 'error' ? 'Try camera again' : 'Start session'}
                    </>
                  )}
                </button>
              )}
            </div>

            {permissionAccepted && cameraState === 'idle' && (
              <p className="text-xs text-muted">Camera stopped. Nothing was recorded.</p>
            )}
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="mx-5 mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
            >
              {errorMessage}
            </p>
          )}
        </FadeIn>

        {/* Feedback panel --------------------------------------------- */}
        <FadeIn delay={0.05} className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">Posture observations</h2>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Confidence</p>
                <p className="font-display text-xl font-semibold text-ink">
                  {confidence === null ? '—' : `${confidence}%`}
                </p>
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-sage-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (confidence ?? 0) >= 70 ? 'bg-sage-500' : (confidence ?? 0) >= 40 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${confidence ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Confidence reflects how clearly the model can see your key joints — not how correct your pose is.
            </p>

            <div className="mt-5">
              {cameraState !== 'live' ? (
                <p className="rounded-2xl border border-line bg-surface/60 px-4 py-6 text-center text-xs text-muted">
                  Start the camera to receive feedback. In camera-free mode, follow the written guidance instead.
                </p>
              ) : !bodyVisible ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  <p className="font-semibold">Move back so your entire body is visible.</p>
                  <p className="mt-1">
                    We need to see your shoulders, hips, knees and ankles. Improve the lighting and step back a little.
                  </p>
                </div>
              ) : observations.length === 0 ? (
                <p className="rounded-2xl border border-line bg-surface/60 px-4 py-6 text-center text-xs text-muted">
                  Hold the pose in view for a moment and observations will appear here.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted">
                    {passingCount} of {observations.length} checks look comfortable right now.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {observations.map((item) => (
                      <li
                        key={item.id}
                        className={`rounded-2xl border px-3 py-2.5 text-xs leading-relaxed ${
                          item.pass
                            ? 'border-sage-200 bg-sage-50/70 dark:border-sage-700 dark:bg-sage-900/30'
                            : 'border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${
                              item.pass ? 'bg-sage-500' : 'bg-amber-500'
                            }`}
                          >
                            {item.pass ? <Check size={11} aria-hidden="true" /> : <Info size={11} aria-hidden="true" />}
                          </span>
                          <div>
                            <p className="font-semibold text-ink">{item.label}</p>
                            {!item.pass && <p className="mt-0.5 text-muted">{item.hint}</p>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Reference guidance ---------------------------------------- */}
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">Reference guidance</h2>
              {referenceLoading && <Loader2 size={15} className="animate-spin text-muted" aria-hidden="true" />}
            </div>

            {referencePose ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted">{referencePose.description}</p>

                {referencePose.instructions?.length > 0 && (
                  <ol className="mt-4 space-y-2">
                    {referencePose.instructions.slice(0, 6).map((step, index) => (
                      <li key={step} className="flex gap-2 text-xs leading-relaxed text-muted">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage-100 text-[11px] font-semibold text-sage-700 dark:bg-sage-800 dark:text-sage-100">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}

                {referencePose.breathingInstructions?.length > 0 && (
                  <p className="mt-4 rounded-2xl border border-line bg-surface/60 px-3 py-2.5 text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-ink">Breath:</span> {referencePose.breathingInstructions[0]}
                  </p>
                )}

                {referencePose.precautions?.length > 0 && (
                  <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                    <span className="font-semibold">Safety:</span> {referencePose.precautions[0]}
                  </p>
                )}

                <Link to={`/poses/${referencePose.slug || referencePose._id}`} className="link mt-4 inline-block text-xs">
                  Read the full pose guide
                </Link>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted">
                The pose library is unavailable, so only the generic checks are shown. Make sure the API is running and
                the starter library has been seeded.
              </p>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Camera-free practice ---------------------------------------- */}
      {(cameraFree || !isSupported) && (
        <section className="mt-12">
          <SectionHeading
            eyebrow="Camera-free mode"
            title={`Practise ${referencePose?.name || reference.name} without a camera`}
            description="No camera, no analysis — just the guidance, the breath and a timer you can follow on your own."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div>
              {cameraFreeRoutine ? (
                <SmartTimer
                  key={cameraFreeRoutine.title}
                  routine={cameraFreeRoutine}
                  onComplete={handleCameraFreeComplete}
                  soundEnabled={user?.preferences?.soundEnabled !== false}
                />
              ) : (
                <div className="card flex items-center gap-3 p-6 text-sm text-muted">
                  <Spinner size="sm" />
                  Loading the pose guidance…
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-base font-semibold text-ink">Practice cues</h2>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
                {referencePose?.instructions?.slice(0, 5).map((step) => (
                  <li key={step}>· {step}</li>
                )) || <li>· Follow the pose guide on the left.</li>}
              </ul>
              <p className="mt-4 rounded-2xl border border-line bg-surface/60 px-3 py-2.5 text-xs leading-relaxed text-muted">
                Breathe steadily and come out of the pose if anything feels sharp or pinching. A shorter, comfortable hold
                is worth more than a long, strained one.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/poses" className="btn-outline btn-sm">
                  Browse all poses
                </Link>
                <button
                  type="button"
                  onClick={() => toast.info('Take your time — the cues stay on screen while you practise.', { title: 'Practise mindfully' })}
                  className="btn-ghost btn-sm"
                >
                  <RefreshCw size={14} aria-hidden="true" /> Re-read the tips
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
