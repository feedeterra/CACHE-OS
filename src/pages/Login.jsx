import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import HudPanel from '../components/HudPanel'
import HudButton from '../components/HudButton'
import BlinkingCursor from '../components/BlinkingCursor'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-accent font-bold font-mono text-xl tracking-widest">
            CACHE // OS
          </p>
          <p className="text-text-dim font-mono text-[10px] uppercase tracking-widest mt-1">
            COMMAND_CENTER_ACCESS
          </p>
        </div>

        <HudPanel title="AUTENTICACIÓN">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-text-dim font-mono uppercase tracking-widest mb-1">
                EMAIL_ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@cache.agency"
                className="w-full bg-bg-primary border border-border/40 text-text font-mono text-xs px-3 py-2 rounded-none focus:outline-none focus:border-accent placeholder:text-text-dim/40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-dim font-mono uppercase tracking-widest mb-1">
                PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-primary border border-border/40 text-text font-mono text-xs px-3 py-2 rounded-none focus:outline-none focus:border-accent placeholder:text-text-dim/40"
              />
            </div>
            {error && (
              <p className="text-danger font-mono text-[10px]">ERR: {error}</p>
            )}
            <HudButton type="submit" disabled={loading} className="w-full justify-center">
              {loading ? 'AUTHENTICATING...' : '[→] AUTHENTICATE'}
            </HudButton>
          </form>
        </HudPanel>
      </div>
    </div>
  )
}
