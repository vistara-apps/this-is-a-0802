import React, { useState } from 'react'
import { useData } from '../../context/DataContext'
import PatientCard from './PatientCard'
import { Search, Filter, Users, AlertTriangle } from 'lucide-react'

export default function PatientOverview() {
  const { patients } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'high' && patient.adherenceRate >= 80) ||
      (filterType === 'medium' && patient.adherenceRate >= 60 && patient.adherenceRate < 80) ||
      (filterType === 'low' && patient.adherenceRate < 60)

    return matchesSearch && matchesFilter
  })

  const lowAdherencePatients = patients.filter(p => p.adherenceRate < 70)

  return (
    <div className="space-y-6">
      {/* Alert for low adherence patients */}
      {lowAdherencePatients.length > 0 && (
        <div className="card border-l-4 border-orange-500 bg-orange-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
            <div>
              <h3 className="font-medium text-orange-800">Attention Required</h3>
              <p className="text-sm text-orange-700">
                {lowAdherencePatients.length} patient{lowAdherencePatients.length !== 1 ? 's' : ''} 
                {' '}with adherence below 70%: {lowAdherencePatients.map(p => p.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Patient Overview</h1>
          <p className="text-textSecondary">Monitor and manage your patients' progress</p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textSecondary" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input w-full sm:w-auto"
          >
            <option value="all">All Patients</option>
            <option value="high">High Adherence (80%+)</option>
            <option value="medium">Medium Adherence (60-79%)</option>
            <option value="low">Low Adherence (&lt;60%)</option>
          </select>
        </div>
      </div>

      {/* Patients Grid */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <PatientCard key={patient.patientId} patient={patient} variant="summary" />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-textSecondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-textPrimary mb-2">
            {searchTerm || filterType !== 'all' ? 'No matching patients' : 'No patients yet'}
          </h3>
          <p className="text-textSecondary">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Patients will appear here once they are assigned to your care'
            }
          </p>
        </div>
      )}
    </div>
  )
}