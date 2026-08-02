import { api } from './client'

const mapBudgetFromApi = (b) => ({
  id: b._id,
  categoryId: typeof b.category === 'object' && b.category !== null ? b.category._id : b.category,
  limit: b.limit,
})

// The frontend UI only ever deals with "the current month's budget per
// category" (a flat { categoryId: amount } map). The backend models budgets
// per period/month/year, so we scope every call to the current calendar
// month here and let FinanceContext turn the list into that flat map.
export async function fetchCurrentBudgets() {
  const now = new Date()
  const res = await api.get('/budgets', { year: now.getFullYear(), month: now.getMonth() })
  return res.data.map(mapBudgetFromApi)
}

export async function createBudgetApi(categoryId, limit) {
  const now = new Date()
  const res = await api.post('/budgets', {
    category: categoryId,
    limit,
    period: 'monthly',
    month: now.getMonth(),
    year: now.getFullYear(),
  })
  return mapBudgetFromApi(res.data)
}

export async function updateBudgetApi(id, limit) {
  const res = await api.put(`/budgets/${id}`, { limit })
  return mapBudgetFromApi(res.data)
}

export async function deleteBudgetApi(id) {
  return api.delete(`/budgets/${id}`)
}
