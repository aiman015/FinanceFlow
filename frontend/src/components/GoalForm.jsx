import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { MAX_AMOUNT } from '../utils/validation'
import { formatCurrency } from '../utils/currency'

const emptyForm = { name: '', targetAmount: '', savedAmount: '', deadline: '' }

export default function GoalForm({ initialValues, onSubmit, submitLabel = 'Create Goal' }) {
  const { settings } = useFinance()
  const [form, setForm] = useState(
    initialValues
      ? { ...emptyForm, ...initialValues, targetAmount: String(initialValues.targetAmount ?? ''), savedAmount: String(initialValues.savedAmount ?? '') }
      : emptyForm
  )
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'Name is required'
    } else if (form.name.trim().length > 80) {
      errs.name = 'Name is too long (max 80 characters)'
    }

    const target = Number(form.targetAmount)
    if (form.targetAmount === '' || Number.isNaN(target)) {
      errs.targetAmount = 'Enter a valid target amount'
    } else if (target <= 0) {
      errs.targetAmount = 'Target amount must be greater than zero'
    } else if (target > MAX_AMOUNT) {
      errs.targetAmount = `Amount can't exceed ${formatCurrency(MAX_AMOUNT, settings.currency)}`
    }

    if (form.savedAmount !== '') {
      const saved = Number(form.savedAmount)
      if (Number.isNaN(saved) || saved < 0) errs.savedAmount = 'Cannot be negative'
      else if (saved > MAX_AMOUNT) errs.savedAmount = `Amount can't exceed ${formatCurrency(MAX_AMOUNT, settings.currency)}`
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      savedAmount: Number(form.savedAmount) || 0,
      deadline: form.deadline || null,
    })
    if (!initialValues) setForm(emptyForm)
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      errors[field] ? 'border-red-400 focus:border-red-500 dark:border-red-500 dark:bg-slate-800' : 'border-slate-200 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="goal-name" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Goal Name</label>
        <input
          id="goal-name"
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Emergency Fund"
          className={inputClass('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'goal-name-error' : undefined}
        />
        {errors.name && <p id="goal-name-error" role="alert" className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="goal-target" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Target Amount</label>
          <input
            id="goal-target"
            type="number"
            step="0.01"
            min="0.01"
            max={MAX_AMOUNT}
            value={form.targetAmount}
            onChange={(e) => handleChange('targetAmount', e.target.value)}
            placeholder="0.00"
            className={inputClass('targetAmount')}
            aria-invalid={!!errors.targetAmount}
            aria-describedby={errors.targetAmount ? 'goal-target-error' : undefined}
          />
          {errors.targetAmount && <p id="goal-target-error" role="alert" className="text-xs text-red-500 mt-1">{errors.targetAmount}</p>}
        </div>
        <div>
          <label htmlFor="goal-saved" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Already Saved</label>
          <input
            id="goal-saved"
            type="number"
            step="0.01"
            min="0"
            max={MAX_AMOUNT}
            value={form.savedAmount}
            onChange={(e) => handleChange('savedAmount', e.target.value)}
            placeholder="0.00"
            className={inputClass('savedAmount')}
            aria-invalid={!!errors.savedAmount}
            aria-describedby={errors.savedAmount ? 'goal-saved-error' : undefined}
          />
          {errors.savedAmount && <p id="goal-saved-error" role="alert" className="text-xs text-red-500 mt-1">{errors.savedAmount}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="goal-deadline" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Target Date (optional)</label>
        <input
          id="goal-deadline"
          type="date"
          value={form.deadline || ''}
          onChange={(e) => handleChange('deadline', e.target.value)}
          className={inputClass('deadline')}
        />
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
