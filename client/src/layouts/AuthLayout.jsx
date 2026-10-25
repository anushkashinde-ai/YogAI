import { Link, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Logo from '../components/Logo.jsx'

const HIGHLIGHTS = [
  'Camera-based posture guidance with a live skeleton overlay',
  'Personalised routines built from your goals and available time',
  'Breathing and meditation studio with animated guidance',
  'Progress dashboard, streaks and achievement badges',
]

/** Split-screen shell for login, signup and password flows. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-sage-600 via-sage-700 to-lavender-800 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(50%_50%_at_20%_20%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(45%_45%_at_80%_10%,rgba(255,255,255,0.25),transparent_60%)]" />

        <div className="relative">
          <Logo to={null} className="[&_span]:text-white" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-md"
        >
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Find your balance. Master every pose.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Join YogAI and turn a few mindful minutes a day into a practice you actually keep.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                  <Check size={12} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-xs text-white/60">
          Pose guidance is for general wellness only and is not a medical assessment.
        </p>
      </div>

      <div className="flex flex-col justify-center bg-surface px-4 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <Outlet />

          <p className="mt-8 text-center text-xs text-muted">
            <Link to="/" className="link">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
