/**
 * Database Service for TherapyTrack
 * Centralized database operations using Supabase services
 */

import {
  supabase,
  authService,
  profileService,
  therapistService,
  patientService,
  exerciseService,
  prescriptionService
} from './supabase.js'

/**
 * User Management Service
 */
export const userService = {
  /**
   * Create a new user account (patient or therapist)
   */
  async createUser(userData) {
    try {
      // Sign up the user
      const { user } = await authService.signUp(
        userData.email,
        userData.password,
        {
          first_name: userData.firstName,
          last_name: userData.lastName,
          user_type: userData.userType
        }
      )

      // Create profile
      const profile = await profileService.createProfile({
        id: user.id,
        user_type: userData.userType,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        date_of_birth: userData.dateOfBirth
      })

      // Create role-specific record
      if (userData.userType === 'therapist') {
        const therapist = await therapistService.createTherapist({
          user_id: user.id,
          practice_name: userData.practiceName,
          license_number: userData.licenseNumber,
          specialization: userData.specialization || [],
          years_experience: userData.yearsExperience,
          bio: userData.bio
        })
        
        return { user, profile, therapist }
      } else if (userData.userType === 'patient') {
        const patient = await patientService.createPatient({
          user_id: user.id,
          therapist_id: userData.therapistId,
          condition_description: userData.conditionDescription,
          injury_date: userData.injuryDate,
          treatment_start_date: userData.treatmentStartDate,
          emergency_contact_name: userData.emergencyContactName,
          emergency_contact_phone: userData.emergencyContactPhone,
          medical_notes: userData.medicalNotes
        })
        
        return { user, profile, patient }
      }

      return { user, profile }
    } catch (error) {
      console.error('User creation failed:', error)
      throw error
    }
  },

  /**
   * Get complete user data with role-specific information
   */
  async getUserData(userId) {
    try {
      const profile = await profileService.getProfile(userId)
      
      if (profile.user_type === 'therapist') {
        const therapist = await therapistService.getTherapist(userId)
        return { profile, therapist, userType: 'therapist' }
      } else if (profile.user_type === 'patient') {
        const patient = await patientService.getPatient(userId)
        return { profile, patient, userType: 'patient' }
      }

      return { profile, userType: profile.user_type }
    } catch (error) {
      console.error('Failed to get user data:', error)
      throw error
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      return await profileService.updateProfile(userId, updates)
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }
}

/**
 * Exercise Management Service
 */
export const exerciseManagementService = {
  /**
   * Get exercises for a patient with completion data
   */
  async getPatientExercises(patientId) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_completions (*),
          prescriptions (
            *,
            exercise_library (*)
          ),
          exercise_feedback (
            *,
            therapists (
              *,
              profiles (first_name, last_name)
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to match existing structure
      return data.map(exercise => ({
        exerciseId: exercise.exercise_id,
        patientId: exercise.patient_id,
        name: exercise.name,
        prescription: exercise.instructions,
        sets: exercise.sets,
        reps: exercise.reps,
        frequency: exercise.frequency,
        completionStatus: exercise.status,
        videoUrl: exercise.exercise_completions?.[0]?.video_url || null,
        feedback: exercise.exercise_feedback?.[0]?.content || null,
        recordedAt: exercise.exercise_completions?.[0]?.completed_at || null,
        aiAnalysis: exercise.exercise_completions?.[0]?.ai_analysis || null,
        therapistFeedback: exercise.exercise_feedback || []
      }))
    } catch (error) {
      console.error('Failed to get patient exercises:', error)
      throw error
    }
  },

  /**
   * Complete an exercise with video and AI analysis
   */
  async completeExercise(exerciseId, completionData) {
    try {
      // Update exercise status
      await exerciseService.updateExercise(exerciseId, {
        status: 'completed'
      })

      // Create completion record
      const completion = await exerciseService.completeExercise(exerciseId, {
        sets_completed: completionData.setsCompleted,
        reps_completed: completionData.repsCompleted,
        duration_seconds: completionData.durationSeconds,
        pain_level: completionData.painLevel,
        difficulty_rating: completionData.difficultyRating,
        notes: completionData.notes,
        video_url: completionData.videoUrl,
        video_thumbnail_url: completionData.thumbnailUrl,
        ai_analysis: completionData.aiAnalysis
      })

      return completion
    } catch (error) {
      console.error('Exercise completion failed:', error)
      throw error
    }
  },

  /**
   * Add therapist feedback to an exercise
   */
  async addTherapistFeedback(exerciseId, feedbackData) {
    try {
      return await exerciseService.addFeedback(exerciseId, {
        therapist_id: feedbackData.therapistId,
        patient_id: feedbackData.patientId,
        feedback_type: feedbackData.type,
        content: feedbackData.content,
        video_url: feedbackData.videoUrl
      })
    } catch (error) {
      console.error('Failed to add therapist feedback:', error)
      throw error
    }
  }
}

/**
 * Therapist Dashboard Service
 */
export const therapistDashboardService = {
  /**
   * Get therapist dashboard data
   */
  async getDashboardData(therapistId) {
    try {
      // Get therapist patients with exercise data
      const patients = await therapistService.getPatients(therapistId)
      
      // Get dashboard statistics
      const { data: dashboardData, error } = await supabase
        .from('therapist_dashboard')
        .select('*')
        .eq('therapist_id', therapistId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw error
      }

      // Calculate real-time statistics
      const stats = {
        totalPatients: patients.length,
        avgAdherence: patients.length > 0 
          ? patients.reduce((sum, p) => sum + (p.adherence_rate || 0), 0) / patients.length
          : 0,
        activeToday: patients.filter(p => {
          const lastActivity = new Date(p.last_activity || 0)
          const today = new Date()
          return lastActivity.toDateString() === today.toDateString()
        }).length,
        totalExercises: patients.reduce((sum, p) => sum + (p.completed_exercises || 0), 0)
      }

      return {
        patients: patients.map(patient => ({
          patientId: patient.patient_id,
          therapistId: patient.therapist_id,
          name: `${patient.profiles?.first_name || ''} ${patient.profiles?.last_name || ''}`.trim(),
          email: patient.profiles?.email,
          adherenceRate: patient.adherence_rate || 0,
          lastActivity: patient.last_activity,
          totalExercises: patient.exercises?.length || 0,
          completedExercises: patient.exercises?.filter(e => 
            e.exercise_completions?.length > 0
          ).length || 0
        })),
        stats
      }
    } catch (error) {
      console.error('Failed to get therapist dashboard data:', error)
      throw error
    }
  },

  /**
   * Get detailed patient data for therapist
   */
  async getPatientDetail(patientId, therapistId) {
    try {
      // Verify patient belongs to therapist
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          profiles (*),
          therapists (
            *,
            profiles (*)
          )
        `)
        .eq('patient_id', patientId)
        .eq('therapist_id', therapistId)
        .single()

      if (patientError) throw patientError

      // Get patient exercises with completions and feedback
      const exercises = await exerciseManagementService.getPatientExercises(patientId)

      // Get progress tracking data
      const { data: progressData, error: progressError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(30)

      if (progressError) throw progressError

      return {
        patient: {
          patientId: patient.patient_id,
          name: `${patient.profiles.first_name} ${patient.profiles.last_name}`,
          email: patient.profiles.email,
          conditionDescription: patient.condition_description,
          injuryDate: patient.injury_date,
          treatmentStartDate: patient.treatment_start_date
        },
        exercises,
        progressData: progressData || []
      }
    } catch (error) {
      console.error('Failed to get patient detail:', error)
      throw error
    }
  }
}

/**
 * Patient Dashboard Service
 */
export const patientDashboardService = {
  /**
   * Get patient dashboard data
   */
  async getDashboardData(patientId) {
    try {
      // Get patient exercises
      const exercises = await exerciseManagementService.getPatientExercises(patientId)

      // Calculate statistics
      const today = new Date().toDateString()
      const completedToday = exercises.filter(ex => 
        ex.completionStatus === 'completed' && 
        new Date(ex.recordedAt || 0).toDateString() === today
      ).length

      const totalToday = exercises.filter(ex => 
        ex.frequency.toLowerCase().includes('daily')
      ).length

      const adherenceRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

      // Get recent feedback
      const { data: recentFeedback, error: feedbackError } = await supabase
        .from('exercise_feedback')
        .select(`
          *,
          exercises (*),
          therapists (
            *,
            profiles (first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (feedbackError) throw feedbackError

      return {
        exercises,
        stats: {
          completedToday,
          totalToday,
          adherenceRate,
          totalExercises: exercises.length
        },
        recentFeedback: recentFeedback || []
      }
    } catch (error) {
      console.error('Failed to get patient dashboard data:', error)
      throw error
    }
  }
}

/**
 * Prescription Management Service
 */
export const prescriptionManagementService = {
  /**
   * Create a new prescription for a patient
   */
  async createPrescription(prescriptionData) {
    try {
      // Create prescription
      const prescription = await prescriptionService.createPrescription({
        patient_id: prescriptionData.patientId,
        therapist_id: prescriptionData.therapistId,
        exercise_lib_id: prescriptionData.exerciseLibId,
        sets: prescriptionData.sets,
        reps: prescriptionData.reps,
        frequency: prescriptionData.frequency,
        duration_weeks: prescriptionData.durationWeeks,
        special_instructions: prescriptionData.specialInstructions
      })

      // Create exercise instance
      const exercise = await exerciseService.createExercise({
        patient_id: prescriptionData.patientId,
        prescription_id: prescription.prescription_id,
        name: prescriptionData.exerciseName,
        instructions: prescriptionData.instructions,
        sets: prescriptionData.sets,
        reps: prescriptionData.reps,
        frequency: prescriptionData.frequency,
        scheduled_date: prescriptionData.scheduledDate
      })

      return { prescription, exercise }
    } catch (error) {
      console.error('Prescription creation failed:', error)
      throw error
    }
  },

  /**
   * Get exercise library for therapist
   */
  async getExerciseLibrary(therapistId) {
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${therapistId}`)
        .order('name')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get exercise library:', error)
      throw error
    }
  }
}

/**
 * Analytics Service
 */
export const analyticsService = {
  /**
   * Get patient progress analytics
   */
  async getPatientAnalytics(patientId, days = 30) {
    try {
      const { data, error } = await supabase.rpc('calculate_adherence_rate', {
        p_patient_id: patientId,
        p_days: days
      })

      if (error) throw error

      // Get completion trends
      const { data: completions, error: completionsError } = await supabase
        .from('exercise_completions')
        .select('completed_at, pain_level, difficulty_rating')
        .eq('patient_id', patientId)
        .gte('completed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at')

      if (completionsError) throw completionsError

      return {
        adherenceRate: data,
        completionTrends: completions || [],
        totalCompletions: completions?.length || 0
      }
    } catch (error) {
      console.error('Failed to get patient analytics:', error)
      throw error
    }
  },

  /**
   * Get therapist practice analytics
   */
  async getTherapistAnalytics(therapistId) {
    try {
      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          patient_id,
          profiles (first_name, last_name),
          exercises (
            exercise_id,
            exercise_completions (completed_at)
          )
        `)
        .eq('therapist_id', therapistId)

      if (error) throw error

      // Calculate analytics
      const analytics = {
        totalPatients: patients.length,
        activePatients: 0,
        totalCompletions: 0,
        avgAdherence: 0,
        patientProgress: []
      }

      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      patients.forEach(patient => {
        const completions = patient.exercises?.flatMap(e => e.exercise_completions || []) || []
        const recentCompletions = completions.filter(c => 
          new Date(c.completed_at) >= weekAgo
        )

        if (recentCompletions.length > 0) {
          analytics.activePatients++
        }

        analytics.totalCompletions += completions.length
        
        analytics.patientProgress.push({
          patientId: patient.patient_id,
          name: `${patient.profiles.first_name} ${patient.profiles.last_name}`,
          totalCompletions: completions.length,
          recentCompletions: recentCompletions.length
        })
      })

      return analytics
    } catch (error) {
      console.error('Failed to get therapist analytics:', error)
      throw error
    }
  }
}

export default {
  userService,
  exerciseManagementService,
  therapistDashboardService,
  patientDashboardService,
  prescriptionManagementService,
  analyticsService
}
