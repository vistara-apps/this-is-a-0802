import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { Camera, Video, Upload, CheckCircle, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'

export default function ExerciseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { exercises, updateExercise } = useData()
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState(null)
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  const exercise = exercises.find(ex => ex.exerciseId === id)

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-textSecondary">Exercise not found</p>
      </div>
    )
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      })
      
      streamRef.current = stream
      videoRef.current.srcObject = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const retakeVideo = () => {
    setVideoBlob(null)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const uploadVideo = async () => {
    if (!videoBlob) return
    
    setUploading(true)
    
    try {
      // Simulate upload to Pinata IPFS
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockVideoUrl = `ipfs://mock-hash-${Date.now()}`
      
      // Simulate OpenAI analysis
      const mockFeedback = generateMockFeedback(exercise.name)
      
      updateExercise(exercise.exerciseId, {
        videoUrl: mockVideoUrl,
        completionStatus: 'completed',
        recordedAt: new Date().toISOString(),
        aiAnalysis: mockFeedback.analysis
      })
      
      alert('Exercise completed successfully! AI feedback has been generated.')
      navigate('/patient')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const generateMockFeedback = (exerciseName) => {
    const feedbacks = {
      'Knee Extension': {
        analysis: 'Good form detected. Counted 8 repetitions. Try to hold the extended position for the full 5 seconds.'
      },
      'Ankle Pumps': {
        analysis: 'Excellent range of motion. Counted 12 repetitions. Smooth and controlled movement observed.'
      },
      'Calf Raises': {
        analysis: 'Good balance maintained. Counted 10 repetitions. Consider rising higher on your toes for better stretch.'
      }
    }
    
    return feedbacks[exerciseName] || {
      analysis: 'Exercise completed. Form looks good overall. Keep up the great work!'
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/patient')}
          className="p-2 hover:bg-textSecondary/10 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-textSecondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">{exercise.name}</h1>
          <p className="text-textSecondary">Record your exercise session</p>
        </div>
      </div>

      {/* Exercise Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-textPrimary mb-3">Instructions</h2>
        <p className="text-textSecondary mb-4">{exercise.prescription}</p>
        <div className="flex items-center space-x-6 text-sm text-textSecondary">
          <span><strong>Sets:</strong> {exercise.sets}</span>
          <span><strong>Reps:</strong> {exercise.reps}</span>
          <span><strong>Frequency:</strong> {exercise.frequency}</span>
        </div>
      </div>

      {/* Video Recording */}
      <div className="card">
        <h2 className="text-lg font-semibold text-textPrimary mb-4">Record Exercise</h2>
        
        <div className="bg-gray-100 rounded-lg aspect-video mb-4 flex items-center justify-center overflow-hidden">
          {videoBlob ? (
            <video 
              src={URL.createObjectURL(videoBlob)}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ display: recording ? 'block' : 'none' }}
            />
          )}
          
          {!recording && !videoBlob && (
            <div className="text-center">
              <Camera className="w-12 h-12 text-textSecondary mx-auto mb-2" />
              <p className="text-textSecondary">Ready to record</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!recording && !videoBlob && (
            <button
              onClick={startRecording}
              className="btn-primary flex items-center space-x-2"
            >
              <Video className="w-4 h-4" />
              <span>Start Recording</span>
            </button>
          )}

          {recording && (
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-lg py-md rounded-md font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <Pause className="w-4 h-4" />
              <span>Stop Recording</span>
            </button>
          )}

          {videoBlob && (
            <>
              <button
                onClick={retakeVideo}
                className="btn-secondary flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>
              <button
                onClick={uploadVideo}
                disabled={uploading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Submit Exercise</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Previous Feedback */}
      {exercise.feedback && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-textPrimary">Therapist Feedback</h2>
          </div>
          <p className="text-textSecondary">{exercise.feedback}</p>
        </div>
      )}
    </div>
  )
}