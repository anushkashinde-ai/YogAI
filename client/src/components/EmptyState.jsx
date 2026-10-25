import { Link } from 'react-router-dom'
import { RefreshCw, SearchX } from 'lucide-react'

/** Friendly empty state, optionally with a call to action. */
export default function EmptyState({
  icon: Icon = SearchX,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sage-50 text-sage-600 dark:bg-sage-900/60 dark:text-sage-200">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p>}

      {actionTo && actionLabel && (
        <Link to={actionTo} className="btn-primary mt-2">
          {actionLabel}
        </Link>
      )}

      {onAction && actionLabel && !actionTo && (
        <button type="button" onClick={onAction} className="btn-outline mt-2">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/** Recoverable error state — always offers a retry. */
export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/60 dark:text-red-300">
        <RefreshCw size={22} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline mt-2">
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}
