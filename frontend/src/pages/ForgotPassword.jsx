import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../api/client'

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleFetchQuestion = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await client.get(`/api/auth/security-question?email=${encodeURIComponent(email)}`)
      setSecurityQuestion(res.data.security_question)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Account not found or no security question set.')
    }
    setIsSubmitting(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await client.post('/api/auth/reset-password', {
        email,
        security_answer: securityAnswer,
        new_password: newPassword
      })
      toast.success('Password reset successfully! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Incorrect security answer or network error.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in px-4">
      <div className="card w-full max-w-md p-8 shadow-xl my-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-5">
            🔒
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Recovery</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Reset your forgotten password</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleFetchQuestion} className="space-y-4">
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
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base mt-2 shadow-lg hover:-translate-y-0.5 hover:shadow-primary-500/25 transition-all">
              {isSubmitting ? 'Locating account...' : 'Find Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Security Question</p>
              <p className="text-gray-900 dark:text-white font-medium">{securityQuestion}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Your Answer</label>
              <input
                type="text"
                required
                className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white"
                placeholder="Answer goes here..."
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="input w-full bg-gray-50 dark:bg-gray-900 border-gray-200 focus:bg-white pr-10"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
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

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base mt-2 shadow-lg hover:-translate-y-0.5 hover:shadow-primary-500/25 transition-all">
              {isSubmitting ? 'Resetting password...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn-secondary w-full py-2.5 text-sm mt-2">
              Back to Email
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 hover:underline font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
