import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import { useEffect } from 'react'
import client from './api/client'
import toast from 'react-hot-toast'

function RecurringProcessor() {
  useEffect(() => {
    client.post('/api/recurring/process')
      .then(res => {
        if (res.data.count > 0) {
          toast.success(`✅ ${res.data.count} recurring expense(s) added for today!`, { duration: 5000 })
        }
      })
      .catch(() => {})
  }, [])
  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RecurringProcessor />
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  )
}
