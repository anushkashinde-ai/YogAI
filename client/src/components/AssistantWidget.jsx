import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, Sparkles, Trash2, X } from 'lucide-react'
import { aiService } from '../services/yogaService.js'
import { getErrorMessage } from '../services/api.js'
import { ASSISTANT_SUGGESTIONS } from '../config/appConfig.js'
import { DemoBadge } from './ui.jsx'
import { Spinner } from './Loader.jsx'

const GREETING = {
  role: 'assistant',
  content:
    "Namaste! I'm Yogi Assistant. Ask me about yoga poses, breathing techniques, beginner routines or yoga terminology — I'm always happy to help.",
}

/**
 * Floating Yogi Assistant. Renders on every page so help is always one tap away.
 */
export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const location = useLocation()

  // Close the panel when the route changes (e.g. user navigates away).
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open || status) return

    aiService
      .status()
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus({ mode: 'demo', label: 'Demo mode' }))
  }, [open, status])

  const send = async (text) => {
    const message = (text ?? input).trim()
    if (!message || sending) return

    const history = messages
      .filter((item) => item !== GREETING)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }))

    setMessages((current) => [...current, { role: 'user', content: message }])
    setInput('')
    setSending(true)

    try {
      const { data } = await aiService.chat(message, history)
      setMessages((current) => [...current, { role: 'assistant', content: data.reply, demo: data.demo }])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: getErrorMessage(error, 'I could not answer that right now. Please try again in a moment.'),
          isError: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-[90] flex items-center gap-2 rounded-full bg-lavender-600 px-4 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-lavender-700"
        aria-label={open ? 'Close Yogi Assistant' : 'Open Yogi Assistant'}
        aria-expanded={open}
      >
        {open ? <X size={18} aria-hidden="true" /> : <Bot size={18} aria-hidden="true" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Ask Yogi'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-4 z-[90] flex h-[30rem] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-lift"
            role="dialog"
            aria-label="Yogi Assistant chat"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line bg-gradient-to-r from-lavender-50 to-sage-50 px-4 py-3 dark:from-lavender-950/50 dark:to-sage-950/40">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-lavender-600 text-white">
                  <Sparkles size={15} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Yogi Assistant</p>
                  <p className="text-[11px] text-muted">{status?.label || 'Yoga guidance on demand'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessages([GREETING])}
                className="rounded-full p-1.5 text-muted transition hover:text-ink"
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {status && status.mode !== 'live' && (
              <div className="border-b border-line bg-amber-50/70 px-4 py-2 dark:bg-amber-950/30">
                <DemoBadge>Demo mode — built-in yoga answers</DemoBadge>
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-sage-600 text-white'
                        : message.isError
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200'
                          : 'bg-sage-50 text-ink dark:bg-sage-800/70'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Spinner size="sm" className="text-lavender-500" />
                  Yogi Assistant is thinking…
                </div>
              )}

              {messages.length === 1 && !sending && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Try asking</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ASSISTANT_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => send(suggestion)}
                        className="chip transition hover:border-lavender-400 hover:text-ink"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                send()
              }}
              className="flex items-center gap-2 border-t border-line px-3 py-3"
            >
              <label htmlFor="assistant-input" className="sr-only">
                Message Yogi Assistant
              </label>
              <input
                id="assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about a pose or breath…"
                className="input py-2.5"
                maxLength={1000}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lavender-600 text-white transition hover:bg-lavender-700 disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>

            <p className="border-t border-line px-4 py-2 text-[10px] leading-snug text-muted">
              General yoga information only — not medical advice. See our{' '}
              <Link to="/assistant" className="underline">
                full assistant
              </Link>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
