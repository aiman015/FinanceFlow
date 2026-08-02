import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null)

  // Escape closes the modal, and focus moves into it on open so keyboard
  // users land somewhere sensible instead of staying on the trigger button.
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-transparent dark:border-slate-800 outline-none max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
