import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'
import SummaryCards from '../components/SummaryCards'
import BudgetCard from '../components/BudgetCard'
import ExpenseForm from '../components/ExpenseForm'

const thisMonth = () => new Date().toISOString().slice(0, 7)

export default function Dashboard() {
  const [month, setMonth] = useState(thisMonth())
  const [dashData, setDashData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, catRes] = await Promise.all([
        client.get(`/api/dashboard?month=${month}`),
        client.get(`/api/categories?month=${month}`),
      ])
      setDashData(dashRes.data)
      setCategories(catRes.data)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const formatCurrency = (v) =>
    `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your financial overview</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            className="input w-auto text-sm"
            value={month}
            onChange={e => setMonth(e.target.value)}
          />
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            ➕ Add Expense
          </button>
        </div>
      </div>

      {/* Budget Alert Banners */}
      {dashData?.budget_alerts?.map((alert, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-slide-up ${
            alert.level === 'danger'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
          }`}
        >
          <span>{alert.level === 'danger' ? '🚨' : '⚠️'}</span>
          <div>
            <strong>{alert.category}</strong>: spent {formatCurrency(alert.spent)} of {formatCurrency(alert.budget)} budget ({alert.percent}%)
            {alert.level === 'danger' && ' — Budget exceeded!'}
          </div>
          <span
            className="w-2 h-2 rounded-full ml-auto"
            style={{ background: alert.color }}
          />
        </div>
      ))}

      {/* Summary Cards */}
      <SummaryCards data={dashData} loading={loading} />

      {/* Category Budgets + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetCard categories={categories} loading={loading} />

        {/* Recent Expenses */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🕐</span> Recent Expenses
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !dashData || dashData.recent_expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">{!dashData ? 'Could not load data. Is the backend running?' : 'No expenses yet. Add one!'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dashData.recent_expenses.map(exp => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-10 rounded-full flex-shrink-0"
                      style={{ background: exp.category_color || '#6366f1' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                        {exp.description}
                      </p>
                      <p className="text-xs text-gray-400">{exp.date} · {exp.category_name || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Anomaly Notice */}
      {dashData?.anomaly_count > 0 && (
        <div className="card p-4 flex items-center gap-3 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <span className="text-xl">🔍</span>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            <strong>{dashData.anomaly_count} unusual expense(s)</strong> detected. Check the Analytics page for details.
          </p>
        </div>
      )}

      {showForm && (
        <ExpenseForm
          categories={categories}
          onSave={fetchData}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
