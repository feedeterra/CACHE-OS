import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-text-dim text-[10px] font-mono tabular-nums">
      {now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}{' '}
      <span className="text-accent">{now.toLocaleTimeString('en-US', { hour12: false })}</span>
    </span>
  )
}

function ClientSwitcher({ clients }) {
  const navigate = useNavigate()
  return (
    <div className="relative md:hidden">
      <select 
        onChange={(e) => e.target.value && navigate(`/admin/client/${e.target.value}`)}
        className="bg-bg-primary border border-accent/20 text-accent font-mono text-[9px] pl-1 pr-4 py-0.5 outline-none appearance-none rounded-none cursor-pointer uppercase tracking-tighter"
        defaultValue=""
      >
        <option value="" disabled>SELECT_CLIENT</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
        ))}
      </select>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-accent/50 scale-75">
        ▼
      </div>
    </div>
  )
}

export default function TopNav({ email, onLogout, onToggleSidebar, clients = [] }) {
  return (
    <header className="flex items-center justify-between px-4 h-11 border-b border-white/5 bg-bg-primary shrink-0 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="md:hidden text-accent p-1 -ml-1 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <span className="text-accent font-bold font-display text-xs tracking-tighter sm:tracking-widest shrink-0">CACHE // OS</span>
        <span className="hidden xs:inline text-[8px] font-mono text-text-dim/40 border border-white/5 px-1 py-0.5">v2.0</span>
        {clients.length > 0 && <ClientSwitcher clients={clients} />}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <Clock />
        </div>
        {email && (
          <span className="text-[10px] text-text-dim/50 font-mono hidden lg:block">{email}</span>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-[9px] text-text-dim hover:text-danger font-mono uppercase tracking-widest border border-white/5 hover:border-danger/30 px-2 py-1 transition-all cursor-pointer whitespace-nowrap"
          >
            [→] <span className="hidden xs:inline">DISCONNECT</span>
          </button>
        )}
      </div>
    </header>
  )
}
