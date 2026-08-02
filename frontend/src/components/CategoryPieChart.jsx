import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/currency'

// Optionally accepts a `transactions` override (e.g. a filtered subset from
// the Analytics page); falls back to the app-wide stats when omitted.
export default function CategoryPieChart({ transactions }) {
  const { stats, getCategory, settings } = useFinance()

  const byCategory = transactions
    ? transactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {})
    : stats.byCategory

  const entries = Object.entries(byCategory)
  const total = entries.reduce((s, [, v]) => s + v, 0)

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 py-16 text-center">No expenses yet.</p>
  }

  const data = entries
    .map(([id, value]) => ({ id, name: getCategory(id).name, value, color: getCategory(id).color }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ResponsiveContainer width={160} height={160} className="shrink-0">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.id} fill={d.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v, settings.currency)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 w-full space-y-2">
        {data.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(d.value, settings.currency)} ({total ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
