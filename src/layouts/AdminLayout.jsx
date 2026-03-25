import { Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import TopNav from '../components/TopNav'
import Sidebar from '../components/Sidebar'

export default function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <TopNav email={user?.email} onLogout={signOut} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
