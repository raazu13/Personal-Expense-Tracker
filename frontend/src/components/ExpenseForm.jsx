import { useState, useEffect } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net Banking']
const today = () => new Date().toISOString().split('T')[0]

export default function ExpenseForm({ expense, categories, onSave, onClose }) {
  const isEdit = !!expense?.id
  const [form, setForm] = useState({
    amount: expense?.amount ?? '',
    category_id: expense?.category_id ?? '',
    description: expense?.description ?? '',
    payment_method: expense?.payment_method ?? 'UPI',
    date: expense?.date ?? today(),
    note: expense?.note ?? '',
    is_recurring: expense?.is_recurring ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await client.put(`/api/expenses/${expense.id}`, form)
        toast.success('Expense updated!')
      } else {
        await client.post('/api/expenses', form)
        toast.success('Expense added!')
      }
      onSave()
      onClose()
    } catch {
      toast.error('Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? '✏️ Edit Expense' : '➕ Add Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-light transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="label">Amount (₹) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Lunch at café"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              required
            />
          </div>

          {/* Category + Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
              >
                <option value="">Uncategorized</option>
                {(categories || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={form.payment_method}
                onChange={e => set('payment_method', e.target.value)}
              >
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="label">Note (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Any extra details..."
              value={form.note}
              onChange={e => set('note', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <span className="flex items-center justify-center gap-2"><span className="spinner w-4 h-4" /> Saving…</span> : isEdit ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
