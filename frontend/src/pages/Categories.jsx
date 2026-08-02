import { useState } from 'react'
import { Plus, Pencil, Trash2, Tags, RotateCcw } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/currency'
import { getCategoryIcon } from '../components/categoryIcons'
import { DEFAULT_CATEGORIES } from '../data/categories'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import CategoryForm from '../components/CategoryForm'
import { EmptyState } from '../components/StateViews'

export default function Categories() {
  const { categories, transactions, settings, addCategory, updateCategory, deleteCategory } = useFinance()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [restoring, setRestoring] = useState(false)

  const restoreDefaults = async () => {
    setRestoring(true)
    // addCategory is fire-and-forget internally, but sequencing these avoids
    // firing 7 requests at once and keeps the duplicate-name check accurate
    // (it reads the categories already in state).
    for (const c of DEFAULT_CATEGORIES) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { addCategory(c); setTimeout(resolve, 120) })
    }
    setRestoring(false)
  }

  const withStats = categories.map((c) => {
    const catTx = transactions.filter((t) => t.category === c.id)
    const total = catTx.reduce((s, t) => s + t.amount, 0)
    return { ...c, total, count: catTx.length }
  })

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {withStats.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <EmptyState
            icon={Tags}
            title="No categories yet"
            message="Create a category to start organizing your income and expenses, or restore the default set to get going instantly."
          />
          <div className="flex justify-center pb-6 -mt-2">
            <button
              onClick={restoreDefaults}
              disabled={restoring}
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-60"
            >
              <RotateCcw size={14} className={restoring ? 'animate-spin' : ''} />
              {restoring ? 'Restoring…' : 'Restore Default Categories'}
            </button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {withStats.map((c) => {
          const Icon = getCategoryIcon(c.icon)
          return (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm group relative">
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                <button
                  onClick={() => setEditing(c)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-500 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10"
                  aria-label={`Edit ${c.name} category`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                  aria-label={`Delete ${c.name} category`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: c.color }}>
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{c.type}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(c.total, settings.currency)}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{c.count} transaction{c.count !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Category">
        <CategoryForm
          onSubmit={(vals) => {
            const ok = addCategory(vals)
            if (ok) setShowAdd(false)
            return ok
          }}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Category">
        {editing && (
          <CategoryForm
            initialValues={editing}
            submitLabel="Save Changes"
            onSubmit={(vals) => { updateCategory(editing.id, vals); setEditing(null); return true }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Category"
        message={
          deleting
            ? `Are you sure you want to delete "${deleting.name}"? This can't be undone, and only works if no transactions use it.`
            : ''
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => { deleteCategory(deleting.id); setDeleting(null) }}
      />
    </div>
  )
}
