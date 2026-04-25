import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/expenses', label: 'Expenses', icon: '💸' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              ₹
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
              ExpenseTracker
            </span>
          </Link>

          {/* Nav links (Only shown if user is logged in) */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const active = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hi, {user.name || user.email.split('@')[0]}
                </span>
              </div>
            )}
            
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 bg-gray-200 dark:bg-primary-500 rounded-full transition-colors duration-300 flex-shrink-0"
              aria-label="Toggle dark mode"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center text-xs ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile nav (Only shown if user is logged in) */}
        {user && (
          <div className="flex md:hidden gap-1 pb-2">
            {navLinks.map(link => {
              const active = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="truncate w-full text-center">{link.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
