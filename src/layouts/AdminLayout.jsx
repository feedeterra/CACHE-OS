import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import TopNav from '../components/TopNav'
import Sidebar from '../components/Sidebar'

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <TopNav 
        email={user?.email} 
        onLogout={signOut} 
        onToggleSidebar={toggleSidebar} 
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
