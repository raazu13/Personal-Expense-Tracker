import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'
import CategoryForm from '../components/CategoryForm'

const thisMonth = () => new Date().toISOString().slice(0, 7)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Settings() {
  const [categories, setCategories] = useState([])
  const [recurring, setRecurring] = useState([])
  const [budget, setBudget] = useState({ total_limit: '' })
  const [month, setMonth] = useState(thisMonth())
  const [showCatForm, setShowCatForm] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [showRecForm, setShowRecForm] = useState(false)
  const [recForm, setRecForm] = useState({ description: '', amount: '', category_id: '', day_of_month: 1 })
  const [reportMonth, setReportMonth] = useState(thisMonth())
  const [clearConfirm, setClearConfirm] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [catRes, recRes, budRes] = await Promise.all([
        client.get('/api/categories'),
        client.get('/api/recurring'),
        client.get(`/api/budgets?month=${month}`),
      ])
      setCategories(catRes.data)
      setRecurring(recRes.data)
      setBudget({ total_limit: budRes.data.total_limit || '' })
    } catch {
      toast.error('Failed to load settings')
    }
  }, [month])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete this category?')) return
    await client.delete(`/api/categories/${id}`)
    toast.success('Category deleted')
    fetchAll()
  }

  const handleSaveBudget = async (e) => {
    e.preventDefault()
    await client.post('/api/budgets', { month, total_limit: Number(budget.total_limit) })
    toast.success('Monthly budget saved!')
  }

  const handleDeleteRecurring = async (id) => {
    await client.delete(`/api/recurring/${id}`)
    toast.success('Recurring rule deleted')
    fetchAll()
  }

  const handleToggleRecurring = async (rec) => {
    await client.put(`/api/recurring/${rec.id}`, { ...rec, active: rec.active ? 0 : 1 })
    fetchAll()
  }

  const handleAddRecurring = async (e) => {
    e.preventDefault()
    if (!recForm.amount || !recForm.description) { toast.error('Fill in all fields'); return }
    await client.post('/api/recurring', recForm)
    toast.success('Recurring rule added!')
    setRecForm({ description: '', amount: '', category_id: '', day_of_month: 1 })
    setShowRecForm(false)
    fetchAll()
  }

  const handleDownloadPdf = () => {
    window.open(`${BASE}/api/report?month=${reportMonth}`, '_blank')
  }

  const handleExportAll = () => {
    window.open(`${BASE}/api/expenses/export`, '_blank')
  }

  const handleClearAll = async () => {
    // Calling delete for all expenses via filter — no filter means all
    await Promise.all(
      (await client.get('/api/expenses')).data.map(e => client.delete(`/api/expenses/${e.id}`))
    )
    toast.success('All expenses cleared')
    setClearConfirm(false)
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage categories, budgets, and recurring expenses</p>
      </div>

      {/* Monthly Budget */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg flex items-center gap-2">
          🎯 Monthly Budget
        </h2>
        <form onSubmit={handleSaveBudget} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Month</label>
            <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="label">Total Limit (₹)</label>
            <input
              type="number" min="0" step="0.01" className="input"
              placeholder="e.g. 30000"
              value={budget.total_limit}
              onChange={e => setBudget({ total_limit: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap">Save Budget</button>
        </form>
      </div>

      {/* Categories */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            🏷️ Categories
          </h2>
          <button onClick={() => { setEditCat(null); setShowCatForm(true) }} className="btn-primary text-sm px-3 py-1.5">
            + Add Category
          </button>
        </div>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</p>
                  <p className="text-xs text-gray-400">
                    Budget: {cat.monthly_budget > 0 ? `₹${cat.monthly_budget.toLocaleString('en-IN')}` : 'None'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditCat(cat); setShowCatForm(true) }} className="btn-secondary px-2.5 py-1 text-xs">✏️</button>
                <button onClick={() => handleDeleteCat(cat.id)} className="btn-danger px-2.5 py-1 text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring Expenses */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            🔁 Recurring Expenses
          </h2>
          <button onClick={() => setShowRecForm(s => !s)} className="btn-primary text-sm px-3 py-1.5">
            + Add Rule
          </button>
        </div>

        {/* Add recurring form */}
        {showRecForm && (
          <form onSubmit={handleAddRecurring} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="label text-xs">Description</label>
              <input type="text" className="input text-sm" placeholder="e.g. Netflix" value={recForm.description}
                onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div>
              <label className="label text-xs">Amount (₹)</label>
              <input type="number" min="0.01" step="0.01" className="input text-sm" placeholder="0.00" value={recForm.amount}
                onChange={e => setRecForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label text-xs">Category</label>
              <select className="input text-sm" value={recForm.category_id} onChange={e => setRecForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Day of Month</label>
              <input type="number" min="1" max="31" className="input text-sm" value={recForm.day_of_month}
                onChange={e => setRecForm(f => ({ ...f, day_of_month: e.target.value }))} />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="button" onClick={() => setShowRecForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" className="btn-primary flex-1 text-sm">Save Rule</button>
            </div>
          </form>
        )}

        {recurring.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-sm">No recurring rules. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {recurring.map(rec => (
              <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-5 rounded-full ${rec.active ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{rec.description}</p>
                    <p className="text-xs text-gray-400">
                      ₹{rec.amount} on day {rec.day_of_month} · {rec.category_name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleToggleRecurring(rec)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      rec.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                    }`}
                  >
                    {rec.active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => handleDeleteRecurring(rec.id)} className="btn-danger opacity-0 group-hover:opacity-100 px-2.5 py-1 text-xs transition-opacity">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export / Reports */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          📥 Export & Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Monthly PDF Report</p>
            <div className="flex gap-2">
              <input type="month" className="input text-sm flex-1" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
              <button onClick={handleDownloadPdf} className="btn-primary text-sm whitespace-nowrap">⬇️ Download</button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">All Data as CSV</p>
            <button onClick={handleExportAll} className="btn-secondary w-full text-sm">⬇️ Export All CSV</button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-5 border border-red-200 dark:border-red-900">
        <h2 className="font-semibold text-red-600 dark:text-red-400 text-lg mb-3 flex items-center gap-2">
          ⚠️ Danger Zone
        </h2>
        {!clearConfirm ? (
          <button onClick={() => setClearConfirm(true)} className="btn-danger text-sm">
            🗑️ Clear All Expense Data
          </button>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-300 flex-1">
              This will permanently delete ALL expenses. Are you sure?
            </p>
            <button onClick={() => setClearConfirm(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleClearAll} className="btn-danger text-sm">Yes, Delete All</button>
          </div>
        )}
      </div>

      {showCatForm && (
        <CategoryForm
          category={editCat}
          onSave={fetchAll}
          onClose={() => { setShowCatForm(false); setEditCat(null) }}
        />
      )}
    </div>
  )
}
