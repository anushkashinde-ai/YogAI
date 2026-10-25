import { Loader2 } from 'lucide-react'

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' }

/** Inline spinner. */
export function Spinner({ size = 'md', className = '' }) {
  return (
    <Loader2
      className={`animate-spin ${SIZES[size]} ${className}`}
      aria-hidden="true"
    />
  )
}

/** Full-block loading state with an accessible label. */
export default function Loader({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-muted ${className}`} role="status">
      <Spinner size="lg" className="text-sage-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

/** Skeleton grid used while pose cards load. */
export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="skeleton h-48 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
