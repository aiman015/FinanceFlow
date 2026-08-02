import Spinner from './Spinner'
import { Inbox, AlertTriangle } from 'lucide-react'

/**
 * Generic "loading" placeholder for panels/cards/charts that need to show
 * something while data is being computed or a file is being processed.
 */
export function LoadingState({ label = 'Loading…', height = 200 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500"
      style={{ minHeight: height }}
    >
      <Spinner size={22} />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/**
 * Generic "nothing here yet" placeholder with an icon, message, and an
 * optional call-to-action button.
 */
export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon size={22} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      {title && <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>}
      {message && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Generic inline error placeholder for a panel/card that failed to render
 * its data (as opposed to a full crash, which ErrorBoundary handles).
 */
export function ErrorState({ title = 'Something went wrong', message = 'Please try again.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3">
        <AlertTriangle size={22} className="text-red-500 dark:text-red-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}
