import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import authService, { userService } from '../services/authService.js'
import { getErrorMessage, UNAUTHORIZED_EVENT } from '../services/api.js'
import { useToast } from './ToastContext.jsx'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  /**
   * Session restore. The auth token lives in an httpOnly cookie, so the only
   * way to know whether we are signed in is to ask the API.
   */
  const refresh = useCallback(async () => {
    try {
      const { data } = await authService.me()
      setUser(data?.user || null)
      return data?.user || null
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        const { data } = await authService.me()
        if (active) setUser(data?.user || null)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      active = false
    }
  }, [])

  // The axios interceptor broadcasts this when the session expires mid-use.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser((current) => {
        if (current) toast.warning('Your session expired. Please sign in again.')
        return null
      })
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [toast])

  const login = useCallback(
    async (credentials) => {
      const { data, message } = await authService.login(credentials)
      setUser(data.user)
      toast.success(message || 'Signed in successfully.')
      return data.user
    },
    [toast]
  )

  const register = useCallback(
    async (payload) => {
      const { data, message } = await authService.register(payload)
      setUser(data.user)
      toast.success(message || 'Welcome to YogAI!')
      return data.user
    },
    [toast]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      // Even if the call fails, clear local state so the UI is never stuck.
    }
    setUser(null)
    toast.info('You have been signed out.')
  }, [toast])

  const updateProfile = useCallback(
    async (payload) => {
      try {
        const { data, message } = await userService.updateProfile(payload)
        setUser(data.user)
        toast.success(message || 'Profile updated.')
        return data.user
      } catch (error) {
        toast.error(getErrorMessage(error))
        throw error
      }
    },
    [toast]
  )

  const updatePreferences = useCallback(
    async (payload) => {
      try {
        const { data, message } = await userService.updatePreferences(payload)
        setUser((current) => (current ? { ...current, preferences: data.preferences } : current))
        toast.success(message || 'Preferences saved.')
        return data.preferences
      } catch (error) {
        toast.error(getErrorMessage(error))
        throw error
      }
    },
    [toast]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
      updateProfile,
      updatePreferences,
      setUser,
    }),
    [user, loading, login, register, logout, refresh, updateProfile, updatePreferences]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}

export default AuthContext
