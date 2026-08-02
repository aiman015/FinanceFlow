import { useMemo, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import CategoryPieChart from '../components/CategoryPieChart'
import { formatCurrency, formatCurrencyCompact } from '../utils/currency'
import { getAvailableMonths, formatMonthLabel, filterTransactions } from '../utils/dateFilters'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function computeStats(transactions) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const byCategory = {}
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
  })
  return { income, expenses, balance: income - expenses, byCategory }
}

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function Analytics() {
  const { transactions, settings, getCategory } = useFinance()
  const [tab, setTab] = useState('overview')

  const months = useMemo(() => getAvailableMonths(transactions), [transactions])

  // --- Overview filters: a single month, or an explicit date range -----------
  const [month, setMonth] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const hasDateFilter = month !== 'all' || from || to

  const filtered = useMemo(
    () => filterTransactions(transactions, { month, from, to }),
    [transactions, month, from, to]
  )
  const filteredStats = useMemo(() => computeStats(filtered), [filtered])

  // Full monthly trend (always spans all data — that's the point of a trend view)
  const monthlyTrend = useMemo(() => {
    const monthly = {}
    transactions.forEach((t) => {
      const m = t.date?.slice(0, 7)
      if (!m) return
      if (!monthly[m]) monthly[m] = { income: 0, expenses: 0 }
      monthly[m][t.type === 'income' ? 'income' : 'expenses'] += t.amount
    })
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({ month: m, label: MONTH_LABELS[Number(m.split('-')[1]) - 1], ...v, net: v.income - v.expenses }))
  }, [transactions])

  // Trend read-out: current month vs previous month expenses
  const trendReadout = useMemo(() => {
    if (monthlyTrend.length < 2) return null
    const curr = monthlyTrend[monthlyTrend.length - 1]
    const prev = monthlyTrend[monthlyTrend.length - 2]
    const change = pctChange(curr.expenses, prev.expenses)
    return { currLabel: formatMonthLabel(curr.month), prevLabel: formatMonthLabel(prev.month), change }
  }, [monthlyTrend])

  const topCategories = Object.entries(filteredStats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // --- Compare months tab ------------------------------------------------------
  const [monthA, setMonthA] = useState(months[0] || '')
  const [monthB, setMonthB] = useState(months[1] || '')

  const statsFor = (m) => computeStats(transactions.filter((t) => t.date?.slice(0, 7) === m))
  const statsA = monthA ? statsFor(monthA) : null
  const statsB = monthB ? statsFor(monthB) : null

  const compareData = monthA && monthB ? [
    { name: 'Income', [formatMonthLabel(monthA)]: statsA.income, [formatMonthLabel(monthB)]: statsB.income },
    { name: 'Expenses', [formatMonthLabel(monthA)]: statsA.expenses, [formatMonthLabel(monthB)]: statsB.expenses },
    { name: 'Net', [formatMonthLabel(monthA)]: statsA.balance, [formatMonthLabel(monthB)]: statsB.balance },
  ] : []

  const TrendIcon = trendReadout ? (trendReadout.change > 0 ? TrendingUp : trendReadout.change < 0 ? TrendingDown : Minus) : Minus

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2 bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800 w-fit">
        {[{ id: 'overview', label: 'Overview' }, { id: 'compare', label: 'Compare Months' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Month</label>
              <select
                value={month}
                onChange={(e) => { setMonth(e.target.value); if (e.target.value !== 'all') { setFrom(''); setTo('') } }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="all">All Months</option>
                {months.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">From</label>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value) setMonth('all') }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">To</label>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); if (e.target.value) setMonth('all') }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500" />
            </div>
            {hasDateFilter && (
              <button onClick={() => { setMonth('all'); setFrom(''); setTo('') }} className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 mb-0.5">
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Income</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(filteredStats.income, settings.currency)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">{formatCurrency(filteredStats.expenses, settings.currency)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-sm text-slate-500 dark:text-slate-400">Net Savings</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(filteredStats.balance, settings.currency)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Monthly Trend</h2>
              {trendReadout && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  trendReadout.change > 0 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  : trendReadout.change < 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  <TrendIcon size={13} />
                  Spending {trendReadout.change > 0 ? 'up' : trendReadout.change < 0 ? 'down' : 'flat'} {Math.abs(trendReadout.change)}% vs {trendReadout.prevLabel}
                </span>
              )}
            </div>
            {monthlyTrend.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-16 text-center">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v, settings.currency)} />
                  <Tooltip formatter={(v) => formatCurrency(v, settings.currency)} contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Spending by Category{hasDateFilter ? ' (filtered)' : ''}</h2>
              <CategoryPieChart transactions={filtered} />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Top Spending Categories</h2>
              {topCategories.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-16 text-center">No expenses yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCategories.map(([id, amount], i) => {
                    const cat = getCategory(id)
                    const pct = filteredStats.expenses ? Math.round((amount / filteredStats.expenses) * 100) : 0
                    return (
                      <div key={id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">#{i + 1} {cat.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">{formatCurrency(amount, settings.currency)} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'compare' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Month A</label>
              <select value={monthA} onChange={(e) => setMonthA(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500">
                <option value="">Select month</option>
                {months.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Month B</label>
              <select value={monthB} onChange={(e) => setMonthB(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500">
                <option value="">Select month</option>
                {months.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
              </select>
            </div>
          </div>

          {!monthA || !monthB ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">Pick two months to compare income, expenses, and net savings side by side.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: formatMonthLabel(monthA), s: statsA, other: statsB }, { label: formatMonthLabel(monthB), s: statsB, other: statsA }].map(({ label, s, other }) => (
                  <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{label}</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Income</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.income, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Expenses</span>
                      <span className="font-semibold text-red-500 dark:text-red-400">{formatCurrency(s.expenses, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span className="text-slate-500 dark:text-slate-400">Net</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(s.balance, settings.currency)}</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Expenses {pctChange(s.expenses, other.expenses) >= 0 ? 'up' : 'down'} {Math.abs(pctChange(s.expenses, other.expenses))}% vs the other month
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Side-by-Side Comparison</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={compareData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v, settings.currency)} />
                    <Tooltip formatter={(v) => formatCurrency(v, settings.currency)} contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey={formatMonthLabel(monthA)} fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={formatMonthLabel(monthB)} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
