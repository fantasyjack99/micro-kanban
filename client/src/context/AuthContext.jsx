import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Get API URL from environment variable or default to relative path
const API_URL = import.meta.env.VITE_API_URL || ''

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const { data } = await axios.get(`${API_URL}/api/auth/me`)
          setUser(data.user)
        } catch (err) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [token])

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password })
    localStorage.setItem('token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (email, password, name) => {
    const { data } = await axios.post(`${API_URL}/api/auth/register`, { email, password, name })
    localStorage.setItem('token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
