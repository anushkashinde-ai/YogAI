import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  Compass,
  Heart,
  Leaf,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  TriangleAlert,
  User,
  Wind,
} from 'lucide-react'

import { aiService } from '../services/yogaService.js'
import { getErrorMessage } from '../services/api.js'
import { ASSISTANT_SUGGESTIONS } from '../config/appConfig.js'
import { DemoBadge } from '../components/ui.jsx'
import { Spinner } from '../components/Loader.jsx'
import { useToast } from '../context/ToastContext.jsx'

const WELCOME = {
  role: 'assistant',
  welcome: true,
  content:
    "Namaste! I'm Yogi Assistant, your guide here inside YogAI. I can help you understand poses and their cues, plan a gentle beginner routine, learn breathing techniques, find poses that suit how you feel, explain yoga terminology and think through routine planning. Ask me anything — and remember, I offer general yoga information only, never medical advice.",
}

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: 'Understand poses',
    body: 'Cues, benefits and common mistakes for the poses in the YogAI library.',
  },
  {
    icon: Leaf,
    title: 'Beginner routines',
    body: 'A gentle sequence you could follow today, shaped around the time you have.',
  },
  {
    icon: Wind,
    title: 'Breathing techniques',
    body: 'Pranayama such as box breathing and relaxing breath, explained simply.',
  },
  {
    icon: Compass,
    title: 'Find suitable poses',
    body: 'Suggestions that match your level, any stiffness and how you feel.',
  },
  {
    icon: MessageCircle,
    title: 'Yoga terminology',
    body: 'What asana, vinyasa, hatha and namaste actually mean.',
  },
  {
    icon: Heart,
    title: 'Routine planning',
    body: 'How often to practise and how to build a habit that actually sticks.',
  },
]

const DEFAULT_DISCLAIMER =
  'Yogi Assistant offers general yoga information only and is not a substitute for medical advice.'

/** Split a reply into lines and render simple bold + bullets — no HTML injection. */
function renderInline(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      /^\*\*[^*]+\*\*$/.test(part) ? (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={index}>{part}</span>
      )
    )
}

function renderReply(content) {
  return String(content)
    .split('\n')
    .map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return <span key={index} className="block h-2" aria-hidden="true" />

      const bullet = trimmed.match(/^[-*•]\s+(.*)$/)
      if (bullet) {
        return (
          <span key={index} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" aria-hidden="true" />
            <span className="flex-1">{renderInline(bullet[1])}</span>
          </span>
        )
      }

      return (
        <span key={index} className="block">
          {renderInline(line)}
        </span>
      )
    })
}

/** Animated three-dot "assistant is thinking" indicator. */
function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 py-1" role="status" aria-label="Yogi Assistant is thinking">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
        />
      ))}
    </span>
  )
}

/**
 * Full-page Yogi Assistant — a chat panel plus a sidebar of suggestions and
 * capabilities. The floating widget is the compact version of this page.
 */
export default function Assistant() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const [disclaimer, setDisclaimer] = useState('')
  const [lastQuestion, setLastQuestion] = useState('')

  const toast = useToast()
  const textareaRef = useRef(null)
  const listRef = useRef(null)

  // Focus the composer straight away and learn the assistant's current mode.
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    let active = true

    aiService
      .status()
      .then(({ data }) => {
        if (active) setStatus(data)
      })
      .catch(() => {
        // Silent — the assistant still works without a status badge.
      })

    return () => {
      active = false
    }
  }, [])

  // Keep the newest message in view, inside the panel only.
  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, sending])

  const buildHistory = (list) =>
    list
      .filter((message) => !message.welcome && !message.pending && !message.isError)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }))

  const requestReply = async (question, { appendUser = true } = {}) => {
    const trimmed = String(question || '').trim()
    if (!trimmed || sending) return

    const history = buildHistory(messages)
    const pendingId = `pending-${Date.now()}`

    setMessages((current) => {
      const base = appendUser ? current : current.filter((message) => !message.isError)
      const next = appendUser ? [...base, { role: 'user', content: trimmed }] : base
      return [...next, { role: 'assistant', content: '', pending: true, id: pendingId, question: trimmed }]
    })

    setInput('')
    setLastQuestion(trimmed)
    setSending(true)

    try {
      const { data } = await aiService.chat(trimmed, history)
      setMessages((current) =>
        current.map((message) =>
          message.id === pendingId ? { role: 'assistant', content: data.reply, demo: data.demo } : message
        )
      )
      if (data.disclaimer) setDisclaimer(data.disclaimer)
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === pendingId
            ? {
                role: 'assistant',
                content: getErrorMessage(error, 'I could not answer that right now. Please try again in a moment.'),
                isError: true,
                question: trimmed,
              }
            : message
        )
      )
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const send = (text) => requestReply(text ?? input, { appendUser: true })
  const retry = (question) => requestReply(question, { appendUser: false })

  const handleSubmit = (event) => {
    event?.preventDefault?.()
    send()
  }

  const focusComposer = () => textareaRef.current?.focus()

  const clearConversation = () => {
    setMessages([WELCOME])
    setInput('')
    setLastQuestion('')
    setDisclaimer('')
    toast.info('Conversation cleared.')
    textareaRef.current?.focus()
  }

  return (
    <div className="container-x py-8 sm:py-10">
      {/* --------------------------------- Header -------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sage-500 to-lavender-500 text-white">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Yogi Assistant</h1>
            <p className="text-sm text-muted">
              Ask about poses, breathing techniques, routines and yoga terminology.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {status?.mode === 'demo' && (
            <DemoBadge>Demo mode — answers come from YogAI's built-in yoga guide</DemoBadge>
          )}
          {status?.mode === 'live' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-300 bg-sage-50 px-2.5 py-1 text-[11px] font-semibold text-sage-700 dark:border-sage-600 dark:bg-sage-900/60 dark:text-sage-100">
              <span className="h-1.5 w-1.5 rounded-full bg-sage-500" aria-hidden="true" />
              Live AI
            </span>
          )}
          {status?.label && <p className="max-w-xs text-right text-[11px] leading-snug text-muted">{status.label}</p>}
        </div>
      </div>

      {/* -------------------------------- Toolbar ------------------------------- */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={focusComposer} className="btn-outline btn-sm">
          <MessageCircle size={14} aria-hidden="true" />
          New question
        </button>
        <button type="button" onClick={clearConversation} className="btn-ghost btn-sm">
          <Trash2 size={14} aria-hidden="true" />
          Clear conversation
        </button>
      </div>

      {/* ------------------------------ Chat + sidebar -------------------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Chat panel */}
        <div className="card flex h-[70vh] min-h-[28rem] flex-col overflow-hidden lg:h-[38rem]">
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation with Yogi Assistant"
            className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
          >
            {messages.map((message, index) => {
              const isUser = message.role === 'user'

              return (
                <div key={index} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender-600 text-white">
                      <Bot size={15} aria-hidden="true" />
                    </span>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-sage-600 text-white'
                        : message.isError
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200'
                          : 'bg-sage-50 text-ink dark:bg-sage-800/70'
                    }`}
                  >
                    {message.pending ? (
                      <ThinkingDots />
                    ) : isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      renderReply(message.content)
                    )}

                    {message.isError && (
                      <button
                        type="button"
                        onClick={() => retry(message.question || lastQuestion)}
                        disabled={sending}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/40"
                      >
                        <RefreshCw size={13} aria-hidden="true" />
                        Try again
                      </button>
                    )}
                  </div>

                  {isUser && (
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-600 text-white">
                      <User size={15} aria-hidden="true" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Composer */}
          <form onSubmit={handleSubmit} className="border-t border-line px-3 py-3 sm:px-4">
            <div className="flex items-end gap-2">
              <label htmlFor="assistant-message" className="sr-only">
                Message Yogi Assistant
              </label>
              <textarea
                id="assistant-message"
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Ask about a pose, a breath or a routine…"
                maxLength={1000}
                className="input max-h-40 min-h-[2.75rem] flex-1 resize-none py-3"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lavender-600 text-white transition hover:bg-lavender-700 disabled:opacity-50"
                aria-label="Send message"
              >
                {sending ? <Spinner size="sm" className="text-white" /> : <Send size={18} aria-hidden="true" />}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted">
              <span>Enter to send · Shift + Enter for a new line</span>
              {input.length > 900 && <span>{input.length}/1000</span>}
            </div>
          </form>

          {/* Persistent disclaimer — shown once, not per message */}
          <p className="flex items-start gap-1.5 border-t border-line px-4 py-2 text-[11px] leading-snug text-muted">
            <TriangleAlert size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {disclaimer || DEFAULT_DISCLAIMER}
          </p>
        </div>

        {/* Sidebar — inline below the chat on smaller screens */}
        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink">Suggested questions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  disabled={sending}
                  className="chip text-left transition hover:border-lavender-400 hover:text-ink disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink">What I can help with</h2>
            <ul className="mt-3 space-y-3">
              {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-100">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{title}</span>
                    <span className="block text-xs leading-relaxed text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
              <TriangleAlert size={15} aria-hidden="true" />
              Limitations
            </p>
            <p className="mt-2 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              Yogi Assistant gives general yoga information only. It is not a medical professional and cannot diagnose
              or treat any condition. Stop if you feel pain and consult a qualified teacher or doctor whenever you are
              unsure.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
