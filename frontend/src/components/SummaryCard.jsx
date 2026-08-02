export default function SummaryCard({ icon: Icon, label, value, change, changeUp, iconBg }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">{value}</p>
        {change && (
          <p className={`text-xs mt-1 font-medium ${changeUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {changeUp ? '↑' : '↓'} {change}
          </p>
        )}
      </div>
    </div>
  )
}
