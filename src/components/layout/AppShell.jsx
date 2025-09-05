import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function AppShell({ children, userType }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile Header */}
      <div className="lg:hidden bg-surface border-b border-textSecondary/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-textSecondary hover:text-textPrimary"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-textPrimary">TherapyTrack</h1>
        <button
          onClick={logout}
          className="p-2 text-textSecondary hover:text-textPrimary"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col bg-surface">
            <div className="flex items-center justify-between px-4 py-3 border-b border-textSecondary/10">
              <h2 className="text-lg font-semibold text-textPrimary">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-textSecondary hover:text-textPrimary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 px-4 py-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-textPrimary">{user?.name}</p>
                  <p className="text-sm text-textSecondary capitalize">{userType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden lg:block bg-surface border-b border-textSecondary/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-textPrimary">TherapyTrack</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-textPrimary">{user?.name}</p>
                <p className="text-xs text-textSecondary capitalize">{userType}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-textSecondary hover:text-textPrimary transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {children}
      </main>
    </div>
  )
}