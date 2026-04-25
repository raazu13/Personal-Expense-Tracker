import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!securityQuestion || !securityAnswer) {
      toast.error('Please select and answer a security question.')
      return
    }
    setIsSubmitting(true)
    const success = await register(name, email, password, securityQuestion, securityAnswer)
    if (success) {
      navigate('/dashboard')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in px-4">
      <div className="card w-full max-w-md p-8 shadow-xl my-8">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white pr-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Security Question</label>
            <select
              required
              className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white text-sm mb-3"
              value={securityQuestion}
              onChange={e => setSecurityQuestion(e.target.value)}
            >
              <option value="" disabled>Select a question...</option>
              <option value="What was the name of your first pet?">What was the name of your first pet?</option>
              <option value="What city were you born in?">What city were you born in?</option>
              <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              <option value="What was your childhood nickname?">What was your childhood nickname?</option>
            </select>
            
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Security Answer</label>
            <input
              type="text"
              required
              className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white"
              placeholder="Your answer"
              value={securityAnswer}
              onChange={e => setSecurityAnswer(e.target.value)}
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
