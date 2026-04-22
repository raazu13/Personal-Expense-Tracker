import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'
import ChartPanel from '../components/ChartPanel'
import { useTheme } from '../context/ThemeContext'

const thisMonth = () => new Date().toISOString().slice(0, 7)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Analytics() {
  const { theme } = useTheme()
  const [tab, setTab] = useState('monthly')
  const [month, setMonth] = useState(thisMonth())
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [loadingPred, setLoadingPred] = useState(true)
  const [loadingAnom, setLoadingAnom] = useState(true)
  const [chartKey, setChartKey] = useState(0)

  const refreshCharts = () => setChartKey(k => k + 1)

  useEffect(() => {
    client.get('/api/categories').then(r => {
      setCategories(r.data)
      if (r.data.length > 0 && !selectedCat) setSelectedCat(String(r.data[0].id))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoadingPred(true)
    client.get(`/api/predict?month=${month}`)
      .then(r => setPrediction(r.data))
      .catch(() => setPrediction(null))
      .finally(() => setLoadingPred(false))
    setLoadingAnom(true)
    client.get('/api/anomalies')
      .then(r => setAnomalies(r.data))
      .catch(() => setAnomalies([]))
      .finally(() => setLoadingAnom(false))
  }, [month])

  const chartUrl = {
    monthly: `${BASE}/api/charts/monthly`,
    category: `${BASE}/api/charts/category?month=${month}`,
    trend: selectedCat ? `${BASE}/api/charts/trend?category_id=${selectedCat}` : null,
  }[tab]

  const tabs = [
    { key: 'monthly', label: '📊 Monthly Trend' },
    { key: 'category', label: '🥧 Category Breakdown' },
    { key: 'trend', label: '📈 Category Detail' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Insights into your spending</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" className="input text-sm w-auto" value={month} onChange={e => setMonth(e.target.value)} />
          <button onClick={refreshCharts} className="btn-secondary text-sm">🔄 Refresh</button>
        </div>
      </div>

      {/* Prediction Card */}
      <div className="card p-5 border-l-4 border-primary-500">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔮</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Spend Prediction</h3>
            {loadingPred ? (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64" />
            ) : prediction ? (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{prediction.message}</p>
                <div className="flex gap-6 mt-2">
                  <div>
                    <span className="text-xs text-gray-400">Current</span>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                      ₹{Number(prediction.current).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Projected End-of-Month</span>
                    <p className="font-bold text-lg text-primary-600 dark:text-primary-400">
                      ₹{Number(prediction.predicted).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Days Left</span>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{prediction.days_left}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No prediction data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Trend category selector */}
          {tab === 'trend' && categories.length > 0 && (
            <select
              className="input text-sm w-auto ml-auto"
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        <ChartPanel key={`${tab}-${chartKey}-${theme}-${month}-${selectedCat}`} url={chartUrl} height={440} />
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>🔍</span> Unusual Expenses ({anomalies.length})
          </h3>
          <div className="space-y-2">
            {anomalies.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/15 rounded-xl border border-amber-100 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.description}</p>
                    <p className="text-xs text-gray-400">{a.date} · {a.category_name}</p>
                  </div>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  ₹{Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
