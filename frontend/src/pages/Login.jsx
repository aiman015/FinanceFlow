import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, authError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Enter your email and password')
      return
    }
    setSubmitting(true)
    const ok = await login(form.email.trim(), form.password)
    setSubmitting(false)
    if (ok) navigate(redirectTo, { replace: true })
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-emerald-500'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3">
            <Wallet size={22} />
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">FinanceFlow</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          {(error || authError) && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
              {error || authError}
            </p>
          )}
          <div>
            <label htmlFor="login-email" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
