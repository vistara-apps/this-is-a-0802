import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import ExerciseList from './ExerciseList'
import ExerciseDetail from './ExerciseDetail'
import ProgressView from './ProgressView'
import { useData } from '../../context/DataContext'
import { Activity, TrendingUp, Calendar, CheckCircle } from 'lucide-react'

export default function PatientApp() {
  const { exercises, loading } = useData()
  
  const completedToday = exercises.filter(ex => 
    ex.completionStatus === 'completed' && 
    new Date(ex.recordedAt).toDateString() === new Date().toDateString()
  ).length

  const totalToday = exercises.filter(ex => ex.frequency.includes('Daily')).length
  const adherenceRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{completedToday}</p>
                  <p className="text-sm text-textSecondary">Completed Today</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-md">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{adherenceRate}%</p>
                  <p className="text-sm text-textSecondary">Adherence Rate</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-md">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{totalToday}</p>
                  <p className="text-sm text-textSecondary">Today's Plan</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-textPrimary">{exercises.length}</p>
                  <p className="text-sm text-textSecondary">Total Exercises</p>
                </div>
              </div>
            </div>
          </div>

          <ExerciseList />
        </div>
      } />
      <Route path="/exercise/:id" element={<ExerciseDetail />} />
      <Route path="/progress" element={<ProgressView />} />
    </Routes>
  )
}