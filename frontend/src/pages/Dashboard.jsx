import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank } from 'lucide-react'
import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import SummaryCard from '../components/SummaryCard'
import IncomeExpenseChart from '../components/IncomeExpenseChart'
import CategoryPieChart from '../components/CategoryPieChart'
import TransactionTable from '../components/TransactionTable'
import TransactionForm from '../components/TransactionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import { formatCurrency } from '../utils/currency'

export default function Dashboard() {
  const { stats, transactions, addTransaction, updateTransaction, deleteTransaction, settings } = useFinance()
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard icon={ArrowDownCircle} label="Total Income" value={formatCurrency(stats.income, settings.currency)} change="12% from last month" changeUp iconBg="bg-emerald-500" />
        <SummaryCard icon={ArrowUpCircle} label="Total Expenses" value={formatCurrency(stats.expenses, settings.currency)} change="8% from last month" changeUp={false} iconBg="bg-red-500" />
        <SummaryCard icon={Wallet} label="Current Balance" value={formatCurrency(stats.balance, settings.currency)} change="18% from last month" changeUp iconBg="bg-blue-500" />
        <SummaryCard icon={PiggyBank} label="Total Savings" value={formatCurrency(Math.max(stats.balance - stats.expenses, 0), settings.currency)} change="10% from last month" changeUp iconBg="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Income vs Expenses</h2>
          <IncomeExpenseChart />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Expenses by Category</h2>
          <CategoryPieChart />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Transactions</h2>
          <TransactionTable
            transactions={recent}
            onEdit={setEditing}
            onDelete={setDeletingId}
            compact
          />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Add Transaction</h2>
          <TransactionForm onSubmit={addTransaction} />
        </div>
      </div>

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
