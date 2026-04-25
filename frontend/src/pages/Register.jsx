import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const success = await register(name, email, password)
    if (success) {
      navigate('/dashboard')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in px-4">
      <div className="card w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-5">
            ₹
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Create Account</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Start managing your personal finances</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Name</label>
            <input
              type="text"
              required
              className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              required
              className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base mt-2 shadow-lg hover:-translate-y-0.5 hover:shadow-primary-500/25 transition-all">
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 hover:underline font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
