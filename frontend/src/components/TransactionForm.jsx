import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { MAX_AMOUNT, isValidAmount, isValidPastOrPresentDate, todayStr } from '../utils/validation'
import { formatCurrency } from '../utils/currency'

const emptyForm = { title: '', amount: '', type: 'expense', category: '', date: todayStr() }

export default function TransactionForm({ initialValues, onSubmit, submitLabel = 'Add Transaction' }) {
  const { categories, settings } = useFinance()
  const [form, setForm] = useState(initialValues || emptyForm)
  const [errors, setErrors] = useState({})

  const availableCategories = categories.filter((c) => c.type === form.type)

  const validate = () => {
    const errs = {}

    if (!form.title.trim()) {
      errs.title = 'Title is required'
    } else if (form.title.trim().length > 80) {
      errs.title = 'Title is too long (max 80 characters)'
    }

    if (!isValidAmount(form.amount)) {
      if (form.amount === '' || form.amount === null) errs.amount = 'Amount is required'
      else if (Number(form.amount) <= 0) errs.amount = 'Amount must be greater than zero'
      else if (Number(form.amount) > MAX_AMOUNT) errs.amount = `Amount can't exceed ${formatCurrency(MAX_AMOUNT, settings.currency)}`
      else errs.amount = 'Enter a valid amount'
    }

    if (!form.category) errs.category = 'Select a category'

    if (!form.date) {
      errs.date = 'Date is required'
    } else if (!isValidPastOrPresentDate(form.date)) {
      errs.date = "Date can't be in the future"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'type') next.category = ''
      return next
    })
    // Clear the field's error as soon as the person starts fixing it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
    if (!initialValues) setForm(emptyForm)
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      errors[field] ? 'border-red-400 focus:border-red-500 dark:border-red-500 dark:bg-slate-800' : 'border-slate-200 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tx-title" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Title</label>
          <input
            id="tx-title"
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter title"
            className={inputClass('title')}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'tx-title-error' : undefined}
          />
          {errors.title && <p id="tx-title-error" role="alert" className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="tx-amount" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Amount</label>
          <input
            id="tx-amount"
            type="number"
            step="0.01"
            min="0.01"
            max={MAX_AMOUNT}
            value={form.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="Enter amount"
            className={inputClass('amount')}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'tx-amount-error' : undefined}
          />
          {errors.amount && <p id="tx-amount-error" role="alert" className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tx-type" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Type</label>
          <select
            id="tx-type"
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className={inputClass('type')}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label htmlFor="tx-category" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Category</label>
          <select
            id="tx-category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className={inputClass('category')}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'tx-category-error' : undefined}
          >
            <option value="">Select category</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category && <p id="tx-category-error" role="alert" className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="tx-date" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Date</label>
        <input
          id="tx-date"
          type="date"
          max={todayStr()}
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className={inputClass('date')}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'tx-date-error' : undefined}
        />
        {errors.date && <p id="tx-date-error" role="alert" className="text-xs text-red-500 mt-1">{errors.date}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  )
}
