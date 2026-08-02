import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, X, Download, Upload } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import TransactionTable from '../components/TransactionTable'
import TransactionForm from '../components/TransactionForm'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { getAvailableMonths, formatMonthLabel, filterTransactions } from '../utils/dateFilters'
import { transactionsToCsv, downloadFile, parseTransactionsCsv } from '../utils/csv'
import { useToast } from '../context/ToastContext'

export default function Transactions() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction, importTransactions } = useFinance()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [month, setMonth] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [importing, setImporting] = useState(false)

  const months = useMemo(() => getAvailableMonths(transactions), [transactions])

  const filtered = useMemo(() => {
    return filterTransactions(transactions, { query, typeFilter, categoryFilter, month, from, to })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, query, typeFilter, categoryFilter, month, from, to])

  // Reset to page 1 whenever the filters (or page size) change what's shown.
  useEffect(() => { setPage(1) }, [query, typeFilter, categoryFilter, month, from, to, pageSize])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const hasDateFilter = month !== 'all' || from || to
  const clearDateFilters = () => { setMonth('all'); setFrom(''); setTo('') }

  const handleExportCsv = () => {
    if (filtered.length === 0) { showToast('No transactions to export', 'info'); return }
    try {
      downloadFile(transactionsToCsv(filtered), `transactions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
      showToast(`Exported ${filtered.length} transaction${filtered.length === 1 ? '' : 's'}`, 'success')
    } catch {
      showToast('Export failed. Please try again.', 'error')
    }
  }

  const handleImportCsv = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const { transactions: rows, errors } = parseTransactionsCsv(String(reader.result), categories)
        if (rows.length > 0) importTransactions(rows)
        if (errors.length > 0) showToast(`${errors.length} row(s) skipped: ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? '…' : ''}`, 'error')
        else if (rows.length === 0) showToast('No valid rows found in file', 'error')
      } catch {
        showToast('That file could not be read as CSV.', 'error')
      } finally {
        setImporting(false)
      }
    }
    reader.onerror = () => { showToast('Could not read that file.', 'error'); setImporting(false) }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions..."
              aria-label="Search transactions"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500">
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className={`flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer ${importing ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {importing ? <Spinner size={15} /> : <Upload size={15} />} {importing ? 'Importing…' : 'Import'}
              <input type="file" accept=".csv" onChange={handleImportCsv} disabled={importing} className="hidden" aria-label="Import transactions CSV file" />
            </label>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold px-3 py-2 rounded-lg whitespace-nowrap"
            >
              <Download size={15} /> Export
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Month</label>
            <select
              value={month}
              onChange={(e) => { setMonth(e.target.value); if (e.target.value !== 'all') { setFrom(''); setTo('') } }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500"
            >
              <option value="all">All Months</option>
              {months.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); if (e.target.value) setMonth('all') }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); if (e.target.value) setMonth('all') }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-emerald-500"
            />
          </div>
          {hasDateFilter && (
            <button onClick={clearDateFilters} className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 mb-0.5">
              <X size={14} /> Clear dates
            </button>
          )}
        </div>

        <TransactionTable transactions={paged} onEdit={setEditing} onDelete={setDeletingId} />
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Transaction">
        <TransactionForm onSubmit={(vals) => { addTransaction(vals); setShowAdd(false) }} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Transaction">
        {editing && (
          <TransactionForm
            initialValues={editing}
            submitLabel="Save Changes"
            onSubmit={(vals) => { updateTransaction(editing.id, vals); setEditing(null) }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onCancel={() => setDeletingId(null)}
        onConfirm={() => { deleteTransaction(deletingId); setDeletingId(null) }}
      />
    </div>
  )
}
