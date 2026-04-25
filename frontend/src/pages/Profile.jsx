import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import client from '../api/client'

const thisMonth = () => new Date().toISOString().slice(0, 7)

export default function Profile() {
  const { user, logout, deleteAccount } = useAuth()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [reportMonth, setReportMonth] = useState(thisMonth())
  const [clearConfirm, setClearConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      await client.put('/api/auth/password', {
        current_password: currentPassword,
        new_password: newPassword
      })
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password')
    }
    setIsUpdating(false)
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const res = await client.get(`/api/report?month=${reportMonth}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expense_report_${reportMonth}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF downloaded successfully!')
    } catch (err) {
      toast.error('Failed to download PDF')
    }
    setIsDownloading(false)
  }

  const handleExportCSV = async () => {
    setIsDownloading(true)
    try {
      const res = await client.get(`/api/expenses/export?month=${reportMonth}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expenses_${reportMonth}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
    setIsDownloading(false)
  }

  const handleClearAll = async () => {
    try {
      await Promise.all(
        (await client.get('/api/expenses')).data.map(e => client.delete(`/api/expenses/${e.id}`))
      )
      toast.success('All expenses cleared')
      setClearConfirm(false)
    } catch (error) {
      toast.error('Error clearing data')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account, security, and data exports.</p>
      </div>

      {/* User Info */}
      <div className="card p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
          👤 Personal Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          🔒 Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white pr-10"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                {showCurrentPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                minLength={6}
                className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white pr-10"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                {showNewPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isUpdating} className="btn-primary w-full py-2.5 text-sm mt-2">
            {isUpdating ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Reports & Data Export */}
      <div className="card p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          📄 Reports & Data Export
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Select Month</label>
            <input
              type="month"
              value={reportMonth}
              onChange={e => setReportMonth(e.target.value)}
              className="input w-full md:w-48 bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white"
            />
          </div>
          <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 text-sm py-2">
            📥 Download PDF
          </button>
          <button onClick={handleExportCSV} disabled={isDownloading} className="btn-secondary w-full md:w-auto flex items-center justify-center gap-2 text-sm py-2">
            📤 Export CSV
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-5 border border-red-200 dark:border-red-900">
        <h2 className="font-semibold text-red-600 dark:text-red-400 text-lg mb-4 flex items-center gap-2">
          ⚠️ Danger Zone
        </h2>
        <div className="space-y-4">
          {!clearConfirm ? (
            <button onClick={() => setClearConfirm(true)} className="btn-danger w-full md:w-auto text-sm mr-0 md:mr-3 mb-3 md:mb-0">
              🗑️ Clear All Expense Data
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mb-3">
              <p className="text-sm text-red-600 dark:text-red-300 flex-1 min-w-[200px]">
                This will permanently delete ALL expenses. Are you sure?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setClearConfirm(false)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={handleClearAll} className="btn-danger text-sm">Yes, Delete All</button>
              </div>
            </div>
          )}

          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} className="btn-danger w-full md:w-auto text-sm bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800">
              🚨 Permanently Delete Account
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mt-3 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-300 flex-1 min-w-[200px] font-medium">
                This will perfectly delete your account, budget, categories, and ALL expenses. You CANNOT UNDO this.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={deleteAccount} className="btn-danger text-sm bg-red-600 hover:bg-red-700">Delete My Account</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button onClick={logout} className="w-full card p-4 flex items-center justify-center gap-2 border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors shadow-sm">
        <span className="text-xl">🚪</span>
        LOGOUT
      </button>

    </div>
  )
}
