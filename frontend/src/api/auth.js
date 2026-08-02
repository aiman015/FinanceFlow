import { api } from './client'

export const registerRequest = (name, email, password) =>
  api.post('/auth/register', { name, email, password })

export const loginRequest = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMeRequest = () => api.get('/auth/me')

export const updateMeRequest = (updates) => api.put('/auth/me', updates)
