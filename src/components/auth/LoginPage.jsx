import React, { useState } from 'react'
import { UserCheck, Stethoscope, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [userType, setUserType] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await login(email, password, userType)
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-textPrimary mb-2">TherapyTrack</h1>
          <p className="text-textSecondary">Connect patients and therapists for better rehab outcomes</p>
        </div>

        <div className="card">
          <div className="flex space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setUserType('patient')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                userType === 'patient'
                  ? 'bg-primary text-white'
                  : 'bg-textSecondary/10 text-textSecondary hover:bg-textSecondary/20'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span>Patient</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('therapist')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                userType === 'therapist'
                  ? 'bg-primary text-white'
                  : 'bg-textSecondary/10 text-textSecondary hover:bg-textSecondary/20'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              <span>Therapist</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder={userType === 'patient' ? 'patient@example.com' : 'therapist@clinic.com'}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-textSecondary hover:text-textPrimary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : `Sign in as ${userType}`}
            </button>
          </form>

          <div className="mt-6 p-4 bg-accent/10 rounded-md">
            <p className="text-sm text-textSecondary text-center">
              <strong>Demo credentials:</strong><br />
              Patient: patient@demo.com / demo123<br />
              Therapist: therapist@demo.com / demo123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}