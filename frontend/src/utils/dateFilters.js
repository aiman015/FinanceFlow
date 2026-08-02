// Shared helpers for filtering transactions by month / date range,
// and for building the list of months that have data (used to populate
// month pickers on the Transactions and Analytics pages).

export function getAvailableMonths(transactions) {
  const months = new Set(transactions.map((t) => t.date?.slice(0, 7)).filter(Boolean))
  return Array.from(months).sort((a, b) => b.localeCompare(a)) // most recent first
}

export function formatMonthLabel(month) {
  if (!month) return ''
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function inDateRange(dateStr, from, to) {
  if (!dateStr) return false
  if (from && dateStr < from) return false
  if (to && dateStr > to) return false
  return true
}

export function filterTransactions(transactions, { query, typeFilter, categoryFilter, month, from, to }) {
  return transactions
    .filter((t) => !query || t.title.toLowerCase().includes(query.toLowerCase()))
    .filter((t) => !typeFilter || typeFilter === 'all' || t.type === typeFilter)
    .filter((t) => !categoryFilter || categoryFilter === 'all' || t.category === categoryFilter)
    .filter((t) => !month || month === 'all' || t.date?.slice(0, 7) === month)
    .filter((t) => (!from && !to) || inDateRange(t.date, from, to))
}
