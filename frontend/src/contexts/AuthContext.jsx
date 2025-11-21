import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)

          // Vérifier si le token est toujours valide
          try {
            const response = await authAPI.me()
            setUser(response.data.data.user)
          } catch (err) {
            console.error('Erreur validation token:', err)
            // On garde l'utilisateur du localStorage même si la validation échoue
          }
        } catch (err) {
          console.error('Erreur chargement utilisateur:', err)
          logout()
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authAPI.login({ email, password })
      const { user, token } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (data) => {
    try {
      setError(null)
      const response = await authAPI.register(data)
      const { user, token } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur d\'inscription'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const hasActiveSubscription = () => {
    if (!user) return false
    if (user.subscription_type === 'free') return false

    const expiresAt = new Date(user.subscription_expires_at)
    return expiresAt > new Date()
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    hasActiveSubscription
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
