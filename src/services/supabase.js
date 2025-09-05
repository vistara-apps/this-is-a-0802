/**
 * Supabase Service for TherapyTrack
 * Handles authentication, database operations, and real-time subscriptions
 */

import { createClient } from '@supabase/supabase-js'
import { config } from '../utils/api.js'

// Initialize Supabase client
export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

/**
 * Authentication Services
 */
export const authService = {
  // Sign up new user
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Reset password
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.app.url}/reset-password`
    })
    if (error) throw error
  },

  // Update password
  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

/**
 * Profile Services
 */
export const profileService = {
  // Get user profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Create user profile
  async createProfile(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * Therapist Services
 */
export const therapistService = {
  // Get therapist details
  async getTherapist(therapistId) {
    const { data, error } = await supabase
      .from('therapists')
      .select(`
        *,
        profiles (*)
      `)
      .eq('therapist_id', therapistId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get therapist patients
  async getPatients(therapistId) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        profiles (*),
        exercises (
          *,
          exercise_completions (*)
        )
      `)
      .eq('therapist_id', therapistId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create new patient
  async createPatient(patientData) {
    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * Patient Services
 */
export const patientService = {
  // Get patient details
  async getPatient(patientId) {
    const { data, error } = await supabase
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
      .single()
    
    if (error) throw error
    return data
  },

  // Get patient exercises
  async getExercises(patientId) {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_completions (*),
        prescriptions (*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

/**
 * Exercise Services
 */
export const exerciseService = {
  // Create new exercise
  async createExercise(exerciseData) {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exerciseData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update exercise
  async updateExercise(exerciseId, updates) {
    const { data, error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('exercise_id', exerciseId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Complete exercise
  async completeExercise(exerciseId, completionData) {
    const { data, error } = await supabase
      .from('exercise_completions')
      .insert({
        exercise_id: exerciseId,
        ...completionData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Add feedback to exercise
  async addFeedback(exerciseId, feedbackData) {
    const { data, error } = await supabase
      .from('exercise_feedback')
      .insert({
        exercise_id: exerciseId,
        ...feedbackData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * Prescription Services
 */
export const prescriptionService = {
  // Create prescription
  async createPrescription(prescriptionData) {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert(prescriptionData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get patient prescriptions
  async getPatientPrescriptions(patientId) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Update prescription
  async updatePrescription(prescriptionId, updates) {
    const { data, error } = await supabase
      .from('prescriptions')
      .update(updates)
      .eq('prescription_id', prescriptionId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * Real-time Subscriptions
 */
export const subscriptionService = {
  // Subscribe to patient exercises
  subscribeToPatientExercises(patientId, callback) {
    return supabase
      .channel(`patient-exercises-${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercises',
          filter: `patient_id=eq.${patientId}`
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to therapist patients
  subscribeToTherapistPatients(therapistId, callback) {
    return supabase
      .channel(`therapist-patients-${therapistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `therapist_id=eq.${therapistId}`
        },
        callback
      )
      .subscribe()
  },

  // Unsubscribe from channel
  unsubscribe(subscription) {
    return supabase.removeChannel(subscription)
  }
}

export default supabase
