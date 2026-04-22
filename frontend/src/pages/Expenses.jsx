import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'
import ExpenseTable from '../components/ExpenseTable'
import ExpenseForm from '../components/ExpenseForm'

const thisMonth = () => new Date().toISOString().slice(0, 7)

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)

  // Filters
  const [month, setMonth] = useState(thisMonth())
  const [category, setCategory] = useState('')
  const [payment, setPayment] = useState('')
  const [search, setSearch] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (month) params.set('month', month)
      if (category) params.set('category', category)
      if (payment) params.set('payment_method', payment)
      if (search) params.set('search', search)
      const [expRes, catRes] = await Promise.all([
        client.get(`/api/expenses?${params}`),
        client.get('/api/categories'),
      ])
      setExpenses(expRes.data)
      setCategories(catRes.data)
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [month, category, payment, search])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await client.delete(`/api/expenses/${id}`)
      toast.success('Expense deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleEdit = (exp) => { setEditExpense(exp); setShowForm(true) }

  const handleExportCsv = () => {
    const params = new URLSearchParams()
    if (month) params.set('month', month)
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    window.open(`${baseUrl}/api/expenses/export?${params}`, '_blank')
  }

  const totalShowing = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {expenses.length} records · Total: ₹{totalShowing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCsv} className="btn-secondary text-sm flex items-center gap-1">
            ⬇️ Export CSV
          </button>
          <button onClick={() => { setEditExpense(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            ➕ Add Expense
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label text-xs">Month</label>
            <input type="month" className="input text-sm" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Category</label>
            <select className="input text-sm" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Payment</label>
            <select className="input text-sm" value={payment} onChange={e => setPayment(e.target.value)}>
              <option value="">All</option>
              {['Cash', 'UPI', 'Card', 'Net Banking', 'Recurring'].map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Search</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="Search description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <ExpenseTable
        expenses={expenses}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {showForm && (
        <ExpenseForm
          expense={editExpense}
          categories={categories}
          onSave={fetchAll}
          onClose={() => { setShowForm(false); setEditExpense(null) }}
        />
      )}
    </div>
  )
}
