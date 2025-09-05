import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function ProgressChart({ patientId, variant = 'adherence' }) {
  // Mock data - in real app, this would be fetched based on patientId
  const adherenceData = [
    { date: '1/8', adherence: 60, exercises: 3 },
    { date: '1/9', adherence: 75, exercises: 4 },
    { date: '1/10', adherence: 80, exercises: 4 },
    { date: '1/11', adherence: 70, exercises: 3 },
    { date: '1/12', adherence: 85, exercises: 5 },
    { date: '1/13', adherence: 90, exercises: 5 },
    { date: '1/14', adherence: 85, exercises: 4 },
    { date: '1/15', adherence: 92, exercises: 6 },
  ]

  const performanceData = [
    { week: 'Week 1', improvement: 15, form: 65 },
    { week: 'Week 2', improvement: 25, form: 75 },
    { week: 'Week 3', improvement: 40, form: 80 },
    { week: 'Week 4', improvement: 55, form: 85 },
  ]

  if (variant === 'performance') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={performanceData}>
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
          <Area 
            type="monotone" 
            dataKey="improvement" 
            stackId="1"
            stroke="hsl(220, 80%, 50%)" 
            fill="hsl(220, 80%, 50%)"
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="form" 
            stackId="1"
            stroke="hsl(140, 70%, 45%)" 
            fill="hsl(140, 70%, 45%)"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={adherenceData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#64748b" />
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
  )
}