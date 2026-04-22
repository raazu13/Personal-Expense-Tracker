export default function BudgetCard({ categories, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-3 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1.5" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  const withBudget = (categories || []).filter(c => c.monthly_budget > 0)

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>📊</span> Category Budgets
      </h3>
      {withBudget.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-sm">Set category budgets in Settings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withBudget.map(cat => {
            const pct = Math.min((cat.spent / cat.monthly_budget) * 100, 100)
            const barColor =
              pct >= 100 ? '#ef4444' :
              pct >= 80  ? '#f97316' :
              cat.color || '#6366f1'
            const textColor =
              pct >= 100 ? 'text-red-500' :
              pct >= 80  ? 'text-orange-500' :
              'text-gray-500 dark:text-gray-400'

            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold ${textColor}`}>
                      {pct.toFixed(0)}%
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ₹{cat.spent.toLocaleString('en-IN', { minimumFractionDigits: 0 })} / ₹{cat.monthly_budget.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
