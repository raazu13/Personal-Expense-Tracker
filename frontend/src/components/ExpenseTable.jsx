import { useState } from 'react'

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net Banking', 'Recurring']

export default function ExpenseTable({ expenses, categories, onEdit, onDelete, loading }) {
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const sorted = [...(expenses || [])].sort((a, b) => {
    let av = a[sortField], bv = b[sortField]
    if (sortField === 'amount') { av = Number(av); bv = Number(bv) }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sorted.length / PER_PAGE)
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const arrow = (field) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-4 animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!paginated.length) {
    return (
      <div className="card p-12 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-gray-500 dark:text-gray-400 font-medium">No expenses found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new expense</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              {[
                { key: 'date', label: 'Date' },
                { key: 'description', label: 'Description' },
                { key: 'category_name', label: 'Category' },
                { key: 'amount', label: 'Amount' },
                { key: 'payment_method', label: 'Method' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                >
                  {col.label}{arrow(col.key)}
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {paginated.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{exp.date}</td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-xs">
                  <div className="truncate">{exp.description || '—'}</div>
                  {exp.note && <div className="text-xs text-gray-400 truncate">{exp.note}</div>}
                </td>
                <td className="px-4 py-3">
                  {exp.category_name ? (
                    <span
                      className="badge text-white text-xs px-2.5 py-1"
                      style={{ background: exp.category_color || '#6366f1' }}
                    >
                      {exp.category_name}
                    </span>
                  ) : (
                    <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500">Uncategorized</span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {exp.payment_method}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(exp)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(exp.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sorted.length} results · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
