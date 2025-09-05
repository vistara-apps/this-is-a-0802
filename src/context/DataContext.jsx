import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const DataContext = createContext()

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export function DataProvider({ children }) {
  const { user, userType } = useAuth()
  const [exercises, setExercises] = useState([])
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    
    // Mock data - in real app, this would fetch from Supabase
    if (userType === 'patient') {
      const mockExercises = [
        {
          exerciseId: '1',
          patientId: user.id,
          name: 'Knee Extension',
          prescription: 'Sit on chair, straighten leg, hold for 5 seconds',
          videoUrl: null,
          feedback: null,
          completionStatus: 'pending',
          recordedAt: null,
          sets: 3,
          reps: 10,
          frequency: 'Daily'
        },
        {
          exerciseId: '2',
          patientId: user.id,
          name: 'Ankle Pumps',
          prescription: 'Point toes up and down slowly',
          videoUrl: 'ipfs://mock-hash-1',
          feedback: 'Great form! Try to hold the position a bit longer.',
          completionStatus: 'completed',
          recordedAt: new Date().toISOString(),
          sets: 2,
          reps: 15,
          frequency: 'Twice daily'
        },
        {
          exerciseId: '3',
          patientId: user.id,
          name: 'Calf Raises',
          prescription: 'Rise up on toes, lower slowly',
          videoUrl: null,
          feedback: null,
          completionStatus: 'pending',
          recordedAt: null,
          sets: 3,
          reps: 12,
          frequency: 'Daily'
        }
      ]
      setExercises(mockExercises)
    } else if (userType === 'therapist') {
      const mockPatients = [
        {
          patientId: 'patient-1',
          therapistId: user.id,
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          adherenceRate: 85,
          lastActivity: '2024-01-15T10:30:00Z',
          totalExercises: 12,
          completedExercises: 10
        },
        {
          patientId: 'patient-2',
          therapistId: user.id,
          name: 'Mike Rodriguez',
          email: 'mike.r@email.com',
          adherenceRate: 92,
          lastActivity: '2024-01-15T14:20:00Z',
          totalExercises: 8,
          completedExercises: 7
        },
        {
          patientId: 'patient-3',
          therapistId: user.id,
          name: 'Emma Wilson',
          email: 'emma.w@email.com',
          adherenceRate: 76,
          lastActivity: '2024-01-14T16:45:00Z',
          totalExercises: 15,
          completedExercises: 11
        }
      ]
      setPatients(mockPatients)
    }
    
    setTimeout(() => setLoading(false), 500)
  }

  const updateExercise = (exerciseId, updates) => {
    setExercises(prev => prev.map(exercise => 
      exercise.exerciseId === exerciseId 
        ? { ...exercise, ...updates }
        : exercise
    ))
  }

  const addExercise = (exercise) => {
    setExercises(prev => [...prev, exercise])
  }

  const value = {
    exercises,
    patients,
    prescriptions,
    loading,
    updateExercise,
    addExercise,
    loadData
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}