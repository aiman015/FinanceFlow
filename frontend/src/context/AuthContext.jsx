import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getToken, setToken } from '../api/client'
import { registerRequest, loginRequest, getMeRequest, updateMeRequest } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while we check for an existing session
  const [authError, setAuthError] = useState(null)

  // On first load, if a token was saved from a previous session, validate it
  // against the backend and restore the user rather than forcing a re-login.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMeRequest()
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    setAuthError(null)
    try {
      const res = await loginRequest(email, password)
      setToken(res.token)
      setUser(res.user)
      return true
    } catch (err) {
      setAuthError(err.message)
      return false
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    setAuthError(null)
    try {
      const res = await registerRequest(name, email, password)
      setToken(res.token)
      setUser(res.user)
      return true
    } catch (err) {
      setAuthError(err.message)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const res = await updateMeRequest(updates)
    setUser(res.user)
    return res.user
  }, [])

  const value = { user, loading, authError, login, register, logout, updateProfile, isAuthenticated: !!user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
