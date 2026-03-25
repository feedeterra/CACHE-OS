import { Outlet } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function PortalLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-primary">
      <TopNav />
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 pb-20">
        <Outlet />
      </main>
    </div>
  )
}
