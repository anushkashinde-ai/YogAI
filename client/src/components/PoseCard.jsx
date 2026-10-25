import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Heart } from 'lucide-react'
import DifficultyBadge from './ui.jsx'
import { CATEGORY_LABELS } from '../config/appConfig.js'
import { formatHoldTime } from '../utils/format.js'

/**
 * Pose summary card used in the library, favourites and related-pose lists.
 */
export default function PoseCard({ pose, onToggleFavorite, busy = false }) {
  const { name, slug, sanskritName, difficulty, category, duration, imageUrl, isFavorite } = pose
  const [imgError, setImgError] = useState(false)

  return (
    <article className="card card-hover group relative overflow-hidden">
      <Link to={`/poses/${slug || pose._id}`} className="block focus:outline-none">
        <div className="relative h-48 overflow-hidden bg-sage-100 dark:bg-sage-800">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={`${name} demonstration`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sage-50 to-sage-100 text-sage-400 dark:from-sage-900/40 dark:to-sage-800">
              <span className="font-display text-lg font-medium opacity-60">{name}</span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <DifficultyBadge level={difficulty} className="bg-white/90 backdrop-blur dark:bg-sage-900/80" />
            <span className="inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold capitalize text-sage-700 backdrop-blur dark:bg-sage-900/80 dark:text-sage-100">
              {CATEGORY_LABELS[category] || category}
            </span>
          </div>
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(pose)}
          disabled={busy}
          aria-pressed={Boolean(isFavorite)}
          aria-label={isFavorite ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border transition ${
            isFavorite
              ? 'border-red-200 bg-red-50 text-red-500 dark:border-red-800 dark:bg-red-950/70'
              : 'border-white/60 bg-white/85 text-muted hover:text-red-500 dark:border-sage-700 dark:bg-sage-900/80'
          } disabled:opacity-60`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      )}

      <div className="flex flex-col gap-3 p-5">
        <div>
          <Link to={`/poses/${slug || pose._id}`}>
            <h3 className="text-lg font-semibold text-ink transition group-hover:text-sage-700 dark:group-hover:text-sage-200">
              {name}
            </h3>
          </Link>
          {sanskritName && <p className="text-xs italic text-muted">{sanskritName}</p>}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{pose.description}</p>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <Clock size={13} aria-hidden="true" />
            {formatHoldTime(duration)} hold
          </span>
          <Link
            to={`/poses/${slug || pose._id}`}
            className="text-xs font-semibold text-sage-700 transition hover:text-sage-900 dark:text-sage-200"
          >
            View details →
          </Link>
        </div>
      </div>
    </article>
  )
}
