import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './currency'

/**
 * Generate and download a PDF financial report.
 * @param {object} opts
 * @param {Array} opts.transactions - transactions to include (already filtered/sorted by caller)
 * @param {object} opts.stats - { income, expenses, balance }
 * @param {function} opts.getCategory - (id) => category
 * @param {string} opts.currency - currency code
 * @param {string} [opts.rangeLabel] - human-readable label for the period covered
 * @param {string} [opts.userName]
 */
export function exportFinancialReportPdf({ transactions, stats, getCategory, currency, rangeLabel, userName }) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.setTextColor(16, 185, 129)
  doc.text('FinanceFlow — Financial Report', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(100)
  const generatedLine = `Generated ${new Date().toLocaleDateString()}${userName ? ` for ${userName}` : ''}`
  doc.text(generatedLine, 14, 25)
  if (rangeLabel) doc.text(`Period: ${rangeLabel}`, 14, 30)

  const summaryY = rangeLabel ? 38 : 33
  doc.setFontSize(11)
  doc.setTextColor(30)
  const summary = [
    ['Total Income', formatCurrency(stats.income, currency)],
    ['Total Expenses', formatCurrency(stats.expenses, currency)],
    ['Net Balance', formatCurrency(stats.balance, currency)],
  ]
  autoTable(doc, {
    startY: summaryY,
    head: [['Summary', 'Amount']],
    body: summary,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 10 },
    tableWidth: pageWidth - 28,
  })

  const txRows = transactions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.title,
      getCategory(t.category)?.name || t.category,
      t.type === 'income' ? 'Income' : 'Expense',
      `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}`,
    ])

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Date', 'Title', 'Category', 'Type', 'Amount']],
    body: txRows.length ? txRows : [['—', 'No transactions in this period', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9 },
    tableWidth: pageWidth - 28,
  })

  doc.save(`financeflow-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}
