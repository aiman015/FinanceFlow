import { api } from './client'
import { mapTransactionFromApi, mapTransactionToApi } from './adapters'

// The backend caps `limit` at 100 per page. The app keeps the full
// transaction list in memory (it computes stats/charts client-side), so we
// page through everything once on load rather than teaching every chart and
// table how to paginate.
export async function fetchAllTransactions() {
  const pageSize = 100
  let page = 1
  let totalPages = 1
  const all = []

  do {
    const res = await api.get('/transactions', { page, limit: pageSize, sortBy: 'date', sortOrder: 'desc' })
    all.push(...res.data.map(mapTransactionFromApi))
    totalPages = res.pagination?.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return all
}

export async function createTransactionApi(tx) {
  const res = await api.post('/transactions', mapTransactionToApi(tx))
  return mapTransactionFromApi(res.data)
}

export async function updateTransactionApi(id, updates) {
  const res = await api.put(`/transactions/${id}`, mapTransactionToApi(updates))
  return mapTransactionFromApi(res.data)
}

export async function deleteTransactionApi(id) {
  return api.delete(`/transactions/${id}`)
}

export async function restoreTransactionApi(tx) {
  // "Undo delete" simply re-creates the transaction — the backend doesn't
  // support restoring a specific _id.
  const res = await api.post('/transactions', mapTransactionToApi(tx))
  return mapTransactionFromApi(res.data)
}
