import { useState } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899',
]

export default function CategoryForm({ category, onSave, onClose }) {
  const isEdit = !!category?.id
  const [form, setForm] = useState({
    name: category?.name ?? '',
    color: category?.color ?? '#6366f1',
    monthly_budget: category?.monthly_budget ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Category name is required'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await client.put(`/api/categories/${category.id}`, form)
        toast.success('Category updated!')
      } else {
        await client.post('/api/categories', form)
        toast.success('Category created!')
      }
      onSave()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? '✏️ Edit Category' : '🏷️ New Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Groceries"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 overflow-hidden"
                title="Custom color"
              />
            </div>
          </div>

          <div>
            <label className="label">Monthly Budget (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="0 = no limit"
              value={form.monthly_budget}
              onChange={e => set('monthly_budget', e.target.value)}
            />
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <span className="w-3 h-3 rounded-full" style={{ background: form.color }} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {form.name || 'Category name'}
            </span>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
