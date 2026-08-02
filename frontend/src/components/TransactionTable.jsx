import { Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Receipt } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { getCategoryIcon } from './categoryIcons'
import { formatCurrency } from '../utils/currency'
import { EmptyState } from './StateViews'

export default function TransactionTable({ transactions, onEdit, onDelete, compact = false }) {
  const { getCategory, settings } = useFinance()

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions found"
        message="Try adjusting your filters, or add a new transaction to get started."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <th className="py-2.5 font-medium">Title</th>
            <th className="py-2.5 font-medium">Category</th>
            <th className="py-2.5 font-medium">Type</th>
            <th className="py-2.5 font-medium">Amount</th>
            {!compact && <th className="py-2.5 font-medium">Date</th>}
            <th className="py-2.5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const cat = getCategory(t.category)
            const Icon = getCategoryIcon(cat.icon) || (t.type === 'income' ? ArrowDownCircle : ArrowUpCircle)
            const isIncome = t.type === 'income'
            return (
              <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${cat.color}20`, color: cat.color }}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{t.title}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-slate-500 dark:text-slate-400">{cat.name}</td>
                <td className="py-3 pr-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'}`}>
                    {isIncome ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className={`py-3 pr-3 font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                </td>
                {!compact && (
                  <td className="py-3 pr-3 text-slate-500 dark:text-slate-400">
                    {new Date(t.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </td>
                )}
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`} className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-500 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => onDelete(t.id)} aria-label={`Delete ${t.title}`} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
