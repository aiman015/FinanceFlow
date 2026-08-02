import { useState } from 'react'
import { Pencil, Trash2, Target, PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import { MAX_AMOUNT } from '../utils/validation'

export default function GoalCard({ goal, currency, onEdit, onDelete, onContribute }) {
  const [amount, setAmount] = useState('')
  const pct = goal.targetAmount > 0 ? Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100) : 0
  const complete = goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0)

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const apply = (sign) => {
    const n = Number(amount)
    if (!n || n <= 0 || n > MAX_AMOUNT) return
    onContribute(goal.id, sign * n)
    setAmount('')
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${complete ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>
            {complete ? <CheckCircle2 size={18} /> : <Target size={18} />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{goal.name}</p>
            {goal.deadline && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {daysLeft >= 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Past target date'} · {new Date(goal.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(goal)} aria-label={`Edit ${goal.name} goal`} className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-500 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(goal.id)} aria-label={`Delete ${goal.name} goal`} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {formatCurrency(goal.savedAmount, currency)} <span className="text-slate-400 dark:text-slate-500 font-normal">of {formatCurrency(goal.targetAmount, currency)}</span>
        </span>
        <span className={`font-semibold ${complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
        {complete ? 'Goal reached! 🎉' : `${formatCurrency(remaining, currency)} to go`}
      </p>

      {!complete && (
        <div className="flex items-center gap-2 mt-3">
          <label htmlFor={`contribute-${goal.id}`} className="sr-only">Contribution amount for {goal.name}</label>
          <input
            id={`contribute-${goal.id}`}
            type="number"
            step="0.01"
            min="0"
            max={MAX_AMOUNT}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <button onClick={() => apply(1)} aria-label="Add to progress" title="Add to progress" className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
            <PlusCircle size={20} />
          </button>
          <button onClick={() => apply(-1)} aria-label="Subtract from progress" title="Subtract from progress" className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800">
            <MinusCircle size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
