import React from 'react'
import { useData } from '../../context/DataContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Calendar, Target, Award } from 'lucide-react'

export default function ProgressView() {
  const { exercises } = useData()

  // Mock progress data
  const weeklyProgress = [
    { week: 'Week 1', adherence: 65, completed: 8 },
    { week: 'Week 2', adherence: 78, completed: 12 },
    { week: 'Week 3', adherence: 85, completed: 15 },
    { week: 'Week 4', adherence: 92, completed: 18 },
  ]

  const totalCompleted = exercises.filter(ex => ex.completionStatus === 'completed').length
  const currentStreak = 5 // Mock data
  const totalExercises = exercises.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary mb-2">Progress Overview</h1>
        <p className="text-textSecondary">Track your rehabilitation journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{totalCompleted}</p>
              <p className="text-sm text-textSecondary">Exercises Completed</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-md">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">92%</p>
              <p className="text-sm text-textSecondary">Current Adherence</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/10 rounded-md">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{currentStreak}</p>
              <p className="text-sm text-textSecondary">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 rounded-md">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{Math.round((totalCompleted / totalExercises) * 100)}%</p>
              <p className="text-sm text-textSecondary">Overall Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Adherence Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="adherence" 
                stroke="hsl(220, 80%, 50%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(220, 80%, 50%)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Weekly Exercises</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="completed" fill="hsl(140, 70%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="card">
        <h2 className="text-lg font-semibold text-textPrimary mb-4">Recent Achievements</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-md">
            <Award className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">5-Day Streak!</p>
              <p className="text-sm text-green-600">Completed exercises for 5 consecutive days</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-md">
            <Target className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Perfect Week</p>
              <p className="text-sm text-blue-600">100% adherence for the past week</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-md">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-purple-800">Improvement Noted</p>
              <p className="text-sm text-purple-600">Therapist noted improved form in recent videos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}