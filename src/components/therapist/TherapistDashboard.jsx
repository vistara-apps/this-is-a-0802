import React from 'react'
import { Routes, Route } from 'react-router-dom'
import PatientOverview from './PatientOverview'
import PatientDetail from './PatientDetail'
import { useData } from '../../context/DataContext'
import { Users, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default function TherapistDashboard() {
  const { patients, loading } = useData()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalPatients = patients.length
  const avgAdherence = patients.length > 0 
    ? Math.round(patients.reduce((sum, p) => sum + p.adherenceRate, 0) / patients.length)
    : 0
  const activeToday = patients.filter(p => 
    new Date(p.lastActivity).toDateString() === new Date().toDateString()
  ).length
  const totalExercises = patients.reduce((sum, p) => sum + p.completedExercises, 0)

  return (
    <Routes>
      <Route path="/" element={
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{totalPatients}</p>
                  <p className="text-sm text-textSecondary">Total Patients</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-md">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{avgAdherence}%</p>
                  <p className="text-sm text-textSecondary">Avg Adherence</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-md">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{activeToday}</p>
                  <p className="text-sm text-textSecondary">Active Today</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{totalExercises}</p>
                  <p className="text-sm text-textSecondary">Exercises Completed</p>
                </div>
              </div>
            </div>
          </div>

          <PatientOverview />
        </div>
      } />
      <Route path="/patient/:id" element={<PatientDetail />} />
    </Routes>
  )
}