import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, CheckCircle, Clock, MessageSquare, Camera } from 'lucide-react'

export default function ExerciseListItem({ exercise, variant = 'pending' }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/patient/exercise/${exercise.exerciseId}`)
  }

  return (
    <div 
      onClick={handleClick}
      className="border border-textSecondary/10 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-full ${
          variant === 'completed' 
            ? 'bg-green-100 text-green-600' 
            : 'bg-orange-100 text-orange-600'
        }`}>
          {variant === 'completed' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-textPrimary mb-1">{exercise.name}</h3>
              <p className="text-sm text-textSecondary mb-2 line-clamp-2">
                {exercise.prescription}
              </p>
              <div className="flex items-center space-x-4 text-xs text-textSecondary">
                <span>{exercise.sets} sets × {exercise.reps} reps</span>
                <span>{exercise.frequency}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {exercise.videoUrl && (
                <div className="p-1 bg-blue-100 text-blue-600 rounded">
                  <Camera className="w-4 h-4" />
                </div>
              )}
              {exercise.feedback && (
                <div className="p-1 bg-purple-100 text-purple-600 rounded">
                  <MessageSquare className="w-4 h-4" />
                </div>
              )}
              <div className="p-1 bg-primary/10 text-primary rounded">
                <Play className="w-4 h-4" />
              </div>
            </div>
          </div>

          {exercise.feedback && (
            <div className="mt-3 p-2 bg-purple-50 rounded-md">
              <p className="text-xs text-purple-700 font-medium mb-1">Therapist Feedback:</p>
              <p className="text-xs text-purple-600">{exercise.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}