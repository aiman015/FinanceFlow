import { useRef, useState } from 'react'
import { Download, Upload, FileDown, DatabaseBackup, Wallet, Receipt, Target, Tags, ShieldCheck } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import { CURRENCIES } from '../utils/currency'
import { transactionsToCsv, downloadFile, parseTransactionsCsv } from '../utils/csv'
import { buildBackup, validateBackup } from '../utils/backup'
import { exportFinancialReportPdf } from '../utils/pdfReport'

export default function Settings() {
  const {
    settings, updateSettings,
    transactions, categories, budgets, goals,
    stats, getCategory, importTransactions, restoreBackup, clearAllData,
  } = useFinance()
  const { showToast } = useToast()
  const [form, setForm] = useState(settings)
  const [confirmClear, setConfirmClear] = useState(false)
  const [pendingBackup, setPendingBackup] = useState(null) // parsed backup awaiting confirmation
  const [busy, setBusy] = useState(null) // which action is currently in-flight, for loading states
  const importCsvRef = useRef(null)
  const restoreRef = useRef(null)

  const handleSave = (e) => {
    e.preventDefault()
    updateSettings(form)
  }

  const clearData = async () => {
    setBusy('clear')
    try {
      await clearAllData()
      showToast('All data cleared.', 'info')
    } catch {
      showToast('Could not clear all data. Some items may remain — try again.', 'error')
    } finally {
      setBusy(null)
      setConfirmClear(false)
    }
  }

  // --- Export -----------------------------------------------------------------

  const exportCsv = () => {
    if (transactions.length === 0) { showToast('No transactions to export', 'info'); return }
    try {
      downloadFile(transactionsToCsv(transactions), `transactions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
      showToast(`Exported ${transactions.length} transactions`, 'success')
    } catch {
      showToast('Export failed. Please try again.', 'error')
    }
  }

  const exportPdf = async () => {
    setBusy('pdf')
    try {
      await Promise.resolve(exportFinancialReportPdf({
        transactions, stats, getCategory, currency: settings.currency,
        rangeLabel: 'All time', userName: settings.name,
      }))
      showToast('PDF report downloaded', 'success')
    } catch {
      showToast('Could not generate the PDF report. Please try again.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const exportBackup = () => {
    try {
      const backup = buildBackup({ transactions, budgets, categories, settings, goals })
      downloadFile(JSON.stringify(backup, null, 2), `financeflow-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
      showToast('Backup downloaded', 'success')
    } catch {
      showToast('Could not create the backup file. Please try again.', 'error')
    }
  }

  // --- Import -----------------------------------------------------------------

  // File pickers (especially on mobile) let people choose the wrong thing —
  // a photo from the gallery, a Word doc, etc. Only text-based tabular
  // formats can actually contain transaction rows, so anything else is
  // rejected up front with a clear message rather than failing silently.
  const SUPPORTED_IMPORT_EXTENSIONS = ['csv', 'txt', 'tsv']

  const handleImportCsv = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    const looksTextLike = !file.type || file.type.startsWith('text/') || file.type === 'application/vnd.ms-excel'
    if (!SUPPORTED_IMPORT_EXTENSIONS.includes(ext) || !looksTextLike) {
      showToast(
        `"${file.name}" isn't a supported format. Import a .csv, .tsv, or .txt file with columns: title, amount, type, category, date.`,
        'error'
      )
      e.target.value = ''
      return
    }

    setBusy('csv')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = String(reader.result)
        // .tsv files use tabs instead of commas — normalize so the same
        // parser can handle both without duplicating logic.
        const text = ext === 'tsv' ? raw.replace(/\t/g, ',') : raw
        const { transactions: rows, errors } = parseTransactionsCsv(text, categories)
        if (rows.length > 0) importTransactions(rows)
        if (errors.length > 0) showToast(`${errors.length} row(s) skipped: ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? '…' : ''}`, 'error')
        else if (rows.length === 0) showToast('No valid rows found in file', 'error')
      } catch {
        showToast('That file could not be read. Make sure it is a plain CSV/TSV/TXT file.', 'error')
      } finally {
        setBusy(null)
      }
    }
    reader.onerror = () => { showToast('Could not read that file.', 'error'); setBusy(null) }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy('restore')
    const reader = new FileReader()
    reader.onload = () => {
      let parsed
      try {
        parsed = JSON.parse(String(reader.result))
      } catch {
        showToast('That file is not valid JSON', 'error')
        setBusy(null)
        return
      }
      const { valid, errors } = validateBackup(parsed)
      if (!valid) {
        showToast(errors[0] || 'Invalid backup file', 'error')
        setBusy(null)
        return
      }
      // Restoring overwrites current data — confirm before committing.
      setPendingBackup(parsed)
      setBusy(null)
    }
    reader.onerror = () => { showToast('Could not read that file.', 'error'); setBusy(null) }
    reader.readAsText(file)
    e.target.value = ''
  }

  const confirmRestore = () => {
    if (pendingBackup) restoreBackup(pendingBackup.data)
    setPendingBackup(null)
  }

  const inputClass = "w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-emerald-500"
  const labelClass = "text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block"
  const actionBtn = "flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm px-4 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"

  const completedGoals = goals.filter((g) => g.targetAmount > 0 && g.savedAmount >= g.targetAmount).length
  const activeBudgets = Object.values(budgets).filter((b) => b > 0).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,36rem)_1fr] gap-4 items-start animate-fade-in">
    <div className="space-y-4">
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">Profile</h2>
        <div>
          <label htmlFor="settings-name" className={labelClass}>Name</label>
          <input
            id="settings-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="settings-email" className={labelClass}>Email</label>
          <input
            id="settings-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="settings-currency" className={labelClass}>Currency</label>
          <select
            id="settings-currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Applies to every amount shown across the app.</p>
        </div>
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg">
          Save Changes
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Data Export & Import</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Export your data, bring in transactions from a file, or back up everything at once.</p>
        </div>

        <div>
          <p className={labelClass}>Export</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCsv} className={actionBtn}>
              <Download size={16} /> Transactions (CSV)
            </button>
            <button onClick={exportPdf} disabled={busy === 'pdf'} className={actionBtn}>
              {busy === 'pdf' ? <Spinner size={16} /> : <FileDown size={16} />}
              {busy === 'pdf' ? 'Generating…' : 'Financial Report (PDF)'}
            </button>
            <button onClick={exportBackup} className={actionBtn}>
              <DatabaseBackup size={16} /> Full Backup (JSON)
            </button>
          </div>
        </div>

        <div>
          <p className={labelClass}>Import</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => importCsvRef.current?.click()} disabled={busy === 'csv'} className={actionBtn}>
              {busy === 'csv' ? <Spinner size={16} /> : <Upload size={16} />}
              {busy === 'csv' ? 'Importing…' : 'Import Transactions (CSV/TSV/TXT)'}
            </button>
            <input
              ref={importCsvRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values"
              onChange={handleImportCsv}
              className="hidden"
              aria-label="Import transactions from a CSV, TSV, or TXT file"
            />

            <button onClick={() => restoreRef.current?.click()} disabled={busy === 'restore'} className={actionBtn}>
              {busy === 'restore' ? <Spinner size={16} /> : <Upload size={16} />}
              {busy === 'restore' ? 'Reading…' : 'Restore Backup (JSON)'}
            </button>
            <input ref={restoreRef} type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" aria-label="Restore backup JSON file" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Supports .csv, .tsv, and .txt files with columns: title, amount, type, category, date. The category column accepts a category name (e.g. "Food", "Shopping") — it doesn't need to be an internal ID. Other file types (images, Word docs, etc.) are rejected with a message rather than silently failing.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Danger Zone</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Permanently delete all transactions, budgets, and goals stored in your account. Your categories are kept so the app stays usable afterward.</p>
        <button
          onClick={() => setConfirmClear(true)}
          className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-semibold text-sm px-5 py-2.5 rounded-lg"
        >
          Clear All Data
        </button>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear All Data"
        message="This will permanently delete all your transactions, budgets, and goals. Your categories will be kept. This cannot be undone."
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearData}
      />

      <ConfirmDialog
        open={!!pendingBackup}
        title="Restore Backup"
        message="Restoring this backup will overwrite your current transactions, budgets, categories, settings, and goals with the contents of this file. This cannot be undone."
        onCancel={() => setPendingBackup(null)}
        onConfirm={confirmRestore}
        confirmLabel="Restore"
        danger={false}
      />
    </div>

    <aside className="space-y-4 lg:sticky lg:top-20">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-900 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Wallet size={18} />
          </span>
          <div>
            <p className="font-bold leading-tight">Account Overview</p>
            <p className="text-xs text-emerald-100">A quick snapshot of your data</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1"><Receipt size={13} /> Transactions</div>
            <p className="text-xl font-bold">{transactions.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1"><Tags size={13} /> Categories</div>
            <p className="text-xl font-bold">{categories.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1"><Target size={13} /> Goals hit</div>
            <p className="text-xl font-bold">{completedGoals}/{goals.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1"><ShieldCheck size={13} /> Budgets set</div>
            <p className="text-xl font-bold">{activeBudgets}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Tips</h2>
        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            Set a budget for each category on the Budgets page to get near-limit and over-budget alerts in the bell icon above.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            Back up regularly with Full Backup (JSON) — it captures transactions, budgets, categories, and goals in one file.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            Click your avatar in the top bar any time to jump straight back to this profile form.
          </li>
        </ul>
      </div>
    </aside>
    </div>
  )
}
