import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/currency'
import { getCategoryIcon } from '../components/categoryIcons'
import { MAX_AMOUNT } from '../utils/validation'
import { EmptyState } from '../components/StateViews'
import { PiggyBank } from 'lucide-react'

export default function Budgets() {
  const { categories, budgets, updateBudget, stats, settings } = useFinance()
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState('')

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const startEdit = (id) => {
    setEditingId(id)
    setDraft(String(budgets[id] ?? 0))
    setDraftError('')
  }

  const save = (id) => {
    const n = Number(draft)
    if (draft !== '' && Number.isNaN(n)) { setDraftError('Enter a valid number'); return }
    if (n < 0) { setDraftError('Budget cannot be negative'); return }
    if (n > MAX_AMOUNT) { setDraftError(`Budget can't exceed ${formatCurrency(MAX_AMOUNT, settings.currency)}`); return }
    updateBudget(id, draft || 0)
    setEditingId(null)
    setDraftError('')
  }

  if (expenseCategories.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <EmptyState
          icon={PiggyBank}
          title="No expense categories yet"
          message="Add an expense category from the Categories page to start budgeting."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {expenseCategories.map((c) => {
        const spent = stats.byCategory[c.id] || 0
        const budget = budgets[c.id] || 0
        const hasBudget = budget > 0
        const pct = hasBudget ? Math.min(Math.round((spent / budget) * 100), 100) : 0
        const rawPct = hasBudget ? Math.round((spent / budget) * 100) : 0
        const over = hasBudget && spent > budget
        const nearLimit = hasBudget && !over && rawPct >= 80
        const remaining = budget - spent
        const Icon = getCategoryIcon(c.icon)

        const statusLabel = !hasBudget ? 'No budget set' : over ? 'Over budget' : nearLimit ? 'Near limit' : 'On track'
        const statusColor = !hasBudget
          ? 'text-slate-400 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
          : over
          ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
          : nearLimit
          ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'
          : 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'

        return (
          <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${c.color}20`, color: c.color }}
                >
                  <Icon size={16} />
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                </div>
              </div>
              {editingId === c.id ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <label htmlFor={`budget-${c.id}`} className="sr-only">Budget for {c.name}</label>
                    <input
                      id={`budget-${c.id}`}
                      autoFocus
                      type="number"
                      min="0"
                      max={MAX_AMOUNT}
                      value={draft}
                      onChange={(e) => { setDraft(e.target.value); setDraftError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && save(c.id)}
                      className={`w-24 border rounded-lg px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:text-slate-100 ${
                        draftError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                      aria-invalid={!!draftError}
                      aria-describedby={draftError ? `budget-${c.id}-error` : undefined}
                    />
                    <button onClick={() => save(c.id)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Save</button>
                  </div>
                  {draftError && <p id={`budget-${c.id}-error`} role="alert" className="text-xs text-red-500">{draftError}</p>}
                </div>
              ) : (
                <button onClick={() => startEdit(c.id)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                  {formatCurrency(spent, settings.currency)} / {hasBudget ? formatCurrency(budget, settings.currency) : 'Set budget'}
                </button>
              )}
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : nearLimit ? 'bg-amber-500' : ''}`}
                style={{ width: `${pct}%`, background: over ? undefined : nearLimit ? undefined : c.color }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className={over ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                {hasBudget ? `${rawPct}% used` : 'No spending limit set'}
              </span>
              {hasBudget && (
                <span className={over ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                  {over
                    ? `Over by ${formatCurrency(Math.abs(remaining), settings.currency)}`
                    : `${formatCurrency(remaining, settings.currency)} remaining`}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
