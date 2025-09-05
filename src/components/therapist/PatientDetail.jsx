import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { ArrowLeft, MessageSquare, Video, Plus, Send, Calendar, TrendingUp } from 'lucide-react'
import FeedbackModal from './FeedbackModal'
import ProgressChart from './ProgressChart'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { patients } = useData()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackType, setFeedbackType] = useState('text')
  const [selectedExercise, setSelectedExercise] = useState(null)

  const patient = patients.find(p => p.patientId === id)

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-textSecondary">Patient not found</p>
      </div>
    )
  }

  // Mock exercise data for this patient
  const patientExercises = [
    {
      exerciseId: '1',
      name: 'Knee Extension',
      completionStatus: 'completed',
      recordedAt: '2024-01-15T10:30:00Z',
      videoUrl: 'ipfs://mock-hash-1',
      aiAnalysis: 'Good form detected. Counted 8 repetitions. Try to hold the extended position for the full 5 seconds.',
      feedback: null
    },
    {
      exerciseId: '2',
      name: 'Ankle Pumps',
      completionStatus: 'completed',
      recordedAt: '2024-01-15T14:20:00Z',
      videoUrl: 'ipfs://mock-hash-2',
      aiAnalysis: 'Excellent range of motion. Counted 12 repetitions.',
      feedback: 'Great improvement! Keep up the consistent practice.'
    },
    {
      exerciseId: '3',
      name: 'Calf Raises',
      completionStatus: 'pending',
      recordedAt: null,
      videoUrl: null,
      aiAnalysis: null,
      feedback: null
    }
  ]

  const handleProvideFeedback = (exercise, type) => {
    setSelectedExercise(exercise)
    setFeedbackType(type)
    setShowFeedbackModal(true)
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not completed'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/therapist')}
          className="p-2 hover:bg-textSecondary/10 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-textSecondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">{patient.name}</h1>
          <p className="text-textSecondary">{patient.email}</p>
        </div>
      </div>

      {/* Patient Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{patient.adherenceRate}%</p>
              <p className="text-sm text-textSecondary">Adherence Rate</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-md">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{patient.completedExercises}</p>
              <p className="text-sm text-textSecondary">Completed</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-md">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{patient.totalExercises}</p>
              <p className="text-sm text-textSecondary">Total Assigned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Progress Overview</h2>
          <ProgressChart patientId={patient.patientId} variant="adherence" />
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Completed Ankle Pumps</p>
                <p className="text-xs text-green-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Completed Knee Extension</p>
                <p className="text-xs text-blue-600">6 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Missed Calf Raises</p>
                <p className="text-xs text-gray-600">Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-textPrimary">Exercise History</h2>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>

        <div className="space-y-4">
          {patientExercises.map(exercise => (
            <div key={exercise.exerciseId} className="border border-textSecondary/10 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-textPrimary">{exercise.name}</h3>
                  <p className="text-sm text-textSecondary">
                    {formatDateTime(exercise.recordedAt)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  exercise.completionStatus === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {exercise.completionStatus}
                </span>
              </div>

              {exercise.aiAnalysis && (
                <div className="mb-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700 font-medium mb-1">AI Analysis:</p>
                  <p className="text-xs text-blue-600">{exercise.aiAnalysis}</p>
                </div>
              )}

              {exercise.feedback && (
                <div className="mb-3 p-3 bg-purple-50 rounded-md">
                  <p className="text-xs text-purple-700 font-medium mb-1">Your Feedback:</p>
                  <p className="text-xs text-purple-600">{exercise.feedback}</p>
                </div>
              )}

              {exercise.completionStatus === 'completed' && (
                <div className="flex space-x-2">
                  {exercise.videoUrl && (
                    <button className="btn-secondary flex items-center space-x-2 text-sm py-2 px-3">
                      <Video className="w-4 h-4" />
                      <span>View Video</span>
                    </button>
                  )}
                  <button 
                    onClick={() => handleProvideFeedback(exercise, 'text')}
                    className="btn-secondary flex items-center space-x-2 text-sm py-2 px-3"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Add Feedback</span>
                  </button>
                  <button 
                    onClick={() => handleProvideFeedback(exercise, 'video')}
                    className="btn-secondary flex items-center space-x-2 text-sm py-2 px-3"
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Response</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          exercise={selectedExercise}
          variant={feedbackType}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={(feedback) => {
            console.log('Feedback submitted:', feedback)
            setShowFeedbackModal(false)
          }}
        />
      )}
    </div>
  )
}