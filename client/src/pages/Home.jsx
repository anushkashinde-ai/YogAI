import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Camera,
  ChevronDown,
  Heart,
  Leaf,
  LineChart,
  Quote,
  ScanFace,
  Sparkles,
  Timer,
  Waves,
  Wind,
} from 'lucide-react'

import { poseService, routineService } from '../services/yogaService.js'
import PoseCard from '../components/PoseCard.jsx'
import { CardSkeleton, Spinner } from '../components/Loader.jsx'
import { FadeIn, SectionHeading } from '../components/ui.jsx'
import { formatDuration, titleCase } from '../utils/format.js'

const HERO_IMAGE =
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    'woman practising yoga tree pose, sage green mat, bright minimal studio, wellness photography'
  )}&image_size=portrait_4_3`

const COACH_IMAGE =
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    'yoga posture detection on laptop screen, body landmark skeleton overlay, modern home studio'
  )}&image_size=landscape_4_3`

const BENEFITS = [
  {
    icon: Heart,
    title: 'Better posture, less stiffness',
    body: 'Short, regular practice keeps the spine mobile and counteracts long hours of sitting.',
    tone: 'sage',
  },
  {
    icon: Wind,
    title: 'Calmer breathing',
    body: 'Pranayama techniques such as box breathing slow a busy mind in minutes.',
    tone: 'lavender',
  },
  {
    icon: Brain,
    title: 'Sharper focus',
    body: 'Balance work and steady gazing train attention more effectively than you might expect.',
    tone: 'sage',
  },
  {
    icon: Leaf,
    title: 'Sustainable habit',
    body: 'Tiny sessions, streaks and gentle badges help consistency beat intensity.',
    tone: 'lavender',
  },
]

const STEPS = [
  {
    icon: ScanFace,
    title: 'Learn the pose',
    body: 'Every pose page explains benefits, step-by-step cues, breathing, common mistakes and beginner modifications.',
  },
  {
    icon: Camera,
    title: 'Practise with feedback',
    body: 'The AI Yoga Coach uses your camera to draw a live skeleton overlay and offers simple posture observations.',
  },
  {
    icon: LineChart,
    title: 'Track the habit',
    body: 'Sessions, minutes, streaks and badges are calculated from your real activity — never from fake numbers.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Priya M.',
    role: 'Second-year student',
    quote:
      'The camera coach caught that my shoulders were uneven in Tree Pose. Ten minutes a day and my balance genuinely improved.',
  },
  {
    name: 'Rahul S.',
    role: 'Software engineer',
    quote:
      'I mostly use the breathing studio before bed. The box breathing timer is the only reason I actually stick to it.',
  },
  {
    name: 'Ananya K.',
    role: 'Complete beginner',
    quote:
      'The routine generator gave me a 15-minute gentle plan that did not feel intimidating. Perfect starting point.',
  },
]

const FAQS = [
  {
    question: 'Do I need a yoga mat or any equipment?',
    answer:
      'A non-slip mat is the main thing. Blocks, a strap or a folded blanket help you reach the floor comfortably, and many poses can be practised seated in a chair. The routine generator lets you list whatever you already have.',
  },
  {
    question: 'Is the AI Yoga Coach accurate enough to correct my posture?',
    answer:
      'No — and we will never claim otherwise. It estimates body landmarks on your device and compares joint angles with a reference configuration, then offers simple observations such as "try keeping your back more upright". It cannot confirm correct alignment or assess your health.',
  },
  {
    question: 'Does YogAI store my camera footage?',
    answer:
      'No. Pose estimation runs in your browser and video frames are never uploaded or recorded. Only the session summary you choose to save — duration, poses and mood — is stored on your account.',
  },
  {
    question: 'I am a complete beginner. Where should I start?',
    answer:
      'Start with Explore Poses and read Mountain Pose, Cat-Cow and Child\u2019s Pose. Then generate a 15-minute gentle routine, or try the "How are you feeling today?" feature for a short, matched plan.',
  },
  {
    question: 'What if a pose hurts?',
    answer:
      'Stop immediately. Yoga should never be painful. Come out of the pose, rest and, if discomfort continues, consult a qualified doctor or physiotherapist. Every pose page lists precautions and beginner modifications.',
  },
  {
    question: 'Is YogAI free to use?',
    answer:
      'Yes. Creating an account gives you the pose library, the routine generator, the breathing studio, progress tracking and the community section at no cost.',
  },
]

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-ink sm:text-base">{faq.question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{faq.answer}</p>
      </motion.div>
    </div>
  )
}

export default function Home() {
  const [poses, setPoses] = useState([])
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [poseResult, routineResult] = await Promise.all([
          poseService.list({ limit: 6, sort: 'name' }),
          routineService.list({ scope: 'public', limit: 3 }),
        ])

        if (!active) return
        setPoses(poseResult.data || [])
        setRoutines(routineResult.data || [])
      } catch (error) {
        if (active) setApiError('The pose library could not be loaded right now.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="chip mb-5 border-lavender-200 bg-lavender-50 text-lavender-700 dark:border-lavender-700 dark:bg-lavender-950/50 dark:text-lavender-200">
              <Sparkles size={13} aria-hidden="true" />
              AI posture guidance · Personalised routines · Progress tracking
            </span>

            <h1 className="text-balance font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
              Find Your Balance.
              <span className="block bg-gradient-to-r from-sage-600 to-lavender-600 bg-clip-text text-transparent">
                Master Every Pose.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              YogAI is your smart yoga companion. Learn each pose properly, get camera-based posture feedback, follow
              routines built around your goals and time, and build a practice that actually sticks — one calm session at
              a time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/coach" className="btn-primary btn-lg">
                <Camera size={18} aria-hidden="true" />
                Start Practicing
              </Link>
              <Link to="/poses" className="btn-outline btn-lg">
                Explore Yoga Poses
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { label: 'Poses explained', value: '13+' },
                { label: 'Guided patterns', value: '4' },
                { label: 'Badges to earn', value: '8' },
              ].map((stat) => (
                <div key={stat.label} className="card px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{stat.label}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-5xl border border-line shadow-lift">
              <img
                src={HERO_IMAGE}
                alt="A person practising Tree Pose on a sage green yoga mat"
                className="h-[26rem] w-full object-cover sm:h-[32rem]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sage-900/45 via-transparent to-transparent" />
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="glass absolute -bottom-6 left-4 flex items-center gap-3 rounded-3xl px-4 py-3 shadow-lift sm:left-8"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sage-600 text-white">
                <Timer size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Smart yoga timer</p>
                <p className="text-[11px] text-muted">Countdown · rest intervals · next pose</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="glass absolute -top-5 right-4 hidden items-center gap-3 rounded-3xl px-4 py-3 shadow-lift sm:flex"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lavender-600 text-white">
                <Waves size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Box breathing</p>
                <p className="text-[11px] text-muted">4 · 4 · 4 · 4, holds optional</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------ Featured poses --------------------------- */}
      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="Pose library"
            title="Featured yoga poses"
            description="Each pose includes benefits, step-by-step instructions, breathing cues, common mistakes, beginner modifications and safety notes."
            action={
              <Link to="/poses" className="btn-outline">
                Browse all poses
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            }
          />

          <div className="mt-10">
            {loading ? (
              <CardSkeleton count={3} />
            ) : apiError ? (
              <div className="card p-6 text-sm text-muted">
                {apiError} Start the API and run <code className="rounded bg-sage-50 px-1.5 py-0.5 dark:bg-sage-800">npm run seed</code> in
                the server folder to populate the library.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {poses.map((pose, index) => (
                  <FadeIn key={pose._id} delay={index * 0.05}>
                    <PoseCard pose={pose} />
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------- Popular routines --------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeading
            eyebrow="Yoga plans"
            title="Popular yoga routines"
            description="Structured sessions with a warm-up, main poses, rest intervals and a cool-down. Generate your own from your goals and available time."
            action={
              <Link to="/plans" className="btn-outline">
                Build my routine
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            }
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {loading ? (
              <div className="md:col-span-3">
                <div className="flex justify-center py-10">
                  <Spinner size="lg" className="text-sage-500" />
                </div>
              </div>
            ) : (
              routines.map((routine, index) => (
                <FadeIn key={routine._id} delay={index * 0.06}>
                  <article className="card card-hover flex h-full flex-col p-6">
                    <div className="flex items-center gap-2">
                      <span className="chip capitalize">{titleCase(routine.goal)}</span>
                      <span className="chip capitalize">{routine.difficulty}</span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-ink">{routine.title}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{routine.description}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} aria-hidden="true" />
                        {formatDuration(routine.durationMinutes)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Leaf size={14} aria-hidden="true" />
                        {routine.poses?.length || 0} poses
                      </span>
                    </div>

                    <Link to="/plans" className="btn-primary mt-5 w-full">
                      Start this routine
                    </Link>
                  </article>
                </FadeIn>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------- AI Yoga Coach ----------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="card overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-11">
                <span className="eyebrow">AI Yoga Coach</span>
                <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
                  Practise with a live skeleton overlay
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Choose a supported pose, turn on your camera and YogAI estimates your body landmarks on your device,
                  draws them over the video and compares key joint angles with a reference configuration. You get simple,
                  friendly observations — plus a confidence indicator so you know when the reading is reliable.
                </p>

                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    'Runs entirely in your browser — frames are never uploaded',
                    'Feedback such as "try keeping your back more upright"',
                    'Confidence indicator and a camera-free practice option',
                    'Pause, resume or stop the session at any time',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/coach" className="btn-secondary">
                    <Camera size={17} aria-hidden="true" />
                    Open the AI Coach
                  </Link>
                  <Link to="/safety" className="btn-ghost">
                    How it works & limitations
                  </Link>
                </div>

                <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                  Important: pose estimation is an estimate. It does not guarantee correct posture and is not a medical
                  assessment. Stop immediately if you feel pain.
                </p>
              </div>

              <div className="relative min-h-[18rem]">
                <img
                  src={COACH_IMAGE}
                  alt="Practising yoga while the AI coach shows a body landmark overlay"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- Benefits ------------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeading
            eyebrow="Why yoga"
            title="Benefits of a regular practice"
            description="Yoga is not about touching your toes — it is about what you learn on the way down."
            align="center"
            className="mx-auto max-w-2xl"
          />

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, index) => (
              <FadeIn key={benefit.title} delay={index * 0.05}>
                <article className="card h-full p-6">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${
                      benefit.tone === 'lavender'
                        ? 'bg-lavender-100 text-lavender-700 dark:bg-lavender-900/60 dark:text-lavender-200'
                        : 'bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100'
                    }`}
                  >
                    <benefit.icon size={21} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ How it works ---------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="grid gap-8 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <FadeIn key={step.title} delay={index * 0.07}>
                <div className="relative card h-full p-7">
                  <span className="absolute right-6 top-6 font-display text-4xl font-semibold text-sage-100 dark:text-sage-800">
                    0{index + 1}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sage-500 to-lavender-500 text-white">
                    <step.icon size={21} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ Testimonials ---------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeading
            eyebrow="Community"
            title="What early testers say"
            description="Illustrative feedback collected while building YogAI with a small group of students and colleagues."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <FadeIn key={testimonial.name} delay={index * 0.06}>
                <figure className="card h-full p-6">
                  <Quote size={22} className="text-lavender-400" aria-hidden="true" />
                  <blockquote className="mt-4 text-sm leading-relaxed text-muted">“{testimonial.quote}”</blockquote>
                  <figcaption className="mt-5 border-t border-line pt-4">
                    <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
                    <p className="text-xs text-muted">{testimonial.role}</p>
                  </figcaption>
                </figure>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- FAQ --------------------------------- */}
      <section className="section pt-0">
        <div className="container-x grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="eyebrow">Questions</span>
            <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Frequently asked questions</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Still unsure about something? Ask Yogi Assistant — it is available on every page, and answers from the
              built-in yoga guide whenever no AI key is configured.
            </p>
            <Link to="/assistant" className="btn-outline mt-6">
              Ask Yogi Assistant
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <FaqItem
                key={faq.question}
                faq={faq}
                isOpen={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- CTA --------------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-5xl bg-gradient-to-br from-sage-600 via-sage-700 to-lavender-800 px-7 py-14 text-center text-white sm:px-14">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(45%_45%_at_18%_20%,rgba(255,255,255,0.35),transparent_62%),radial-gradient(40%_40%_at_82%_12%,rgba(255,255,255,0.28),transparent_60%)]" />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Your mat is waiting.</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base">
                Create a free account to save routines, log sessions, unlock badges and track your streak. Or explore the
                pose library first — no account needed.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/signup" className="btn btn-lg bg-white text-sage-800 hover:bg-cream-100">
                  Create my free account
                </Link>
                <Link
                  to="/mood"
                  className="btn btn-lg border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                >
                  How are you feeling today?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
