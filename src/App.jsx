import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import PatientApp from './components/patient/PatientApp'
import TherapistDashboard from './components/therapist/TherapistDashboard'
import LoginPage from './components/auth/LoginPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'

function AppRoutes() {
  const { user, userType } = useAuth()

  if (!user) {
    return <LoginPage />
  }

  return (
    <DataProvider>
      <AppShell userType={userType}>
        <Routes>
          <Route 
            path="/patient/*" 
            element={userType === 'patient' ? <PatientApp /> : <Navigate to="/therapist" />} 
          />
          <Route 
            path="/therapist/*" 
            element={userType === 'therapist' ? <TherapistDashboard /> : <Navigate to="/patient" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={userType === 'patient' ? '/patient' : '/therapist'} />} 
          />
        </Routes>
      </AppShell>
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}