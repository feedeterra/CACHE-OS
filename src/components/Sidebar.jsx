import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const FUNNEL_DOT = {
  conversions: 'bg-accent',
  leads: 'bg-success',
}

export default function Sidebar() {
  const [clients, setClients] = useState([])
  const [open, setOpen] = useState(true)
  const location = useLocation()

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name, funnel_type, is_active')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setClients(data ?? []))
  }, [location.pathname])

  const link = (isActive) =>
    `block px-5 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-l-2 ${
      isActive ? 'text-accent border-accent bg-accent/5' : 'text-text-dim hover:text-text border-transparent'
    }`

  return (
    <nav
      className="w-56 bg-bg-primary py-4 flex flex-col overflow-y-auto shrink-0"
      style={{ borderRight: '1px solid', borderImageSource: 'linear-gradient(to bottom, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.05) 60%, transparent 100%)', borderImageSlice: 1 }}
    >
      <NavLink to="/admin" end className={({ isActive }) => link(isActive)}>
        {'>'} OVERVIEW
      </NavLink>

      {/* Clients expandable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="block w-full text-left px-5 py-2 font-mono text-xs uppercase tracking-wider text-text-dim hover:text-text border-l-2 border-transparent transition-colors cursor-pointer"
      >
        {open ? '▼' : '▶'} CLIENTS{clients.length > 0 ? ` (${clients.length})` : ''}
      </button>

      {open && clients.map((c) => (
        <NavLink
          key={c.id}
          to={`/admin/client/${c.id}`}
          className={({ isActive }) =>
            `block pl-7 pr-4 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-l-2 ${
              isActive ? 'text-accent border-accent bg-accent/5' : 'text-text-dim hover:text-text border-transparent'
            }`
          }
        >
          <span className="flex items-center gap-1.5 truncate">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${FUNNEL_DOT[c.funnel_type] ?? 'bg-success'}`} />
            <span className="truncate">{c.name.toUpperCase().replace(/ /g, '_')}</span>
          </span>
        </NavLink>
      ))}

      {open && clients.length === 0 && (
        <p className="pl-7 py-1.5 font-mono text-[9px] text-text-dim/50 uppercase">NO CLIENTS</p>
      )}

      <div className="mt-auto pt-2 flex flex-col gap-0">
        <NavLink to="/admin/clients" className={({ isActive }) => link(isActive)}>
          {'>'} CONFIG
        </NavLink>
        <NavLink to="/admin/logs" className={({ isActive }) => link(isActive)}>
          {'>'} LOGS
        </NavLink>
      </div>
    </nav>
  )
}
