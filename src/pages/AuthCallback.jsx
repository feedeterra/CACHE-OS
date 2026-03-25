import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import BlinkingCursor from '../components/BlinkingCursor'

export default function AuthCallback() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && session) navigate('/admin', { replace: true })
  }, [session, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <p className="font-mono text-xs text-text-dim uppercase tracking-widest">
        AUTHENTICATING <BlinkingCursor />
      </p>
    </div>
  )
}
