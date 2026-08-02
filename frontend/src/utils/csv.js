// CSV export/import helpers for transactions.
// Keep the column order stable so exported files can be re-imported.
const CSV_COLUMNS = ['title', 'amount', 'type', 'category', 'date']

function escapeCell(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function transactionsToCsv(transactions) {
  const header = CSV_COLUMNS.join(',')
  const rows = transactions.map((t) => CSV_COLUMNS.map((col) => escapeCell(t[col])).join(','))
  return [header, ...rows].join('\n')
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Minimal CSV line parser that supports quoted fields containing commas/newlines.
function parseCsvLines(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field); field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      rows.push(row); row = []
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/**
 * Parse a CSV file's text content into transaction-shaped objects.
 * Expects a header row containing at least: title, amount, type, category, date.
 * Returns { transactions, errors } where errors are human-readable per-row problems.
 */
export function parseTransactionsCsv(text, categories) {
  const rows = parseCsvLines(text.trim())
  if (rows.length === 0) return { transactions: [], errors: ['The file is empty.'] }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const required = ['title', 'amount', 'type', 'category', 'date']
  const missing = required.filter((col) => !header.includes(col))
  if (missing.length > 0) {
    return { transactions: [], errors: [`Missing required column(s): ${missing.join(', ')}`] }
  }

  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const categoryList = categories || []
  const categoryIds = new Set(categoryList.map((c) => c.id))
  // Accept category by exact id (what export produces) OR by name (what a
  // human typing/editing a CSV by hand will naturally write, e.g. "Food" or
  // "shopping"). Matching by name is keyed on type too, since income and
  // expense categories can share a name.
  const categoryByName = new Map(
    categoryList.map((c) => [`${c.type}:${c.name.trim().toLowerCase()}`, c.id])
  )
  const transactions = []
  const errors = []

  if (categoryList.length === 0) {
    return { transactions: [], errors: ['Your account has no categories yet. Go to the Categories page and add at least one (or click "Restore Default Categories" there), then try importing again.'] }
  }

  rows.slice(1).forEach((cells, i) => {
    const lineNo = i + 2
    const title = (cells[idx.title] || '').trim()
    const amount = Number(cells[idx.amount])
    const type = (cells[idx.type] || '').trim().toLowerCase()
    const rawCategory = (cells[idx.category] || '').trim()
    const date = (cells[idx.date] || '').trim()

    if (!title) { errors.push(`Row ${lineNo}: missing title`); return }
    if (!amount || amount <= 0 || Number.isNaN(amount)) { errors.push(`Row ${lineNo}: invalid amount`); return }
    if (type !== 'income' && type !== 'expense') { errors.push(`Row ${lineNo}: type must be "income" or "expense"`); return }
    if (!date || Number.isNaN(new Date(date).getTime())) { errors.push(`Row ${lineNo}: invalid date`); return }

    const category = categoryIds.has(rawCategory)
      ? rawCategory
      : categoryByName.get(`${type}:${rawCategory.toLowerCase()}`)
    if (!category) { errors.push(`Row ${lineNo}: unknown category "${rawCategory}"`); return }

    transactions.push({ title, amount, type, category, date })
  })

  return { transactions, errors }
}
