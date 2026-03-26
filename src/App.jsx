import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import PortalLayout from './layouts/PortalLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminClients from './pages/AdminClients'
import ClientDashboard from './pages/ClientDashboard'
import ClientPortal from './pages/ClientPortal'
import LandingPage from './pages/LandingPage'
import LogsPage from './pages/LogsPage'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import HudPanel from './components/HudPanel'
import BlinkingCursor from './components/BlinkingCursor'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <HudPanel title="ERROR 404">
        <p className="text-accent font-mono text-xs">
          TARGET NOT FOUND. ACCESS DENIED. <BlinkingCursor />
        </p>
      </HudPanel>
    </div>
  )
}

function RequireAdmin({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <p className="font-mono text-xs text-text-dim uppercase tracking-widest">
          LOADING <BlinkingCursor />
        </p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/login" replace />

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="client/:id" element={<ClientDashboard />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>

      <Route path="/portal/:token" element={<PortalLayout />}>
        <Route index element={<ClientPortal />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
