import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import client from '../api/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      // Fetch user profile
      client.get('/api/auth/me')
        .then(res => {
          setUser(res.data)
        })
        .catch(() => {
          setToken(null)
          setUser(null)
          localStorage.removeItem('token')
        })
        .finally(() => setLoading(false))
    } else {
      localStorage.removeItem('token')
      setUser(null)
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const res = await client.post('/api/auth/login', { email, password })
      setToken(res.data.token)
      setUser(res.data.user)
      toast.success('Logged in successfully!')
      return true
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
      return false
    }
  }

  const register = async (name, email, password) => {
    try {
      const res = await client.post('/api/auth/register', { name, email, password })
      setToken(res.data.token)
      setUser(res.data.user)
      toast.success('Account created successfully!')
      return true
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
      return false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
