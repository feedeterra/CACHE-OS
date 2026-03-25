import { Outlet } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function PortalLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <TopNav />
      <main className="flex-1 w-full max-w-4xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
