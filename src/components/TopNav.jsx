import { useState, useEffect } from 'react'

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

export default function TopNav({ email, onLogout }) {
  return (
    <header className="flex items-center justify-between px-5 h-11 border-b border-white/5 bg-bg-primary shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-accent font-bold font-display text-sm tracking-widest">CACHE // OS</span>
        <span className="text-[8px] font-mono text-text-dim/40 border border-white/5 px-1.5 py-0.5">v2.0</span>
      </div>
      <div className="flex items-center gap-4">
        <Clock />
        {email && (
          <span className="text-[10px] text-text-dim/50 font-mono hidden sm:block">{email}</span>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-[10px] text-text-dim hover:text-danger font-mono uppercase tracking-widest border border-white/5 hover:border-danger/30 px-3 py-1 transition-all cursor-pointer"
          >
            [→] DISCONNECT
          </button>
        )}
      </div>
    </header>
  )
}
