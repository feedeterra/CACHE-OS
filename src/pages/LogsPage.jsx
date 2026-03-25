import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import BlinkingCursor from '../components/BlinkingCursor'

const LEVEL_COLOR = {
  info: 'text-text-dim',
  warn: 'text-warning',
  error: 'text-danger',
}

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs(data ?? [])
        setLoading(false)
      })

    const ch = supabase.channel('logs_page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (p) => {
        setLogs((prev) => [p.new, ...prev])
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.level === filter)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" style={{ animation: 'led-pulse 2s ease-in-out infinite' }} />
          <span className="font-display font-bold text-text tracking-tight text-[15px]">SYSTEM LOGS</span>
          <BlinkingCursor />
        </div>
        <div className="flex items-center gap-1 font-mono text-[9px]">
          {['all', 'info', 'warn', 'error'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-2 py-1 border uppercase transition-colors cursor-pointer ${
                filter === lvl
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-white/5 text-text-dim hover:text-text'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Log stream */}
      <div className="glass rounded-sm p-4 font-mono text-[10px] space-y-1 max-h-[75vh] overflow-y-auto">
        {loading && <p className="text-text-dim animate-blink">LOADING LOGS...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-text-dim/40">[ NO LOGS MATCH FILTER ]</p>
        )}
        {filtered.map((log) => (
          <div key={log.id} className="flex items-start gap-3 py-0.5 border-b border-white/3 last:border-0">
            <span className="text-text-dim/40 shrink-0 tabular-nums">
              {new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className={`shrink-0 uppercase w-8 ${LEVEL_COLOR[log.level] ?? 'text-text'}`}>
              {log.level}
            </span>
            <span className="text-text break-all">{log.message}</span>
          </div>
        ))}
      </div>

      <p className="text-[9px] font-mono text-text-dim/25 text-right">
        REALTIME::FEED · {filtered.length} entries
      </p>
    </div>
  )
}
