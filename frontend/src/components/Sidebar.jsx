import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, BarChart3, Tags, PiggyBank, Target, Settings, TrendingUp, X,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/currency'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const { stats, settings } = useFinance()

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      {/* `fixed` at every breakpoint keeps the sidebar pinned to the viewport
          while the main content scrolls independently (see Layout.jsx, which
          offsets the content by the sidebar's width on lg+ screens). */}
      <aside
        aria-label="Main navigation"
        className={`fixed top-0 left-0 z-40 h-screen w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col border-r border-transparent dark:border-slate-800 overflow-y-auto
        transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 py-5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">FinanceFlow</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Primary">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 shrink-0">
          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-400 mb-1">Total Balance</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(stats.balance, settings.currency)}
            </p>
          </div>
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-semibold" aria-hidden="true">
              {settings.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{settings.name}</p>
              <p className="text-xs text-slate-400 truncate">{settings.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
