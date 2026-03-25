import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import TopNav from '../components/TopNav'
import Sidebar from '../components/Sidebar'

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clients, setClients] = useState([])

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name, funnel_type, is_active')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="h-[100dvh] flex flex-col bg-bg-primary overflow-hidden relative">
      <TopNav 
        email={user?.email} 
        onLogout={signOut} 
        onToggleSidebar={toggleSidebar}
        clients={clients}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          clients={clients}
        />
        
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
