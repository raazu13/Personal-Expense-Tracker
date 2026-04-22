export default function SummaryCards({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  const totalSpent = data?.total_spent ?? 0
  const budgetLimit = data?.budget_limit ?? 0
  const remaining = data?.remaining ?? 0
  const txCount = data?.tx_count ?? 0
  const biggest = data?.biggest_category

  const usedPct = budgetLimit > 0 ? Math.min((totalSpent / budgetLimit) * 100, 100) : 0
  const progressColor = usedPct >= 100 ? 'bg-red-500' : usedPct >= 80 ? 'bg-orange-400' : 'bg-primary-500'

  const cards = [
    {
      label: 'Total Spent',
      value: `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: '💸',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-500',
      sub: 'this month',
    },
    {
      label: 'Budget Remaining',
      value: budgetLimit > 0
        ? `₹${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : 'Not set',
      icon: '🎯',
      iconBg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-500',
      sub: budgetLimit > 0 ? (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{usedPct.toFixed(0)}% used</span>
            <span>₹{budgetLimit.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${progressColor}`} style={{ width: `${usedPct}%` }} />
          </div>
        </div>
      ) : 'Set in Settings',
    },
    {
      label: 'Biggest Category',
      value: biggest ? biggest.name : '—',
      icon: '🏆',
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-500',
      sub: biggest ? `₹${biggest.spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'No data yet',
      dot: biggest?.color,
    },
    {
      label: 'Transactions',
      value: txCount,
      icon: '🔢',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-500',
      sub: 'this month',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="card p-5 animate-fade-in hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
            <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center text-base`}>
              {card.dot && (
                <span className="w-3 h-3 rounded-full" style={{ background: card.dot }} />
              )}
              {!card.dot && card.icon}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
