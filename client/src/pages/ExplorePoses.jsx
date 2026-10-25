import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'

import { favoriteService, poseService } from '../services/yogaService.js'
import { getErrorMessage } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import useDebounce from '../hooks/useDebounce.js'
import PoseCard from '../components/PoseCard.jsx'
import { CardSkeleton } from '../components/Loader.jsx'
import { FadeIn, SectionHeading } from '../components/ui.jsx'
import EmptyState, { ErrorState } from '../components/EmptyState.jsx'
import { CATEGORY_LABELS, POSE_CATEGORIES, POSE_DIFFICULTIES, SORT_OPTIONS } from '../config/appConfig.js'
import { pluralise, titleCase } from '../utils/format.js'

const DEFAULT_LIMIT = 24
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]

export default function ExplorePoses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const toast = useToast()

  // Filters read straight from the URL so links are shareable and back/forward works.
  const search = searchParams.get('search') || ''
  const rawCategory = searchParams.get('category') || ''
  const rawDifficulty = searchParams.get('difficulty') || ''
  const rawSort = searchParams.get('sort') || ''
  const category = POSE_CATEGORIES.includes(rawCategory) ? rawCategory : ''
  const difficulty = POSE_DIFFICULTIES.includes(rawDifficulty) ? rawDifficulty : ''
  const sort = SORT_OPTIONS.some((option) => option.value === rawSort) ? rawSort : 'name'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = PAGE_SIZE_OPTIONS.includes(Number(searchParams.get('limit'))) ? Number(searchParams.get('limit')) : DEFAULT_LIMIT

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebounce(searchInput, 400)

  const [poses, setPoses] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyIds, setBusyIds] = useState(() => new Set())

  // Keep the text box in sync when the URL changes from outside (back/forward, clear).
  useEffect(() => {
    setSearchInput((current) => (current === search ? current : search))
  }, [search])

  // Commit the debounced term to the URL — replace so typing does not spam history.
  // Wait until the debounce has settled (matches the live input) so clearing the
  // box can never be undone by a stale, still-pending term.
  useEffect(() => {
    if (debouncedSearch !== searchInput) return

    const current = searchParams.get('search') || ''
    if (debouncedSearch === current) return

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debouncedSearch.trim()) next.set('search', debouncedSearch)
        else next.delete('search')
        next.delete('page')
        return next
      },
      { replace: true }
    )
  }, [debouncedSearch, searchInput, searchParams, setSearchParams])

  // Load poses whenever a filter, the page or the page size changes.
  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await poseService.list({
          search: debouncedSearch.trim() || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          sort,
          page,
          limit,
        })

        if (!active) return
        setPoses(result.data || [])
        setMeta(result.meta || null)
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError, 'The pose library could not be loaded right now.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [debouncedSearch, category, difficulty, sort, page, limit, reloadKey])

  /** Change a filter and jump back to the first page. */
  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })
  }

  const setPageSize = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === DEFAULT_LIMIT) next.delete('limit')
      else next.set('limit', String(value))
      next.delete('page')
      return next
    })
  }

  const goToPage = (nextPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (nextPage > 1) next.set('page', String(nextPage))
      else next.delete('page')
      return next
    })
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams())
  }

  /** Optimistic favourite toggle with auth gate and per-card busy lock. */
  const handleToggleFavorite = async (pose) => {
    if (!isAuthenticated) {
      toast.info('Sign in to save your favourite poses.')
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }

    if (busyIds.has(pose._id)) return

    const nextFavorite = !pose.isFavorite
    setBusyIds((current) => new Set(current).add(pose._id))
    setPoses((current) => current.map((item) => (item._id === pose._id ? { ...item, isFavorite: nextFavorite } : item)))

    try {
      const result = nextFavorite ? await favoriteService.add(pose._id) : await favoriteService.remove(pose._id)
      toast.success(result.message || (nextFavorite ? 'Added to your favourites.' : 'Removed from your favourites.'))
    } catch (toggleError) {
      setPoses((current) =>
        current.map((item) => (item._id === pose._id ? { ...item, isFavorite: !nextFavorite } : item))
      )
      toast.error(getErrorMessage(toggleError, 'We could not update your favourites right now.'))
    } finally {
      setBusyIds((current) => {
        const next = new Set(current)
        next.delete(pose._id)
        return next
      })
    }
  }

  const hasActiveFilters = Boolean(debouncedSearch.trim() || category || difficulty)
  const isEmptyLibrary = !loading && !error && poses.length === 0 && !hasActiveFilters
  const totalPages = meta?.totalPages || 1
  const total = meta?.total ?? poses.length
  const rangeStart = total > 0 ? (page - 1) * limit + 1 : 0
  const rangeEnd = meta ? Math.min(page * limit, total) : poses.length

  return (
    <>
      {/* ---------------------------------- Header -------------------------------- */}
      <section className="section pb-0">
        <div className="container-x">
          <SectionHeading
            eyebrow="Pose library"
            title="Explore yoga poses"
            description="Search the library by name or Sanskrit term, filter by category and difficulty, and open any pose for step-by-step guidance, breathing cues and safety notes."
            action={
              <span className="chip">
                <Sparkles size={13} aria-hidden="true" />
                {loading ? 'Counting poses…' : pluralise(total, 'pose')}
              </span>
            }
          />
        </div>
      </section>

      {/* --------------------------------- Results -------------------------------- */}
      <section className="section pt-8">
        <div className="container-x">
          {/* Control bar — sticks under the navbar on large screens */}
          <div className="card p-4 sm:p-5 lg:sticky lg:top-16 lg:z-40">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="flex-1">
                  <label className="label" htmlFor="pose-search">
                    Search poses
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="pose-search"
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search by name, Sanskrit name or benefit…"
                      className="input pl-11 pr-11"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:text-ink"
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
                  <label className="block">
                    <span className="label inline-flex items-center gap-1.5">
                      <ArrowUpDown size={13} aria-hidden="true" /> Sort by
                    </span>
                    <select value={sort} onChange={(event) => setFilter('sort', event.target.value)} className="input">
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="label">Per page</span>
                    <select
                      value={limit}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                      className="input"
                      aria-label="Poses per page"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <SlidersHorizontal size={13} aria-hidden="true" /> Category
                  </p>
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    <button
                      type="button"
                      onClick={() => setFilter('category', '')}
                      className={`chip shrink-0 ${!category ? 'chip-active' : ''}`}
                      aria-pressed={!category}
                    >
                      All
                    </button>
                    {POSE_CATEGORIES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilter('category', value)}
                        className={`chip shrink-0 ${category === value ? 'chip-active' : ''}`}
                        aria-pressed={category === value}
                      >
                        {CATEGORY_LABELS[value] || titleCase(value)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <SlidersHorizontal size={13} aria-hidden="true" /> Difficulty
                  </p>
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    <button
                      type="button"
                      onClick={() => setFilter('difficulty', '')}
                      className={`chip shrink-0 ${!difficulty ? 'chip-active' : ''}`}
                      aria-pressed={!difficulty}
                    >
                      All
                    </button>
                    {POSE_DIFFICULTIES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilter('difficulty', value)}
                        className={`chip shrink-0 ${difficulty === value ? 'chip-active' : ''}`}
                        aria-pressed={difficulty === value}
                      >
                        {titleCase(value)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-xs text-muted" aria-live="polite">
                  {loading
                    ? 'Loading poses…'
                    : total > 0
                      ? `Showing ${rangeStart}–${rangeEnd} of ${total} poses`
                      : 'No poses to show'}
                </p>

                {(hasActiveFilters || sort !== 'name' || page > 1) && (
                  <button type="button" onClick={clearFilters} className="btn-ghost btn-sm">
                    <X size={15} aria-hidden="true" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid / states */}
          <div className="mt-8">
            {loading ? (
              <CardSkeleton count={6} />
            ) : error ? (
              <ErrorState description={error} onRetry={() => setReloadKey((key) => key + 1)} />
            ) : poses.length === 0 ? (
              isEmptyLibrary ? (
                <EmptyState
                  icon={BookOpen}
                  title="The pose library is empty"
                  description="No poses have been added yet. An administrator can run `npm run seed` in the server folder to load the starter library."
                />
              ) : (
                <EmptyState
                  title="No poses match your filters"
                  description="Try a different search term or a broader category, or clear the filters to browse the whole library."
                  actionLabel="Clear filters"
                  onAction={clearFilters}
                />
              )
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {poses.map((pose, index) => (
                  <FadeIn key={pose._id} delay={index * 0.04}>
                    <PoseCard pose={pose} onToggleFavorite={handleToggleFavorite} busy={busyIds.has(pose._id)} />
                  </FadeIn>
                ))}
              </div>
            )}
          </div>

          {/* Paging */}
          {!loading && !error && poses.length > 0 && totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Pose pagination">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="btn-outline btn-sm"
              >
                <ChevronLeft size={15} aria-hidden="true" />
                Previous
              </button>

              <span className="text-sm font-medium text-muted">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="btn-outline btn-sm"
              >
                Next
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
