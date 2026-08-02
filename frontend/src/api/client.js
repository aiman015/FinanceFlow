// Thin fetch wrapper for the FinanceFlow backend API.
//
// Base URL comes from VITE_API_URL (see .env.example). Falls back to the
// backend's default local dev port so `npm run dev` on both sides "just
// works" without any extra setup.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const TOKEN_KEY = 'ff_token'

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // private-browsing / storage unavailable — the session just won't
    // survive a refresh, but the app keeps working for this tab.
  }
}

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

// Core request helper. `path` is relative to BASE_URL (e.g. '/transactions').
async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE_URL}${path}`

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Could not reach the FinanceFlow server. Is the backend running?',
      0
    )
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.msg || data?.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status, data?.errors)
  }

  return data
}

export const api = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export { ApiError }
