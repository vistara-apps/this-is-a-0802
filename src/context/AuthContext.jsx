import React, { createContext, useContext, useState, useEffect } from 'react'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('therapytrack_user')
    const storedUserType = localStorage.getItem('therapytrack_usertype')
    
    if (storedUser && storedUserType) {
      setUser(JSON.parse(storedUser))
      setUserType(storedUserType)
    }
    setLoading(false)
  }, [])

  const login = async (email, password, type) => {
    // Simulate login - in real app, this would call Supabase auth
    const mockUser = {
      id: type === 'patient' ? 'patient-1' : 'therapist-1',
      name: type === 'patient' ? 'Sarah Johnson' : 'Dr. Emily Chen',
      email: email,
      type: type
    }
    
    setUser(mockUser)
    setUserType(type)
    localStorage.setItem('therapytrack_user', JSON.stringify(mockUser))
    localStorage.setItem('therapytrack_usertype', type)
    
    return mockUser
  }

  const logout = () => {
    setUser(null)
    setUserType(null)
    localStorage.removeItem('therapytrack_user')
    localStorage.removeItem('therapytrack_usertype')
  }

  const value = {
    user,
    userType,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}