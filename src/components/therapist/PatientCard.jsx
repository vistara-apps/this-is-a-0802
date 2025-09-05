import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, CheckCircle, AlertCircle, TrendingUp, User } from 'lucide-react'

export default function PatientCard({ patient, variant = 'summary' }) {
  const navigate = useNavigate()

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getAdherenceIcon = (rate) => {
    if (rate >= 80) return <CheckCircle className="w-4 h-4" />
    if (rate >= 60) return <Clock className="w-4 h-4" />
    return <AlertCircle className="w-4 h-4" />
  }

  const formatLastActivity = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  const handleClick = () => {
    navigate(`/therapist/patient/${patient.patientId}`)
  }

  return (
    <div 
      onClick={handleClick}
      className="card hover:shadow-lg transition-shadow cursor-pointer border border-textSecondary/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-textPrimary">{patient.name}</h3>
            <p className="text-sm text-textSecondary">{patient.email}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-textSecondary" />
      </div>

      {/* Adherence Rate */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-textPrimary">Adherence Rate</span>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getAdherenceColor(patient.adherenceRate)}`}>
          {getAdherenceIcon(patient.adherenceRate)}
          <span className="text-sm font-medium">{patient.adherenceRate}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-textSecondary/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              patient.adherenceRate >= 80 ? 'bg-green-500' :
              patient.adherenceRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${patient.adherenceRate}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-textPrimary">{patient.completedExercises}</p>
          <p className="text-xs text-textSecondary">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-textPrimary">{patient.totalExercises}</p>
          <p className="text-xs text-textSecondary">Total Assigned</p>
        </div>
      </div>

      {/* Last Activity */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-textSecondary">Last activity:</span>
        <span className="font-medium text-textPrimary">{formatLastActivity(patient.lastActivity)}</span>
      </div>
    </div>
  )
}