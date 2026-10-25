import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/appConfig.js'

/**
 * YogAI wordmark with the lotus mark. `compact` hides the tagline.
 */
export default function Logo({ to = '/', compact = false, className = '' }) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sage-500 to-lavender-500 shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="7" r="2.4" fill="white" />
          <path
            d="M12 10.5c-3.2 0-5.6 2-6.4 5.2h4.6l1.8-2.6 1.8 2.6h4.6C17.6 12.5 15.2 10.5 12 10.5z"
            fill="white"
            opacity="0.92"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-tight text-ink">{APP_NAME}</span>
        {!compact && (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Smart Yoga Companion
          </span>
        )}
      </span>
    </span>
  )

  if (!to) return content

  return (
    <Link to={to} className="rounded-2xl" aria-label={`${APP_NAME} home`}>
      {content}
    </Link>
  )
}
