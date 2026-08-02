import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency, formatCurrencyCompact } from '../utils/currency'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function IncomeExpenseChart() {
  const { stats, settings } = useFinance()

  const data = stats.monthlyTrend.map((m) => ({
    ...m,
    label: MONTH_LABELS[Number(m.month.split('-')[1]) - 1],
  }))

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 py-16 text-center">No transactions yet — add one to see trends.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v, settings.currency)} />
        <Tooltip
          formatter={(v) => [formatCurrency(v, settings.currency), undefined]}
          contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
