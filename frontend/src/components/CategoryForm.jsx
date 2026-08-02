import { useState } from 'react'
import { ICON_CHOICES, CATEGORY_COLOR_CHOICES } from '../data/categories'
import { getCategoryIcon } from './categoryIcons'

const emptyForm = { name: '', type: 'expense', color: CATEGORY_COLOR_CHOICES[0], icon: ICON_CHOICES[0] }

export default function CategoryForm({ initialValues, onSubmit, submitLabel = 'Create Category' }) {
  const [form, setForm] = useState(initialValues || emptyForm)
  const [error, setError] = useState('')

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = form.name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }
    if (trimmed.length > 40) {
      setError('Name is too long (max 40 characters)')
      return
    }
    setError('')
    const ok = onSubmit({ ...form, name: trimmed })
    if (ok !== false && !initialValues) setForm(emptyForm)
  }

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cat-name" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Name</label>
        <input
          id="cat-name"
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Groceries"
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? 'cat-name-error' : undefined}
        />
        {error && <p id="cat-name-error" role="alert" className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div>
        <label htmlFor="cat-type" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Type</label>
        <select id="cat-type" value={form.type} onChange={(e) => handleChange('type', e.target.value)} className={inputClass}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLOR_CHOICES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleChange('color', color)}
              className={`w-7 h-7 rounded-full transition-transform ${form.color === color ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900 dark:ring-slate-100 scale-105' : ''}`}
              style={{ background: color }}
              aria-label={color}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Icon</label>
        <div className="grid grid-cols-8 gap-2 max-h-36 overflow-y-auto pr-1">
          {ICON_CHOICES.map((iconName) => {
            const Icon = getCategoryIcon(iconName)
            const active = form.icon === iconName
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => handleChange('icon', iconName)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-400'
                }`}
                title={iconName}
              >
                <Icon size={16} />
              </button>
            )
          })}
        </div>
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
