import { motion } from 'framer-motion'
import { DIFFICULTY_STYLES } from '../config/appConfig.js'

/** Small coloured pill describing pose / routine difficulty. */
export default function DifficultyBadge({ level = 'beginner', className = '' }) {
  const style = DIFFICULTY_STYLES[level] || DIFFICULTY_STYLES.beginner

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${style} ${className}`}>
      {level}
    </span>
  )
}

/** Section heading with optional eyebrow, description and trailing action. */
export function SectionHeading({ eyebrow, title, description, align = 'left', action, className = '' }) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left'

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className={`flex max-w-2xl flex-col gap-2 ${alignment}`}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="text-balance text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
        {description && <p className="text-sm leading-relaxed text-muted sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Motion wrapper that fades content up on mount. */
export function FadeIn({ children, delay = 0, className = '', as = 'div' }) {
  const Component = motion[as] || motion.div
  return (
    <Component
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </Component>
  )
}

/** Single dashboard metric. */
export function StatCard({ icon: Icon, label, value, hint, tone = 'sage' }) {
  const tones = {
    sage: 'from-sage-500/15 to-sage-500/0 text-sage-700 dark:text-sage-200',
    lavender: 'from-lavender-500/20 to-lavender-500/0 text-lavender-700 dark:text-lavender-200',
    amber: 'from-amber-400/20 to-amber-400/0 text-amber-700 dark:text-amber-200',
  }

  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${tones[tone] || tones.sage}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {Icon && (
          <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-card/80 shadow-soft ${tones[tone] || tones.sage}`}>
            <Icon size={19} aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  )
}

/** Marks content that is not fully operational (demo / simulation). */
export function DemoBadge({ children = 'Demo mode', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      {children}
    </span>
  )
}
