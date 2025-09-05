import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/supabase.js'
import { userService } from '../services/database.js'
import { formatErrorMessage } from '../utils/api.js'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserType(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    try {
      const session = await authService.getSession()
      if (session?.user) {
        await loadUserData(session.user)
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      setError(formatErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async (authUser) => {
    try {
      const userData = await userService.getUserData(authUser.id)
      
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim(),
        ...userData
      })
      setUserType(userData.userType)
      setProfile(userData.profile)
    } catch (error) {
      console.error('Failed to load user data:', error)
      setError(formatErrorMessage(error))
    }
  }

  const login = async (email, password, type) => {
    try {
      setError(null)
      setLoading(true)

      // For demo purposes, allow login with any credentials
      // In production, remove this and use only real authentication
      if (email.includes('demo') || password === 'demo123') {
        const mockUser = {
          id: type === 'patient' ? 'patient-1' : 'therapist-1',
          name: type === 'patient' ? 'Sarah Johnson' : 'Dr. Emily Chen',
          email: email,
          type: type
        }
        
        setUser(mockUser)
        setUserType(type)
        setProfile({
          first_name: mockUser.name.split(' ')[0],
          last_name: mockUser.name.split(' ')[1] || '',
          email: email,
          user_type: type
        })
        
        return mockUser
      }

      // Real authentication
      const { user: authUser } = await authService.signIn(email, password)
      await loadUserData(authUser)
      
      return user
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      setLoading(true)

      const result = await userService.createUser(userData)
      await loadUserData(result.user)
      
      return result
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.signOut()
      setUser(null)
      setUserType(null)
      setProfile(null)
      setError(null)
    } catch (error) {
      console.error('Logout failed:', error)
      setError(formatErrorMessage(error))
    }
  }

  const resetPassword = async (email) => {
    try {
      setError(null)
      await authService.resetPassword(email)
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updatePassword = async (password) => {
    try {
      setError(null)
      await authService.updatePassword(password)
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateProfile = async (updates) => {
    try {
      setError(null)
      const updatedProfile = await userService.updateUserProfile(user.id, updates)
      setProfile(updatedProfile)
      setUser(prev => ({ ...prev, ...updates }))
      return updatedProfile
    } catch (error) {
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const clearError = () => setError(null)

  const value = {
    user,
    userType,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
