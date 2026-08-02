import { useState } from 'react'
import { Plus, PiggyBank } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import GoalCard from '../components/GoalCard'
import GoalForm from '../components/GoalForm'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency } from '../utils/currency'

export default function Goals() {
  const { goals, settings, addGoal, updateGoal, contributeToGoal, deleteGoal } = useFinance()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0)
  const completedCount = goals.filter((g) => g.targetAmount > 0 && g.savedAmount >= g.targetAmount).length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Saved</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(totalSaved, settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Target</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(totalTarget, settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Goals Completed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount} / {goals.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
          <PiggyBank size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 dark:text-slate-500">No savings goals yet. Create one to start tracking progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              currency={settings.currency}
              onEdit={setEditing}
              onDelete={setDeletingId}
              onContribute={contributeToGoal}
            />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Savings Goal">
        <GoalForm onSubmit={(vals) => { addGoal(vals); setShowAdd(false) }} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Goal">
        {editing && (
          <GoalForm
            initialValues={editing}
            submitLabel="Save Changes"
            onSubmit={(vals) => { updateGoal(editing.id, vals); setEditing(null) }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        title="Delete Goal"
        message="Are you sure you want to delete this savings goal? This action cannot be undone."
        onCancel={() => setDeletingId(null)}
        onConfirm={() => { deleteGoal(deletingId); setDeletingId(null) }}
      />
    </div>
  )
}
