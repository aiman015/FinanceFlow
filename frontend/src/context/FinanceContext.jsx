import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getCategoryFrom } from '../data/categories'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'
import { normalizeCurrencyCode, DEFAULT_CURRENCY_CODE } from '../utils/currency'
import { MAX_AMOUNT } from '../utils/validation'
import { fetchCategories, createCategoryApi, updateCategoryApi, deleteCategoryApi } from '../api/categories'
import {
  fetchAllTransactions,
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  restoreTransactionApi,
} from '../api/transactions'
import { fetchCurrentBudgets, createBudgetApi, updateBudgetApi, deleteBudgetApi } from '../api/budgets'
import { fetchGoals, createGoalApi, updateGoalApi, deleteGoalApi } from '../api/goals'
import Spinner from '../components/Spinner'

const FinanceContext = createContext(null)

const NEAR_LIMIT_THRESHOLD = 0.8 // warn once 80% of a budget is spent

// Clamp any amount that reaches the data layer, regardless of which form (or
// import/restore path) it came from — a last line of defense against
// negative or absurdly large numbers being sent to the API.
const clampAmount = (value, fallback = 0) => {
  const n = Number(value)
  if (Number.isNaN(n)) return fallback
  return Math.min(Math.max(n, 0), MAX_AMOUNT)
}

const isArray = (v) => Array.isArray(v)
const isBoolean = (v) => typeof v === 'boolean'

export function FinanceProvider({ children }) {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()

  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState({}) // { categoryId: monthlyLimit }
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  // Not modeled by the backend — these stay device-local, same as before.
  const [dismissedAlerts, setDismissedAlerts] = useLocalStorage('ff_dismissed_alerts', [], isArray)
  // Defaults to dark (matches the inline theme script in index.html, which
  // applies the same default before React mounts on every page, including
  // Login/Register — so the whole app starts dark instead of light).
  const [darkMode, setDarkMode] = useLocalStorage('ff_dark_mode', true, isBoolean)

  // Maps categoryId -> backend Budget document id, so updateBudget() knows
  // whether to POST (create) or PUT (update). Not exposed to consumers.
  const budgetDocIds = useRef({})
  const lastDeletedTx = useRef(null)

  // Load everything for the signed-in user. Re-runs on login/logout.
  useEffect(() => {
    if (!user) {
      setTransactions([])
      setCategories([])
      setBudgets({})
      budgetDocIds.current = {}
      setGoals([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([fetchCategories(), fetchAllTransactions(), fetchCurrentBudgets(), fetchGoals()])
      .then(([catList, txList, budgetList, goalList]) => {
        if (cancelled) return
        setCategories(catList)
        setTransactions(txList)
        const limitMap = {}
        const idMap = {}
        budgetList.forEach((b) => {
          limitMap[b.categoryId] = b.limit
          idMap[b.categoryId] = b.id
        })
        setBudgets(limitMap)
        budgetDocIds.current = idMap
        setGoals(goalList)
      })
      .catch((err) => {
        if (!cancelled) showToast(err.message || 'Could not load your data from the server', 'error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!darkMode)
  }, [darkMode])

  // --- Settings ----------------------------------------------------------
  // name/email/currency come from the authenticated user; darkMode is local.
  const settings = useMemo(
    () => ({
      name: user?.name || '',
      email: user?.email || '',
      currency: normalizeCurrencyCode(user?.currency) || DEFAULT_CURRENCY_CODE,
      darkMode,
    }),
    [user, darkMode]
  )

  const updateSettings = async (updates, options = {}) => {
    if (updates.darkMode !== undefined) setDarkMode(updates.darkMode)

    const profileUpdates = {}
    if (updates.name !== undefined) profileUpdates.name = updates.name
    if (updates.currency !== undefined) profileUpdates.currency = normalizeCurrencyCode(updates.currency)

    if (Object.keys(profileUpdates).length > 0) {
      try {
        await updateProfile(profileUpdates)
        if (!options.silent) showToast('Settings saved', 'success')
      } catch (err) {
        showToast(err.message || 'Could not save settings', 'error')
      }
    } else if (!options.silent) {
      showToast('Settings saved', 'success')
    }
  }

  // --- Transactions --------------------------------------------------------

  const addTransaction = async (tx) => {
    try {
      const created = await createTransactionApi({ ...tx, amount: clampAmount(tx.amount) })
      setTransactions((prev) => [created, ...prev])
      showToast('Transaction added', 'success')
    } catch (err) {
      showToast(err.message || 'Could not add transaction', 'error')
    }
  }

  const updateTransaction = async (id, updates) => {
    const existing = transactions.find((t) => t.id === id)
    if (!existing) return
    try {
      const merged = {
        ...existing,
        ...updates,
        amount: clampAmount(updates.amount ?? existing.amount, existing.amount),
      }
      const updated = await updateTransactionApi(id, merged)
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)))
      showToast('Transaction updated', 'success')
    } catch (err) {
      showToast(err.message || 'Could not update transaction', 'error')
    }
  }

  // Deleting keeps the removed transaction around just long enough to offer
  // an "Undo" action on the toast. Since the backend doesn't support
  // restoring a specific id, undo re-creates the transaction (it gets a new id).
  const deleteTransaction = async (id) => {
    const index = transactions.findIndex((t) => t.id === id)
    if (index === -1) return
    const removed = transactions[index]
    lastDeletedTx.current = { transaction: removed, index }
    setTransactions((prev) => prev.filter((t) => t.id !== id))

    try {
      await deleteTransactionApi(id)
      showToast('Transaction deleted', 'info', {
        action: { label: 'Undo', onClick: () => restoreTransaction(id) },
      })
    } catch (err) {
      setTransactions((prev) => {
        const next = [...prev]
        next.splice(index, 0, removed)
        return next
      })
      showToast(err.message || 'Could not delete transaction', 'error')
    }
  }

  const restoreTransaction = async (id) => {
    const record = lastDeletedTx.current
    if (!record || record.transaction.id !== id) return
    try {
      const restored = await restoreTransactionApi(record.transaction)
      setTransactions((prev) => {
        const next = [...prev]
        const insertAt = Math.min(record.index, next.length)
        next.splice(insertAt, 0, restored)
        return next
      })
      lastDeletedTx.current = null
      showToast('Transaction restored', 'success')
    } catch (err) {
      showToast(err.message || 'Could not restore transaction', 'error')
    }
  }

  // --- Budgets ---------------------------------------------------------------

  const updateBudget = async (categoryId, amount) => {
    const value = clampAmount(amount)
    // Apply immediately so the progress bar/limit reflects the change right
    // away — the request to persist it happens in the background. If that
    // request fails, the local value is left in place (rather than reverted)
    // and the user is warned it hasn't synced yet, so a slow/offline backend
    // never makes "Set budget" look like it silently did nothing.
    setBudgets((prev) => ({ ...prev, [categoryId]: value }))
    try {
      const existingId = budgetDocIds.current[categoryId]
      if (existingId) {
        await updateBudgetApi(existingId, value)
      } else {
        const created = await createBudgetApi(categoryId, value)
        budgetDocIds.current[categoryId] = created.id
      }
      showToast('Budget updated', 'success')
    } catch (err) {
      showToast(err.message ? `Saved locally — ${err.message}` : 'Saved locally, but could not sync to the server yet.', 'error')
    }
  }

  // --- Category management -------------------------------------------------

  const addCategory = (cat) => {
    const dupe = categories.some(
      (c) => c.name.trim().toLowerCase() === cat.name.trim().toLowerCase() && c.type === cat.type
    )
    if (dupe) {
      showToast('A category with that name already exists', 'error')
      return false
    }
    createCategoryApi(cat)
      .then((created) => {
        setCategories((prev) => [...prev, created])
        showToast('Category created', 'success')
      })
      .catch((err) => showToast(err.message || 'Could not create category', 'error'))
    return true
  }

  const updateCategory = (id, updates) => {
    updateCategoryApi(id, updates)
      .then((updated) => {
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
        showToast('Category updated', 'success')
      })
      .catch((err) => showToast(err.message || 'Could not update category', 'error'))
  }

  const deleteCategory = (id) => {
    const inUse = transactions.some((t) => t.category === id)
    if (inUse) {
      showToast('Cannot delete a category that has transactions. Reassign them first.', 'error')
      return false
    }
    deleteCategoryApi(id)
      .then(() => {
        setCategories((prev) => prev.filter((c) => c.id !== id))
        setBudgets((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        delete budgetDocIds.current[id]
        showToast('Category deleted', 'info')
      })
      .catch((err) => showToast(err.message || 'Could not delete category', 'error'))
    return true
  }

  const dismissAlert = (alertId) => {
    setDismissedAlerts((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]))
  }

  const clearDismissedAlerts = () => setDismissedAlerts([])

  // --- Savings goals ---------------------------------------------------------

  const addGoal = (goal) => {
    createGoalApi(goal)
      .then((created) => {
        setGoals((prev) => [created, ...prev])
        showToast('Savings goal created', 'success')
      })
      .catch((err) => showToast(err.message || 'Could not create goal', 'error'))
  }

  const updateGoal = (id, updates) => {
    const existing = goals.find((g) => g.id === id)
    if (!existing) return
    const merged = {
      ...existing,
      ...updates,
      targetAmount:
        updates.targetAmount !== undefined ? clampAmount(updates.targetAmount, existing.targetAmount) : existing.targetAmount,
      savedAmount:
        updates.savedAmount !== undefined ? clampAmount(updates.savedAmount, existing.savedAmount) : existing.savedAmount,
    }
    updateGoalApi(id, merged)
      .then((updated) => {
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)))
        showToast('Goal updated', 'success')
      })
      .catch((err) => showToast(err.message || 'Could not update goal', 'error'))
  }

  const contributeToGoal = (id, delta) => {
    const existing = goals.find((g) => g.id === id)
    if (!existing) return
    const nextSaved = clampAmount(existing.savedAmount + Number(delta), existing.savedAmount)
    updateGoalApi(id, { ...existing, savedAmount: nextSaved })
      .then((updated) => {
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)))
        showToast(delta >= 0 ? 'Progress updated' : 'Progress reduced', 'success')
      })
      .catch((err) => showToast(err.message || 'Could not update progress', 'error'))
  }

  const deleteGoal = (id) => {
    deleteGoalApi(id)
      .then(() => {
        setGoals((prev) => prev.filter((g) => g.id !== id))
        showToast('Goal deleted', 'info')
      })
      .catch((err) => showToast(err.message || 'Could not delete goal', 'error'))
  }

  // --- Import / backup --------------------------------------------------------

  const importTransactions = async (rows) => {
    try {
      const created = await Promise.all(
        rows.map((tx) => createTransactionApi({ ...tx, amount: clampAmount(tx.amount) }))
      )
      setTransactions((prev) => [...created, ...prev])
      showToast(`Imported ${created.length} transaction${created.length === 1 ? '' : 's'}`, 'success')
      return created.length
    } catch (err) {
      showToast(err.message || 'Import failed partway through — some rows may not have been saved.', 'error')
      return 0
    }
  }

  // Restoring a backup overwrites the matching sections of the signed-in
  // user's server-side data: existing records are deleted, then the backup's
  // records are recreated (they get new backend ids; a remap keeps
  // transactions/budgets pointed at the right recreated categories).
  const restoreBackup = async (data) => {
    try {
      let idRemap = {}

      if (Array.isArray(data.categories)) {
        await Promise.all(categories.map((c) => deleteCategoryApi(c.id).catch(() => {})))
        const created = await Promise.all(data.categories.map((c) => createCategoryApi(c)))
        idRemap = Object.fromEntries(data.categories.map((c, i) => [c.id, created[i].id]))
        setCategories(created)
      }

      if (Array.isArray(data.transactions)) {
        await Promise.all(transactions.map((t) => deleteTransactionApi(t.id).catch(() => {})))
        const created = await Promise.all(
          data.transactions.map((t) =>
            createTransactionApi({ ...t, category: idRemap[t.category] || t.category, amount: clampAmount(t.amount) })
          )
        )
        setTransactions(created)
      }

      if (data.budgets && typeof data.budgets === 'object') {
        await Promise.all(Object.values(budgetDocIds.current).map((id) => deleteBudgetApi(id).catch(() => {})))
        const entries = Object.entries(data.budgets)
        const created = await Promise.all(
          entries.map(([catId, amount]) => createBudgetApi(idRemap[catId] || catId, clampAmount(amount)))
        )
        const limitMap = {}
        const idMap = {}
        created.forEach((b) => {
          limitMap[b.categoryId] = b.limit
          idMap[b.categoryId] = b.id
        })
        setBudgets(limitMap)
        budgetDocIds.current = idMap
      }

      if (Array.isArray(data.goals)) {
        await Promise.all(goals.map((g) => deleteGoalApi(g.id).catch(() => {})))
        const created = await Promise.all(data.goals.map((g) => createGoalApi(g)))
        setGoals(created)
      }

      if (data.settings && typeof data.settings === 'object') {
        const profileUpdates = {}
        if (data.settings.name !== undefined) profileUpdates.name = data.settings.name
        if (data.settings.currency !== undefined) profileUpdates.currency = normalizeCurrencyCode(data.settings.currency)
        if (Object.keys(profileUpdates).length > 0) await updateProfile(profileUpdates)
        if (data.settings.darkMode !== undefined) setDarkMode(data.settings.darkMode)
      }

      showToast('Backup restored', 'success')
    } catch (err) {
      showToast(err.message || 'Could not fully restore the backup', 'error')
    }
  }

  // Permanently deletes every transaction, budget, category, and goal for
  // the signed-in user on the server (used by Settings → "Clear All Data").
  const clearAllData = async () => {
    // Deliberately does NOT delete categories. Categories are structural
    // (everything — budgets, imports, the transaction form — depends on at
    // least one existing) rather than "data" in the sense the Danger Zone
    // warns about, so clearing used to leave the account with zero
    // categories and no way to add anything back without visiting the
    // Categories page first.
    await Promise.all(transactions.map((t) => deleteTransactionApi(t.id).catch(() => {})))
    await Promise.all(Object.values(budgetDocIds.current).map((id) => deleteBudgetApi(id).catch(() => {})))
    await Promise.all(goals.map((g) => deleteGoalApi(g.id).catch(() => {})))
    setTransactions([])
    setBudgets({})
    budgetDocIds.current = {}
    setGoals([])
  }

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = income - expenses

    const byCategory = {}
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
      })

    const monthly = {}
    transactions.forEach((t) => {
      const month = t.date?.slice(0, 7)
      if (!month) return
      if (!monthly[month]) monthly[month] = { income: 0, expenses: 0 }
      monthly[month][t.type === 'income' ? 'income' : 'expenses'] += t.amount
    })
    const monthlyTrend = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    return { income, expenses, balance, byCategory, monthlyTrend }
  }, [transactions])

  // --- Notifications ---------------------------------------------------------
  // Derived, not stored: recomputed from live budgets/spend so the badge and
  // panel are always accurate, but a user can dismiss individual alerts.
  const notifications = useMemo(() => {
    const list = []
    categories
      .filter((c) => c.type === 'expense')
      .forEach((c) => {
        const budget = budgets[c.id] || 0
        if (!budget) return
        const spent = stats.byCategory[c.id] || 0
        const pct = spent / budget
        if (spent > budget) {
          list.push({
            id: `over-${c.id}`,
            level: 'error',
            title: `Over budget: ${c.name}`,
            message: `You've spent ${Math.round(pct * 100)}% of your ${c.name} budget.`,
            categoryId: c.id,
          })
        } else if (pct >= NEAR_LIMIT_THRESHOLD) {
          list.push({
            id: `near-${c.id}`,
            level: 'warning',
            title: `Approaching limit: ${c.name}`,
            message: `You've used ${Math.round(pct * 100)}% of your ${c.name} budget.`,
            categoryId: c.id,
          })
        }
      })
    if (stats.balance < 0) {
      list.push({
        id: 'negative-balance',
        level: 'error',
        title: 'Negative balance',
        message: 'Your expenses have exceeded your total income.',
      })
    }

    // Goal-related alerts: react live to progress, same as budget alerts do.
    goals.forEach((g) => {
      if (!g.targetAmount) return
      const pct = g.savedAmount / g.targetAmount
      if (pct >= 1) {
        list.push({
          id: `goal-complete-${g.id}`,
          level: 'warning',
          title: `Goal reached: ${g.name}`,
          message: `You've hit your savings target for "${g.name}". Nice work!`,
        })
      } else if (pct >= NEAR_LIMIT_THRESHOLD) {
        list.push({
          id: `goal-near-${g.id}`,
          level: 'warning',
          title: `Almost there: ${g.name}`,
          message: `You're ${Math.round(pct * 100)}% of the way to "${g.name}".`,
        })
      }
    })

    return list.filter((n) => !dismissedAlerts.includes(n.id))
  }, [categories, budgets, stats, goals, dismissedAlerts])

  const getCategory = (id) => getCategoryFrom(categories, id)

  const value = {
    loading,
    transactions, addTransaction, updateTransaction, deleteTransaction, restoreTransaction,
    categories, addCategory, updateCategory, deleteCategory, getCategory,
    budgets, updateBudget,
    settings, updateSettings,
    stats,
    notifications, dismissAlert, clearDismissedAlerts,
    goals, addGoal, updateGoal, contributeToGoal, deleteGoal,
    importTransactions, restoreBackup, clearAllData,
  }

  // Avoid flashing empty dashboards/tables while the initial fetch is in flight.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size={28} className="text-emerald-600" />
      </div>
    )
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
