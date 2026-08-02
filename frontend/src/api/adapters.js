// The React app was originally built against a localStorage shape. The
// backend models use slightly different field names (Mongo _id, description
// instead of title, currentAmount/targetDate instead of savedAmount/deadline,
// etc). These adapters translate both ways so the rest of the app — every
// page and component — can keep using the original field names unchanged.

const toDateInputValue = (value) => {
  if (!value) return null
  const s = typeof value === 'string' ? value : new Date(value).toISOString()
  return s.slice(0, 10)
}

export const mapCategoryFromApi = (c) => ({
  id: c._id || c.id,
  name: c.name,
  type: c.type,
  icon: c.icon,
  color: c.color,
})

export const mapCategoryToApi = ({ name, type, icon, color }) => ({ name, type, icon, color })

export const mapTransactionFromApi = (t) => ({
  id: t._id || t.id,
  title: t.description || '(No title)',
  amount: t.amount,
  type: t.type,
  category: typeof t.category === 'object' && t.category !== null ? t.category._id : t.category,
  date: toDateInputValue(t.date),
  isRecurring: !!t.isRecurring,
  recurrence: t.recurrence,
})

export const mapTransactionToApi = (tx) => ({
  type: tx.type,
  amount: Number(tx.amount),
  category: tx.category,
  description: (tx.title || '').trim(),
  date: tx.date,
})

export const mapGoalFromApi = (g) => ({
  id: g._id || g.id,
  name: g.name,
  targetAmount: g.targetAmount,
  savedAmount: g.currentAmount ?? 0,
  deadline: toDateInputValue(g.targetDate),
  createdAt: g.createdAt,
  isCompleted: !!g.isCompleted,
})

export const mapGoalToApi = (g) => ({
  name: g.name,
  targetAmount: Number(g.targetAmount),
  ...(g.savedAmount !== undefined ? { currentAmount: Number(g.savedAmount) } : {}),
  targetDate: g.deadline || null,
  ...(g.icon ? { icon: g.icon } : {}),
  ...(g.color ? { color: g.color } : {}),
})
