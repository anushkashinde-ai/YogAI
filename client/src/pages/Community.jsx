import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Flame,
  Footprints,
  Leaf,
  LockKeyhole,
  Medal,
  Send,
  Sparkles,
  Sunrise,
  ThumbsUp,
  Trash2,
  Trophy,
  Users,
  Wind,
  X,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { communityService, achievementService, routineService } from '../services/yogaService.js'
import { getErrorMessage } from '../services/api.js'
import Loader, { Spinner } from '../components/Loader.jsx'
import EmptyState, { ErrorState } from '../components/EmptyState.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { SectionHeading } from '../components/ui.jsx'
import { ACHIEVEMENT_ICONS } from '../config/appConfig.js'
import { formatDuration, initials, pluralise, relativeTime, titleCase } from '../utils/format.js'

/** Locally mapped lucide components for the achievement icon keys. */
const BADGE_ICONS = {
  [ACHIEVEMENT_ICONS.sparkles]: Sparkles,
  [ACHIEVEMENT_ICONS.flame]: Flame,
  [ACHIEVEMENT_ICONS.wind]: Wind,
  [ACHIEVEMENT_ICONS.footprints]: Footprints,
  [ACHIEVEMENT_ICONS.sunrise]: Sunrise,
  [ACHIEVEMENT_ICONS.medal]: Medal,
  [ACHIEVEMENT_ICONS.clock]: Clock,
  [ACHIEVEMENT_ICONS.trophy]: Trophy,
  [ACHIEVEMENT_ICONS.award]: Award,
}

const POST_TYPES = [
  { value: 'note', label: 'General update' },
  { value: 'achievement', label: 'Celebrate a badge' },
  { value: 'routine', label: 'Share a routine' },
]

const CONTENT_LIMIT = 1200
const FEED_LIMIT = 8

/** Small modal that collects a reason before reporting a post. */
function ReportDialog({ open, reason, onChange, onCancel, onSubmit, busy }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKey = (event) => {
      if (event.key === 'Escape') onCancel?.()
    }

    document.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] grid place-items-center bg-sage-900/50 p-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            className="card w-full max-w-md p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Report post"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Report this post</h2>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full p-1 text-muted transition hover:text-ink"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tell us what is wrong. Three independent reports automatically flag a post for review by our moderation
              team.
            </p>

            <label className="label mt-4" htmlFor="report-reason">
              Reason (optional)
            </label>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(event) => onChange(event.target.value)}
              maxLength={300}
              rows={3}
              className="input min-h-[6rem] resize-y"
              placeholder="For example: spam, or unkind language"
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onCancel} className="btn-outline">
                Cancel
              </button>
              <button type="button" onClick={onSubmit} disabled={busy} className="btn-primary">
                {busy ? (
                  <>
                    <Spinner size="sm" /> Sending…
                  </>
                ) : (
                  'Submit report'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Single feed entry with its badge / routine preview and actions. */
function PostCard({ post, likeBusy, canDelete, resolveBadge, onLike, onReport, onDelete }) {
  const badge = post.type === 'achievement' ? resolveBadge(post.achievementKey) : null
  const BadgeIcon = (badge && BADGE_ICONS[badge.icon]) || Award

  return (
    <article className="card p-5 sm:p-6">
      <header className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sage-500 to-lavender-500 text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {initials(post.author?.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{post.author?.name || 'YogAI member'}</p>
            {post.author?.experienceLevel && (
              <span className="chip capitalize">{post.author.experienceLevel}</span>
            )}
            {post.isFlagged && (
              <span className="chip border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
                <Flag size={11} aria-hidden="true" /> Flagged for review
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">{relativeTime(post.createdAt)}</p>
        </div>
      </header>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.content}</p>

      {post.type === 'achievement' && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-lavender-200 bg-lavender-50 px-4 py-3 dark:border-lavender-800 dark:bg-lavender-950/40">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lavender-100 text-lavender-700 dark:bg-lavender-900/60 dark:text-lavender-200">
            <BadgeIcon size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-lavender-700 dark:text-lavender-200">
              Badge unlocked
            </p>
            <p className="text-sm font-semibold text-ink">
              {badge?.name || titleCase(post.achievementKey || 'Achievement')}
            </p>
          </div>
        </div>
      )}

      {post.type === 'routine' && post.routine && (
        <div className="mt-4 rounded-2xl border border-line bg-card px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip capitalize">{titleCase(post.routine.goal)}</span>
            <span className="chip capitalize">{post.routine.difficulty}</span>
          </div>
          <h4 className="mt-2 text-base font-semibold text-ink">{post.routine.title}</h4>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
            <Clock size={13} aria-hidden="true" /> {formatDuration(post.routine.durationMinutes)}
          </p>
        </div>
      )}

      <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => onLike(post)}
          disabled={likeBusy}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? 'Remove your encouragement' : 'Encourage this post'}
          className={`btn-sm ${post.likedByMe ? 'btn-secondary' : 'btn-outline'}`}
        >
          <ThumbsUp size={14} aria-hidden="true" /> {post.likeCount}
        </button>

        <button type="button" onClick={() => onReport(post)} className="btn-ghost btn-sm">
          <Flag size={14} aria-hidden="true" /> Report
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(post)}
            className="btn-ghost btn-sm text-red-600 dark:text-red-300"
          >
            <Trash2 size={14} aria-hidden="true" /> Delete
          </button>
        )}
      </footer>
    </article>
  )
}

export default function Community() {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  // Weekly challenges.
  const [challenges, setChallenges] = useState([])
  const [challengesMeta, setChallengesMeta] = useState(null)
  const [challengesLoading, setChallengesLoading] = useState(true)
  const [challengesError, setChallengesError] = useState('')
  const [challengeBusyKey, setChallengeBusyKey] = useState(null)

  // Composer.
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('note')
  const [achievementKey, setAchievementKey] = useState('')
  const [routineId, setRoutineId] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Data for the composer selects.
  const [achievements, setAchievements] = useState([])
  const [routines, setRoutines] = useState([])

  // Feed.
  const [posts, setPosts] = useState([])
  const [feedMeta, setFeedMeta] = useState(null)
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [feedFilter, setFeedFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [likeBusyId, setLikeBusyId] = useState(null)

  // Moderation dialogs.
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const earnedAchievements = useMemo(() => achievements.filter((badge) => badge.earned), [achievements])

  const loadChallenges = useCallback(async () => {
    setChallengesLoading(true)
    setChallengesError('')
    try {
      const { data, meta } = await communityService.challenges()
      setChallenges(data || [])
      setChallengesMeta(meta || null)
    } catch (error) {
      setChallengesError(getErrorMessage(error, 'The weekly challenges could not be loaded.'))
    } finally {
      setChallengesLoading(false)
    }
  }, [])

  const loadFeed = useCallback(
    async (targetPage) => {
      setFeedLoading(true)
      setFeedError('')
      try {
        const { data, meta } = await communityService.listPosts({
          page: targetPage,
          limit: FEED_LIMIT,
          mine: feedFilter === 'mine',
        })
        setPosts(data || [])
        setFeedMeta(meta || null)
      } catch (error) {
        setFeedError(getErrorMessage(error, 'The community feed could not be loaded.'))
      } finally {
        setFeedLoading(false)
      }
    },
    [feedFilter]
  )

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  useEffect(() => {
    loadFeed(page)
  }, [loadFeed, page])

  // The achievement picker and routine picker need a signed-in user.
  useEffect(() => {
    if (!isAuthenticated) {
      setAchievements([])
      setRoutines([])
      return undefined
    }

    let active = true

    achievementService
      .list()
      .then(({ data }) => {
        if (active) setAchievements(data || [])
      })
      .catch(() => {
        if (active) setAchievements([])
      })

    routineService
      .list({ scope: 'mine' })
      .then(({ data }) => {
        if (active) setRoutines(data || [])
      })
      .catch(() => {
        if (active) setRoutines([])
      })

    return () => {
      active = false
    }
  }, [isAuthenticated])

  // A signed-out visitor cannot view their private posts.
  useEffect(() => {
    if (!isAuthenticated && feedFilter === 'mine') setFeedFilter('all')
  }, [isAuthenticated, feedFilter])

  const resolveBadge = useCallback(
    (key) => achievements.find((badge) => badge.key === key) || null,
    [achievements]
  )

  const selectFeedFilter = (value) => {
    setFeedFilter(value)
    setPage(1)
  }

  const toggleChallenge = async (challenge) => {
    if (!isAuthenticated) {
      toast.info('Sign in to join a weekly challenge.')
      navigate('/login', { state: { from: '/community' } })
      return
    }

    const nextJoined = !challenge.joined
    setChallengeBusyKey(challenge.key)
    setChallenges((list) =>
      list.map((item) =>
        item.key === challenge.key
          ? { ...item, joined: nextJoined, participants: Math.max(0, item.participants + (nextJoined ? 1 : -1)) }
          : item
      )
    )

    try {
      const { message } = nextJoined
        ? await communityService.joinChallenge(challenge.key)
        : await communityService.leaveChallenge(challenge.key)
      toast.success(message || (nextJoined ? 'Joined the challenge!' : 'You left the challenge.'))
    } catch (error) {
      setChallenges((list) =>
        list.map((item) =>
          item.key === challenge.key
            ? { ...item, joined: challenge.joined, participants: challenge.participants }
            : item
        )
      )
      toast.error(getErrorMessage(error, 'We could not update your challenge.'))
    } finally {
      setChallengeBusyKey(null)
    }
  }

  const handleCreatePost = async (event) => {
    event.preventDefault()
    const trimmed = content.trim()

    if (trimmed.length < 2) {
      toast.warning('Write a little more before posting.')
      return
    }
    if (postType === 'achievement' && !achievementKey) {
      toast.warning('Choose which badge you are celebrating.')
      return
    }
    if (postType === 'routine' && !routineId) {
      toast.warning('Choose a routine to share.')
      return
    }

    const selectedRoutine =
      postType === 'routine' ? routines.find((item) => item._id === routineId) || null : null

    setSubmitting(true)
    try {
      const { data, message } = await communityService.createPost({
        content: trimmed,
        type: postType,
        achievementKey: postType === 'achievement' ? achievementKey : '',
        routineId: postType === 'routine' ? routineId : null,
        isPublic,
      })
      toast.success(message || 'Post created.')

      // Only public posts belong in the feed; the server message explains the
      // difference when a private note was saved instead.
      if (isPublic && data) {
        setPosts((list) => [
          {
            id: data.id,
            content: data.content,
            type: data.type,
            achievementKey: postType === 'achievement' ? achievementKey : '',
            routine: selectedRoutine,
            author: {
              id: data.author?.id,
              name: data.author?.name || user?.name,
              experienceLevel: user?.experienceLevel,
            },
            likeCount: data.likeCount ?? 0,
            likedByMe: Boolean(data.likedByMe),
            commentsEnabled: false,
            createdAt: data.createdAt || new Date().toISOString(),
            isMine: true,
            isFlagged: false,
          },
          ...list,
        ])
        setFeedFilter('all')
        setPage(1)
      }

      setContent('')
      setPostType('note')
      setAchievementKey('')
      setRoutineId('')
      setIsPublic(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'We could not create your post.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (post) => {
    if (!isAuthenticated) {
      toast.info('Sign in to encourage other members.')
      navigate('/login', { state: { from: '/community' } })
      return
    }

    const nextLiked = !post.likedByMe
    setLikeBusyId(post.id)
    setPosts((list) =>
      list.map((item) =>
        item.id === post.id
          ? { ...item, likedByMe: nextLiked, likeCount: Math.max(0, item.likeCount + (nextLiked ? 1 : -1)) }
          : item
      )
    )

    try {
      const { data } = await communityService.likePost(post.id)
      if (data) {
        setPosts((list) =>
          list.map((item) =>
            item.id === post.id ? { ...item, likedByMe: data.likedByMe, likeCount: data.likeCount } : item
          )
        )
      }
    } catch (error) {
      setPosts((list) =>
        list.map((item) =>
          item.id === post.id ? { ...item, likedByMe: post.likedByMe, likeCount: post.likeCount } : item
        )
      )
      toast.error(getErrorMessage(error, 'We could not save your reaction.'))
    } finally {
      setLikeBusyId(null)
    }
  }

  const handleOpenReport = (post) => {
    if (!isAuthenticated) {
      toast.info('Sign in to report a post.')
      navigate('/login', { state: { from: '/community' } })
      return
    }
    setReportReason('')
    setReportTarget(post)
  }

  const handleSubmitReport = async () => {
    if (!reportTarget) return
    setReporting(true)
    try {
      const { message } = await communityService.reportPost(reportTarget.id, reportReason.trim())
      toast.success(message || 'Thank you — our moderation team will review this post.')
      setReportTarget(null)
      setReportReason('')
    } catch (error) {
      toast.error(getErrorMessage(error, 'We could not submit your report.'))
    } finally {
      setReporting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { message } = await communityService.deletePost(deleteTarget.id)
      setPosts((list) => list.filter((item) => item.id !== deleteTarget.id))
      toast.success(message || 'Post deleted.')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'We could not delete that post.'))
    } finally {
      setDeleting(false)
    }
  }

  const feedSegments = isAuthenticated
    ? [
        { value: 'all', label: 'All posts' },
        { value: 'mine', label: 'My posts' },
      ]
    : [{ value: 'all', label: 'All posts' }]

  const progressLocked = Boolean(challengesMeta?.requiresAuthForProgress)

  return (
    <>
      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="section">
        <div className="container-x">
          <span className="eyebrow">Community</span>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Practise together — quietly, and on your own terms.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Sharing here is always opt-in: nothing is posted unless you turn "Share publicly" on. This community
            rewards consistency, never appearance or flexibility.
          </p>
        </div>
      </section>

      {/* ---------------------------- Weekly challenges --------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeading
            eyebrow="Weekly challenges"
            title="This week's challenges"
            description="Join as many as you like. Progress is calculated from your real sessions — nothing here is invented."
            action={
              <Link to="/progress" className="btn-outline">
                View my progress
              </Link>
            }
          />

          <div className="mt-8">
            {challengesLoading ? (
              <Loader label="Loading this week's challenges…" />
            ) : challengesError ? (
              <ErrorState
                title="We could not load the challenges"
                description={challengesError}
                onRetry={loadChallenges}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {challenges.map((challenge) => (
                  <article key={challenge.key} className="card relative flex h-full flex-col p-6">
                    {challenge.featured && (
                      <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-lavender-200 bg-lavender-50 px-2.5 py-1 text-[11px] font-semibold text-lavender-700 dark:border-lavender-700 dark:bg-lavender-950/50 dark:text-lavender-200">
                        <Sparkles size={12} aria-hidden="true" /> Featured this week
                      </span>
                    )}

                    <h3 className="pr-24 text-lg font-semibold text-ink">{challenge.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{challenge.description}</p>

                    {progressLocked ? (
                      <div className="mt-5 rounded-2xl border border-line bg-card px-4 py-3">
                        <p className="flex items-center gap-2 text-sm text-muted">
                          <LockKeyhole size={15} aria-hidden="true" /> Progress is hidden for guests.
                        </p>
                        <Link
                          to="/login"
                          state={{ from: '/community' }}
                          className="link mt-1 inline-block text-xs"
                        >
                          Sign in to track your progress
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>
                            {challenge.progress.value} / {challenge.progress.target} {challenge.unit}
                          </span>
                          <span className="font-semibold text-ink">{challenge.progress.percent}%</span>
                        </div>
                        <div
                          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-sage-800"
                          role="progressbar"
                          aria-label={`${challenge.title} progress`}
                          aria-valuenow={challenge.progress.percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sage-500 to-lavender-500 transition-all"
                            style={{ width: `${challenge.progress.percent}%` }}
                          />
                        </div>
                        {challenge.progress.completed && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 dark:text-sage-300">
                            <Check size={13} aria-hidden="true" /> Completed this week
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-5">
                      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <Users size={14} aria-hidden="true" />{' '}
                          {pluralise(challenge.participants, 'participant')}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleChallenge(challenge)}
                          disabled={challengeBusyKey === challenge.key}
                          className={challenge.joined ? 'btn-outline btn-sm' : 'btn-primary btn-sm'}
                        >
                          {challengeBusyKey === challenge.key ? (
                            <Spinner size="sm" />
                          ) : challenge.joined ? (
                            'Leave'
                          ) : (
                            'Join challenge'
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------- Composer -------------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeading
            eyebrow="Share"
            title="Add to the community"
            description="Post an update, celebrate a badge or share one of your routines."
          />

          <div className="mt-8">
            {!isAuthenticated ? (
              <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <h3 className="text-lg font-semibold text-ink">Join the conversation</h3>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                    Sign in to share your progress, encourage others and take part in the weekly challenges. Sharing is
                    always optional.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/login" state={{ from: '/community' }} className="btn-primary">
                    Sign in
                  </Link>
                  <Link to="/signup" className="btn-outline">
                    Create account
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="card p-6 sm:p-7">
                <label className="label" htmlFor="post-content">
                  What would you like to share?
                </label>
                <textarea
                  id="post-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value.slice(0, CONTENT_LIMIT))}
                  rows={4}
                  maxLength={CONTENT_LIMIT}
                  className="input mt-1 min-h-[7rem] resize-y"
                  placeholder="A small win, a question, a routine you loved…"
                />
                <div className="mt-1 flex justify-end">
                  <span className={`text-xs ${content.length >= CONTENT_LIMIT ? 'text-red-600' : 'text-muted'}`}>
                    {content.length} / {CONTENT_LIMIT}
                  </span>
                </div>

                <fieldset className="mt-5">
                  <legend className="label">Post type</legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {POST_TYPES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPostType(option.value)}
                        aria-pressed={postType === option.value}
                        className={`chip transition ${postType === option.value ? 'chip-active' : 'hover:border-sage-300'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {postType === 'achievement' && (
                  <div className="mt-5">
                    <label className="label" htmlFor="post-achievement">
                      Which badge are you celebrating?
                    </label>
                    {earnedAchievements.length === 0 ? (
                      <p className="text-sm text-muted">
                        You have not unlocked a badge yet — keep practising and it will appear here.
                      </p>
                    ) : (
                      <select
                        id="post-achievement"
                        value={achievementKey}
                        onChange={(event) => setAchievementKey(event.target.value)}
                        className="input"
                      >
                        <option value="">Select a badge</option>
                        {earnedAchievements.map((badge) => (
                          <option key={badge.key} value={badge.key}>
                            {badge.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {postType === 'routine' && (
                  <div className="mt-5">
                    <label className="label" htmlFor="post-routine">
                      Which routine would you like to share?
                    </label>
                    {routines.length === 0 ? (
                      <p className="text-sm text-muted">
                        You have not created a routine yet.{' '}
                        <Link to="/plans" className="link">
                          Build a routine
                        </Link>{' '}
                        first.
                      </p>
                    ) : (
                      <select
                        id="post-routine"
                        value={routineId}
                        onChange={(event) => setRoutineId(event.target.value)}
                        className="input"
                      >
                        <option value="">Select a routine</option>
                        {routines.map((routine) => (
                          <option key={routine._id} value={routine._id}>
                            {routine.title} · {formatDuration(routine.durationMinutes)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-line bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">Share publicly</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        Off = saved as a private note only visible to you. On = posted to the community feed.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isPublic}
                      aria-label="Share publicly"
                      onClick={() => setIsPublic((value) => !value)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${isPublic ? 'bg-sage-600' : 'bg-sage-200 dark:bg-sage-700'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isPublic ? 'left-[1.375rem]' : 'left-0.5'}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? (
                      <>
                        <Spinner size="sm" /> Posting…
                      </>
                    ) : (
                      <>
                        <Send size={16} aria-hidden="true" /> Post
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------- Feed --------------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeading
            eyebrow="Feed"
            title="Community feed"
            description="Updates, badges and routines shared by other members."
            action={
              <div
                className="inline-flex rounded-full border border-line bg-card p-1"
                role="group"
                aria-label="Filter posts"
              >
                {feedSegments.map((segment) => (
                  <button
                    key={segment.value}
                    type="button"
                    onClick={() => selectFeedFilter(segment.value)}
                    aria-pressed={feedFilter === segment.value}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      feedFilter === segment.value ? 'bg-sage-600 text-white' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {segment.label}
                  </button>
                ))}
              </div>
            }
          />

          <div className="mt-8">
            {feedLoading ? (
              <Loader label="Loading the community feed…" />
            ) : feedError ? (
              <ErrorState
                title="We could not load the feed"
                description={feedError}
                onRetry={() => loadFeed(page)}
              />
            ) : posts.length === 0 ? (
              <EmptyState
                icon={Users}
                title={feedFilter === 'mine' ? 'You have not posted yet' : 'The feed is quiet'}
                description={
                  feedFilter === 'mine'
                    ? 'Share an update or a badge to see it here.'
                    : 'Be the first to share something with the community.'
                }
              />
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      likeBusy={likeBusyId === post.id}
                      canDelete={post.isMine || isAdmin}
                      resolveBadge={resolveBadge}
                      onLike={handleLike}
                      onReport={handleOpenReport}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>

                {feedMeta && feedMeta.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={feedMeta.page <= 1}
                      className="btn-outline btn-sm"
                    >
                      <ChevronLeft size={15} aria-hidden="true" /> Newer
                    </button>
                    <p className="text-xs text-muted">
                      Page {feedMeta.page} of {feedMeta.totalPages}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(feedMeta.totalPages, current + 1))}
                      disabled={feedMeta.page >= feedMeta.totalPages}
                      className="btn-outline btn-sm"
                    >
                      Older <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------- Moderation note ----------------------------- */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:p-8">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100">
              <Leaf size={19} aria-hidden="true" />
            </span>
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <h2 className="text-base font-semibold text-ink">Moderation &amp; privacy</h2>
              <p>
                Our community rewards consistency, never appearance or flexibility. Anything that breaks the guidelines
                can be reported, and three independent reports automatically flag a post for review by our moderation
                team.
              </p>
              <p>
                Your display name is the only personal detail ever shown publicly. Your email, practice history and
                camera data are never shared.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ReportDialog
        open={Boolean(reportTarget)}
        reason={reportReason}
        onChange={setReportReason}
        onCancel={() => {
          setReportTarget(null)
          setReportReason('')
        }}
        onSubmit={handleSubmitReport}
        busy={reporting}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this post?"
        description="This cannot be undone. The post will be removed from the community feed."
        confirmLabel="Delete post"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        busy={deleting}
      />
    </>
  )
}
