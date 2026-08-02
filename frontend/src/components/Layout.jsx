import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useFinance } from '../context/FinanceContext'

const PAGE_META = {
  '/transactions': { title: 'Transactions', subtitle: 'Manage your income and expenses.' },
  '/analytics': { title: 'Analytics', subtitle: 'Understand your financial trends.' },
  '/categories': { title: 'Categories', subtitle: 'Organize transactions by category.' },
  '/budgets': { title: 'Budgets', subtitle: 'Set monthly limits for each category.' },
  '/goals': { title: 'Savings Goals', subtitle: 'Set targets and track your progress.' },
  '/settings': { title: 'Settings', subtitle: 'Manage your profile and preferences.' },
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { settings } = useFinance()
  const firstName = settings.name?.split(' ')?.[0] || 'there'
  const defaultMeta = { title: `Good to see you, ${firstName}! 👋`, subtitle: 'Here is your finance summary.' }
  const meta = PAGE_META[location.pathname] || (location.pathname === '/' ? defaultMeta : { title: 'FinanceFlow' })

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* lg:ml-64 offsets the content by the fixed sidebar's width (w-64) so
          the sidebar never moves while this column scrolls on its own. */}
      <div className="lg:ml-64 min-w-0 flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={meta.title} subtitle={meta.subtitle} />
        <main id="main-content" className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
