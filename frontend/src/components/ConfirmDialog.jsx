import Modal from './Modal'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          autoFocus
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
