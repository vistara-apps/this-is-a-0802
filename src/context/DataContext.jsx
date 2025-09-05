import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
  exerciseManagementService,
  therapistDashboardService,
  patientDashboardService,
  prescriptionManagementService,
  analyticsService
} from '../services/database.js'
import { exerciseAnalysisService } from '../services/openai.js'
import { exerciseVideoService } from '../services/pinata.js'
import { formatErrorMessage } from '../utils/api.js'

const DataContext = createContext()

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export function DataProvider({ children }) {
  const { user, userType, profile } = useAuth()
  const [exercises, setExercises] = useState([])
  const [patients, setPatients] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mock data for demo mode
  const mockExercises = [
    {
      exerciseId: '1',
      name: 'Knee Extension',
      prescription: '3 sets of 10 reps, hold for 5 seconds',
      completionStatus: 'pending',
      recordedAt: null,
      videoUrl: null,
      feedback: null,
      aiAnalysis: null
    },
    {
      exerciseId: '2',
      name: 'Ankle Pumps',
      prescription: '2 sets of 15 reps, slow and controlled',
      completionStatus: 'completed',
      recordedAt: '2024-01-15T14:20:00Z',
      videoUrl: 'ipfs://mock-hash-2',
      feedback: 'Great improvement! Keep up the consistent practice.',
      aiAnalysis: 'Excellent range of motion. Counted 12 repetitions.'
    },
    {
      exerciseId: '3',
      name: 'Calf Raises',
      prescription: '3 sets of 12 reps, focus on balance',
      completionStatus: 'pending',
      recordedAt: null,
      videoUrl: null,
      feedback: null,
      aiAnalysis: null
    }
  ]

  const mockPatients = [
    {
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      adherenceRate: 85,
      lastActivity: '2024-01-15T14:20:00Z',
      totalExercises: 12,
      completedExercises: 8
    },
    {
      patientId: 'patient-2',
      therapistId: 'therapist-1',
      name: 'Michael Chen',
      email: 'michael@example.com',
      adherenceRate: 92,
      lastActivity: '2024-01-15T10:30:00Z',
      totalExercises: 15,
      completedExercises: 14
    },
    {
      patientId: 'patient-3',
      therapistId: 'therapist-1',
      name: 'Emma Davis',
      email: 'emma@example.com',
      adherenceRate: 78,
      lastActivity: '2024-01-14T16:45:00Z',
      totalExercises: 10,
      completedExercises: 7
    }
  ]

  useEffect(() => {
    if (user && userType) {
      loadData()
    }
  }, [user, userType])

  const loadData = async () => {
    if (!user || !userType) return

    setLoading(true)
    setError(null)

    try {
      // Use mock data for demo users
      if (user.email?.includes('demo') || user.id?.includes('patient-') || user.id?.includes('therapist-')) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
        
        if (userType === 'patient') {
          setExercises(mockExercises)
          setDashboardData({
            stats: {
              completedToday: 1,
              totalToday: 3,
              adherenceRate: 85,
              totalExercises: 3
            },
            recentFeedback: []
          })
        } else if (userType === 'therapist') {
          setPatients(mockPatients)
          setDashboardData({
            patients: mockPatients,
            stats: {
              totalPatients: 3,
              avgAdherence: 85,
              activeToday: 2,
              totalExercises: 37
            }
          })
        }
        return
      }

      // Real data loading
      if (userType === 'patient') {
        const patientId = user.patient?.patient_id
        if (patientId) {
          const [exerciseData, dashboardInfo] = await Promise.all([
            exerciseManagementService.getPatientExercises(patientId),
            patientDashboardService.getDashboardData(patientId)
          ])
          
          setExercises(exerciseData)
          setDashboardData(dashboardInfo)
        }
      } else if (userType === 'therapist') {
        const therapistId = user.therapist?.therapist_id
        if (therapistId) {
          const dashboardInfo = await therapistDashboardService.getDashboardData(therapistId)
          setPatients(dashboardInfo.patients)
          setDashboardData(dashboardInfo)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setError(formatErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const completeExercise = async (exerciseId, completionData) => {
    try {
      setError(null)

      // For demo users, simulate completion
      if (user.email?.includes('demo') || user.id?.includes('patient-')) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setExercises(prev => prev.map(ex => 
          ex.exerciseId === exerciseId 
            ? { 
                ...ex, 
                completionStatus: 'completed',
                recordedAt: new Date().toISOString(),
                videoUrl: completionData.videoUrl || 'ipfs://mock-hash',
                aiAnalysis: 'Good form detected. Counted 8 repetitions. Try to hold the extended position for the full 5 seconds.',
                feedback: null
              }
            : ex
        ))
        
        return { success: true }
      }

      // Real exercise completion
      let videoResult = null
      let aiAnalysis = null

      // Upload video if provided
      if (completionData.videoBlob) {
        const exercise = exercises.find(ex => ex.exerciseId === exerciseId)
        videoResult = await exerciseVideoService.uploadExerciseVideo(
          completionData.videoBlob,
          {
            exerciseId,
            patientId: user.patient?.patient_id,
            name: exercise?.name || 'Exercise'
          }
        )

        // Analyze video with AI
        try {
          aiAnalysis = await exerciseAnalysisService.analyzeExerciseVideo(
            completionData.videoBlob,
            exercise?.name || 'Exercise',
            exercise?.prescription || ''
          )
        } catch (aiError) {
          console.warn('AI analysis failed, continuing without it:', aiError)
        }
      }

      // Save completion to database
      const completion = await exerciseManagementService.completeExercise(exerciseId, {
        setsCompleted: completionData.setsCompleted,
        repsCompleted: completionData.repsCompleted,
        durationSeconds: completionData.durationSeconds,
        painLevel: completionData.painLevel,
        difficultyRating: completionData.difficultyRating,
        notes: completionData.notes,
        videoUrl: videoResult?.video?.ipfsHash,
        thumbnailUrl: videoResult?.thumbnail?.ipfsHash,
        aiAnalysis: aiAnalysis
      })

      // Update local state
      setExercises(prev => prev.map(ex => 
        ex.exerciseId === exerciseId 
          ? { 
              ...ex, 
              completionStatus: 'completed',
              recordedAt: new Date().toISOString(),
              videoUrl: videoResult?.video?.url,
              aiAnalysis: aiAnalysis?.feedback || 'Exercise completed successfully'
            }
          : ex
      ))

      return { success: true, completion, videoResult, aiAnalysis }
    } catch (error) {
      console.error('Failed to complete exercise:', error)
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const addTherapistFeedback = async (exerciseId, feedbackData) => {
    try {
      setError(null)

      // For demo users, simulate feedback
      if (user.email?.includes('demo') || user.id?.includes('therapist-')) {
        await new Promise(resolve => setTimeout(resolve, 500))
        return { success: true }
      }

      // Real feedback submission
      const feedback = await exerciseManagementService.addTherapistFeedback(exerciseId, {
        therapistId: user.therapist?.therapist_id,
        patientId: feedbackData.patientId,
        type: feedbackData.type,
        content: feedbackData.content,
        videoUrl: feedbackData.videoUrl
      })

      return { success: true, feedback }
    } catch (error) {
      console.error('Failed to add feedback:', error)
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const createPrescription = async (prescriptionData) => {
    try {
      setError(null)

      // For demo users, simulate prescription creation
      if (user.email?.includes('demo') || user.id?.includes('therapist-')) {
        await new Promise(resolve => setTimeout(resolve, 500))
        return { success: true }
      }

      // Real prescription creation
      const result = await prescriptionManagementService.createPrescription({
        ...prescriptionData,
        therapistId: user.therapist?.therapist_id
      })

      // Refresh data to show new prescription
      await loadData()

      return { success: true, result }
    } catch (error) {
      console.error('Failed to create prescription:', error)
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getPatientDetail = async (patientId) => {
    try {
      setError(null)

      // For demo users, return mock data
      if (user.email?.includes('demo') || user.id?.includes('therapist-')) {
        const patient = mockPatients.find(p => p.patientId === patientId)
        return {
          patient,
          exercises: mockExercises,
          progressData: []
        }
      }

      // Real patient detail
      return await therapistDashboardService.getPatientDetail(
        patientId,
        user.therapist?.therapist_id
      )
    } catch (error) {
      console.error('Failed to get patient detail:', error)
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getAnalytics = async (patientId, days = 30) => {
    try {
      setError(null)

      // For demo users, return mock analytics
      if (user.email?.includes('demo')) {
        return {
          adherenceRate: 85,
          completionTrends: [],
          totalCompletions: 8
        }
      }

      // Real analytics
      return await analyticsService.getPatientAnalytics(patientId, days)
    } catch (error) {
      console.error('Failed to get analytics:', error)
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const clearError = () => setError(null)

  // Legacy methods for backward compatibility
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
    dashboardData,
    loading,
    error,
    completeExercise,
    addTherapistFeedback,
    createPrescription,
    getPatientDetail,
    getAnalytics,
    refreshData: loadData,
    clearError,
    // Legacy methods
    updateExercise,
    addExercise,
    loadData,
    prescriptions: [] // For backward compatibility
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
