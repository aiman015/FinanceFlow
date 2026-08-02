import { api } from './client'
import { mapCategoryFromApi, mapCategoryToApi } from './adapters'

export async function fetchCategories() {
  const res = await api.get('/categories')
  return res.data.map(mapCategoryFromApi)
}

export async function createCategoryApi(category) {
  const res = await api.post('/categories', mapCategoryToApi(category))
  return mapCategoryFromApi(res.data)
}

export async function updateCategoryApi(id, updates) {
  const res = await api.put(`/categories/${id}`, mapCategoryToApi({ ...updates }))
  return mapCategoryFromApi(res.data)
}

export async function deleteCategoryApi(id) {
  return api.delete(`/categories/${id}`)
}
