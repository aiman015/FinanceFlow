import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const clampedPage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1
  const end = Math.min(clampedPage * pageSize, total)

  if (total === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Showing {start}-{end} of {total}</span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <label className="flex items-center gap-1.5">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-1.5 py-1 text-xs outline-none focus:border-emerald-500"
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(clampedPage - 1)}
          disabled={clampedPage <= 1}
          aria-label="Previous page"
          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2">
          Page {clampedPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(clampedPage + 1)}
          disabled={clampedPage >= totalPages}
          aria-label="Next page"
          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
