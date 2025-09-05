import React from 'react'
import { useData } from '../../context/DataContext'
import ExerciseListItem from './ExerciseListItem'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function ExerciseList() {
  const { exercises } = useData()

  const pendingExercises = exercises.filter(ex => ex.completionStatus === 'pending')
  const completedExercises = exercises.filter(ex => ex.completionStatus === 'completed')

  return (
    <div className="space-y-6">
      {/* Pending Exercises */}
      {pendingExercises.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-textPrimary">Pending Exercises</h2>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              {pendingExercises.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingExercises.map(exercise => (
              <ExerciseListItem key={exercise.exerciseId} exercise={exercise} variant="pending" />
            ))}
          </div>
        </div>
      )}

      {/* Completed Exercises */}
      {completedExercises.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold text-textPrimary">Completed Today</h2>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {completedExercises.length}
            </span>
          </div>
          <div className="space-y-3">
            {completedExercises.map(exercise => (
              <ExerciseListItem key={exercise.exerciseId} exercise={exercise} variant="completed" />
            ))}
          </div>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-textSecondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-textPrimary mb-2">No Exercises Yet</h3>
          <p className="text-textSecondary">Your therapist will assign exercises to your program.</p>
        </div>
      )}
    </div>
  )
}