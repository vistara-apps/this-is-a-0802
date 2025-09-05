import React, { useState } from 'react'
import { X, Send, Video, Type } from 'lucide-react'

export default function FeedbackModal({ exercise, variant = 'text', onClose, onSubmit }) {
  const [feedback, setFeedback] = useState('')
  const [recording, setRecording] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (feedback.trim()) {
      onSubmit({
        exerciseId: exercise.exerciseId,
        type: variant,
        content: feedback,
        timestamp: new Date().toISOString()
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-textSecondary/10">
          <div className="flex items-center space-x-3">
            {variant === 'video' ? (
              <Video className="w-5 h-5 text-primary" />
            ) : (
              <Type className="w-5 h-5 text-primary" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-textPrimary">
                {variant === 'video' ? 'Record Video Feedback' : 'Provide Text Feedback'}
              </h2>
              <p className="text-sm text-textSecondary">For {exercise?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-textSecondary/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {variant === 'video' ? (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-12 h-12 text-textSecondary mx-auto mb-2" />
                  <p className="text-textSecondary">Video recording not implemented in demo</p>
                  <p className="text-sm text-textSecondary">Would use webcam recording here</p>
                </div>
              </div>
              <button
                type="button"
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  recording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'btn-primary'
                }`}
              >
                {recording ? 'Stop Recording' : 'Start Recording'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-textPrimary mb-2">
                  Your feedback
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  className="input resize-none"
                  placeholder="Provide constructive feedback about the patient's exercise performance..."
                  required
                />
              </div>

              <div className="bg-blue-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">AI Analysis Summary:</h4>
                <p className="text-sm text-blue-700">
                  {exercise?.aiAnalysis || 'No AI analysis available for this exercise.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim() && variant === 'text'}
              className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Send Feedback</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}