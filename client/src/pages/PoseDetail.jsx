import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Heart,
  Info,
  Lightbulb,
  Play,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wind,
} from 'lucide-react'

import { favoriteService, poseService } from '../services/yogaService.js'
import { getErrorMessage } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Loader from '../components/Loader.jsx'
import PoseCard from '../components/PoseCard.jsx'
import DifficultyBadge, { FadeIn, SectionHeading } from '../components/ui.jsx'
import EmptyState, { ErrorState } from '../components/EmptyState.jsx'
import { CATEGORY_LABELS } from '../config/appConfig.js'
import { formatHoldTime, titleCase } from '../utils/format.js'

/** Confirms an API value really is a list before we map over it. */
const asList = (value) => (Array.isArray(value) ? value : [])

const SECTION_TONES = {
  default: { card: '', icon: 'bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100' },
  sage: { card: 'border-sage-200 dark:border-sage-800', icon: 'bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100' },
  red: { card: 'border-red-200 dark:border-red-900/60', icon: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300' },
  amber: {
    card: 'border-amber-200 dark:border-amber-900/60',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200',
  },
}

/** A titled content card with a leading icon, used for every pose section. */
function PoseSection({ icon: Icon, title, tone = 'default', children }) {
  const styles = SECTION_TONES[tone] || SECTION_TONES.default

  return (
    <section className={`card p-6 ${styles.card}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${styles.icon}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Simple bulleted list for breathing, mistakes, modifications and precautions. */
function BulletList({ items, dotClass = 'bg-sage-500' }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function PoseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const toast = useToast()

  const [pose, setPose] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const { data } = await poseService.get(id)
        if (!active) return
        setPose(data)
        setImageFailed(false)
      } catch (loadError) {
        if (!active) return
        if (loadError?.response?.status === 404) setNotFound(true)
        else setError(getErrorMessage(loadError, 'That pose could not be loaded right now.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [id, reloadKey])

  /** Optimistic favourite toggle — auth-gated exactly like the library page. */
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Sign in to save your favourite poses.')
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }

    if (favoriteBusy || !pose) return

    const nextFavorite = !pose.isFavorite
    setFavoriteBusy(true)
    setPose((current) => ({ ...current, isFavorite: nextFavorite }))

    try {
      const result = nextFavorite ? await favoriteService.add(pose._id) : await favoriteService.remove(pose._id)
      toast.success(result.message || (nextFavorite ? 'Added to your favourites.' : 'Removed from your favourites.'))
    } catch (toggleError) {
      setPose((current) => ({ ...current, isFavorite: !nextFavorite }))
      toast.error(getErrorMessage(toggleError, 'We could not update your favourites right now.'))
    } finally {
      setFavoriteBusy(false)
    }
  }

  const handlePractise = () => {
    navigate('/plans', { state: { poseId: pose._id, poseName: pose.name } })
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container-x">
          <Loader label="Loading pose…" />
        </div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="section">
        <div className="container-x">
          <EmptyState
            icon={BookOpen}
            title="Pose not found"
            description="We could not find a pose with that name. It may have been renamed or removed from the library."
            actionTo="/poses"
            actionLabel="Back to the library"
          />
        </div>
      </section>
    )
  }

  if (error || !pose) {
    return (
      <section className="section">
        <div className="container-x">
          <ErrorState description={error || 'That pose could not be loaded right now.'} onRetry={() => setReloadKey((key) => key + 1)} />
        </div>
      </section>
    )
  }

  const instructions = asList(pose.instructions)
  const breathing = asList(pose.breathingInstructions)
  const mistakes = asList(pose.commonMistakes)
  const modifications = asList(pose.modifications)
  const precautions = asList(pose.precautions)
  const relatedPoses = asList(pose.relatedPoses)

  return (
    <>
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="section pb-0">
        <div className="container-x">
          {/* Breadcrumb */}
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
            <Link to="/poses" className="font-medium transition hover:text-ink">
              Poses
            </Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="font-medium text-ink">{pose.name}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            {/* Image (with graceful fallback) */}
            {imageFailed || !pose.imageUrl ? (
              <div className="grid h-64 place-items-center rounded-3xl bg-gradient-to-br from-sage-500 via-sage-600 to-lavender-700 px-6 text-center text-white shadow-soft lg:h-full lg:min-h-[26rem]">
                <span className="font-display text-2xl font-semibold">{pose.name}</span>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-line bg-sage-100 shadow-soft dark:bg-sage-800">
                <img
                  src={pose.imageUrl}
                  alt={`${pose.name} demonstration`}
                  className="h-64 w-full object-cover lg:h-full lg:min-h-[26rem]"
                  onError={() => setImageFailed(true)}
                />
              </div>
            )}

            {/* Summary + actions */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <DifficultyBadge level={pose.difficulty} />
                <span className="chip">{CATEGORY_LABELS[pose.category] || titleCase(pose.category)}</span>
                <span className="chip">
                  <Clock size={13} aria-hidden="true" />
                  {formatHoldTime(pose.duration)} recommended hold
                </span>
              </div>

              <div>
                <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{pose.name}</h1>
                {pose.sanskritName && <p className="mt-1 text-sm italic text-muted">{pose.sanskritName}</p>}
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={favoriteBusy}
                  aria-pressed={Boolean(pose.isFavorite)}
                  className={
                    pose.isFavorite
                      ? 'btn border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200'
                      : 'btn-primary'
                  }
                >
                  <Heart size={17} fill={pose.isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
                  {pose.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                </button>

                <button type="button" onClick={handlePractise} className="btn-outline">
                  <Play size={17} aria-hidden="true" />
                  Practise this pose
                </button>

                <Link to="/poses" className="btn-ghost">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back to poses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- Content --------------------------------- */}
      <section className="section">
        <div className="container-x grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <PoseSection icon={Info} title="Description">
              <p className="text-sm leading-relaxed text-muted">
                {pose.description || 'No description has been added for this pose yet.'}
              </p>
            </PoseSection>

            {instructions.length > 0 && (
              <PoseSection icon={BookOpen} title="How to do it">
                <ol className="space-y-3">
                  {instructions.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-100 text-xs font-semibold text-sage-700 dark:bg-sage-800 dark:text-sage-100">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-muted">{step}</p>
                    </li>
                  ))}
                </ol>
              </PoseSection>
            )}

            {breathing.length > 0 && (
              <PoseSection icon={Wind} title="Breathing">
                <BulletList items={breathing} dotClass="bg-lavender-500" />
              </PoseSection>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {mistakes.length > 0 && (
              <PoseSection icon={TriangleAlert} title="Common mistakes" tone="red">
                <BulletList items={mistakes} dotClass="bg-red-500" />
              </PoseSection>
            )}

            {modifications.length > 0 && (
              <PoseSection icon={Lightbulb} title="Beginner modifications" tone="sage">
                <BulletList items={modifications} dotClass="bg-sage-500" />
              </PoseSection>
            )}

            {precautions.length > 0 && (
              <PoseSection icon={ShieldCheck} title="Safety precautions" tone="amber">
                <BulletList items={precautions} dotClass="bg-amber-500" />
              </PoseSection>
            )}

            <PoseSection icon={Clock} title="Recommended duration">
              <p className="text-sm leading-relaxed text-muted">
                Hold or stay in this pose for around {formatHoldTime(pose.duration)}. Beginners can start with a shorter
                hold and build up gradually, resting whenever needed.
              </p>
            </PoseSection>

            {/* Persistent, non-dismissible safety note */}
            <div className="card border-amber-200 p-5 dark:border-amber-900/60">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
                  <TriangleAlert size={17} aria-hidden="true" />
                </span>
                <p className="text-xs leading-relaxed text-muted">
                  This pose guidance is general information, not medical advice. Yoga should never be painful — stop
                  immediately if it hurts, and speak to a qualified doctor or physiotherapist if discomfort continues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- Related poses ------------------------------ */}
      {relatedPoses.length > 0 && (
        <section className="section pt-0">
          <div className="container-x">
            <SectionHeading
              eyebrow="Keep going"
              title="Related poses"
              description="Poses that pair well with this one — explore them next to build a balanced practice."
              action={
                <Sparkles size={18} className="hidden text-lavender-400 sm:block" aria-hidden="true" />
              }
            />

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPoses.map((related, index) => (
                <FadeIn key={related._id} delay={index * 0.05}>
                  <PoseCard pose={related} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
