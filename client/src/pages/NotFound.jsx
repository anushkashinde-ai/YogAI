import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Compass, Home, Leaf, Sparkles } from 'lucide-react'

/** 404 page — public, rendered inside MainLayout with navbar and footer. */
export default function NotFound() {
  return (
    <section className="section relative overflow-hidden">
      {/* Decorative gradient shapes instead of a stock photo. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-sage-200/60 blur-3xl dark:bg-sage-700/30" />
        <div className="absolute -right-20 top-24 h-72 w-72 rounded-full bg-lavender-200/70 blur-3xl dark:bg-lavender-800/30" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cream-300/60 blur-3xl dark:bg-cream-500/10" />
      </div>

      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sage-500 via-sage-600 to-lavender-700" />
            <div className="absolute inset-3 rounded-full border border-white/25" />
            <span className="absolute inset-0 grid place-items-center text-white">
              <Leaf size={56} aria-hidden="true" />
            </span>

            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="glass absolute -right-3 top-1 grid h-11 w-11 place-items-center rounded-2xl text-lavender-700 shadow-lift dark:text-lavender-200"
            >
              <Compass size={18} aria-hidden="true" />
            </motion.span>

            <motion.span
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="glass absolute -left-4 bottom-3 grid h-11 w-11 place-items-center rounded-2xl text-sage-700 shadow-lift dark:text-sage-200"
            >
              <Sparkles size={18} aria-hidden="true" />
            </motion.span>
          </motion.div>

          <p className="mt-8 bg-gradient-to-r from-sage-600 to-lavender-600 bg-clip-text font-display text-6xl font-semibold leading-none text-transparent sm:text-7xl">
            404
          </p>
          <h1 className="mt-3 text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
            This page drifted off the mat
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
            The link may be broken, the page may have moved, or the address might have a typo. Take one steady breath
            and let us guide you back to your practice.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary btn-lg">
              <Home size={18} aria-hidden="true" />
              Back to home
            </Link>
            <Link to="/poses" className="btn-outline btn-lg">
              <Compass size={18} aria-hidden="true" />
              Explore poses
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted">
            Not sure where to begin?{' '}
            <Link to="/assistant" className="link">
              Try Yogi Assistant
              <ArrowRight size={14} className="ml-1 inline align-[-2px]" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
