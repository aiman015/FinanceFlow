import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}
const COLORS = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-slate-800',
}

const DEFAULT_DURATION = 3000
const ACTION_DURATION = 6000 // give people more time to notice/click "Undo"

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  // `options.action` = { label, onClick } renders an inline button (e.g. "Undo").
  const showToast = useCallback((message, type = 'success', options = {}) => {
    const id = crypto.randomUUID()
    const { action } = options
    setToasts((prev) => [...prev, { id, message, type, action }])
    timers.current[id] = setTimeout(() => removeToast(id), action ? ACTION_DURATION : DEFAULT_DURATION)
    return id
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={`animate-toast flex items-center gap-2 ${COLORS[t.type]} text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg min-w-[240px]`}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick?.()
                    removeToast(t.id)
                  }}
                  className="font-semibold underline underline-offset-2 hover:opacity-90 shrink-0"
                >
                  {t.action.label}
                </button>
              )}
              <button onClick={() => removeToast(t.id)} className="opacity-80 hover:opacity-100 shrink-0" aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
