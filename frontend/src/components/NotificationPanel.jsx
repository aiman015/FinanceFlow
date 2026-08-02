import { useEffect, useRef, useState } from 'react'
import { Bell, AlertTriangle, AlertCircle, X, CheckCheck } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'

export default function NotificationPanel() {
  const { notifications, dismissAlert } = useFinance()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const count = notifications.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        title="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</p>
            {count > 0 && (
              <button
                onClick={() => notifications.forEach((n) => dismissAlert(n.id))}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <CheckCheck size={13} /> Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-10 px-4">
                You're all caught up — no budget alerts right now.
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = n.level === 'error' ? AlertCircle : AlertTriangle
                const color = n.level === 'error'
                  ? 'text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400'
                  : 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400'
                return (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                    <button
                      onClick={() => dismissAlert(n.id)}
                      className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 shrink-0"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
