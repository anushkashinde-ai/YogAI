import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-sage-200 bg-sage-50 text-sage-800 dark:border-sage-700 dark:bg-sage-900/70 dark:text-sage-50',
    iconClass: 'text-sage-600 dark:text-sage-300',
  },
  error: {
    icon: XCircle,
    wrapper: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/70 dark:text-red-100',
    iconClass: 'text-red-600 dark:text-red-300',
  },
  warning: {
    icon: TriangleAlert,
    wrapper:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100',
    iconClass: 'text-amber-600 dark:text-amber-300',
  },
  info: {
    icon: Info,
    wrapper:
      'border-lavender-200 bg-lavender-50 text-lavender-900 dark:border-lavender-700 dark:bg-lavender-950/60 dark:text-lavender-100',
    iconClass: 'text-lavender-600 dark:text-lavender-300',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (type, message, options = {}) => {
      counter.current += 1
      const id = counter.current
      const duration = options.duration ?? 4500

      setToasts((current) => [...current.slice(-3), { id, type, message, title: options.title }])

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      push,
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      warning: (message, options) => push('warning', message, options),
      info: (message, options) => push('info', message, options),
    }),
    [toasts, dismiss, push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const variant = VARIANTS[toast.type] || VARIANTS.info
            const Icon = variant.icon

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift backdrop-blur ${variant.wrapper}`}
                role="status"
                aria-live="polite"
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${variant.iconClass}`} aria-hidden="true" />
                <div className="min-w-0 flex-1 text-sm">
                  {toast.title && <p className="font-semibold">{toast.title}</p>}
                  <p className="leading-snug">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 rounded-full p-1 opacity-60 transition hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a ToastProvider')
  return context
}

export default ToastContext
