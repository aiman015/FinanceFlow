import { Menu, Moon, Sun, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import NotificationPanel from './NotificationPanel'

export default function Topbar({ onMenuClick, title, subtitle }) {
  const { settings, updateSettings } = useFinance()
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => updateSettings({ darkMode: !settings.darkMode }, { silent: true })}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Toggle theme"
        >
          {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationPanel />
        <Link
          to="/settings"
          title={`${settings.name || 'Your account'} — edit profile`}
          aria-label="Open your profile settings"
          className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-sm font-semibold ring-offset-2 ring-offset-white dark:ring-offset-slate-900 hover:ring-2 hover:ring-emerald-500 transition-shadow"
        >
          {settings.name?.[0]?.toUpperCase() || 'U'}
        </Link>
        <button
          onClick={logout}
          title="Log out"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
