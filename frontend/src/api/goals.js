import { api } from './client'
import { mapGoalFromApi, mapGoalToApi } from './adapters'

export async function fetchGoals() {
  const res = await api.get('/goals')
  return res.data.map(mapGoalFromApi)
}

export async function createGoalApi(goal) {
  const res = await api.post('/goals', mapGoalToApi(goal))
  return mapGoalFromApi(res.data)
}

export async function updateGoalApi(id, updates) {
  const res = await api.put(`/goals/${id}`, mapGoalToApi(updates))
  return mapGoalFromApi(res.data)
}

export async function deleteGoalApi(id) {
  return api.delete(`/goals/${id}`)
}
