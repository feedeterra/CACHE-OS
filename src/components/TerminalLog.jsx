import { useEffect, useRef } from 'react'
import BlinkingCursor from './BlinkingCursor'

const LEVEL_COLORS = {
  info: 'text-text',
  warn: 'text-warning',
  error: 'text-danger',
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour12: false })
}

function formatMessage(msg, level) {
  if (msg.includes('WhatsApp:')) {
    return (
      <span className="text-success flex gap-2">
        <span className="w-4 text-center">💬</span>
        <span className="text-success/90">{msg.replace('WhatsApp:', '')}</span>
      </span>
    )
  }
  if (msg.includes('Portal:')) {
    return (
      <span className="text-accent flex gap-2">
        <span className="w-4 text-center">🧑‍💻</span>
        <span className="text-accent/90">{msg.replace('Portal:', '')}</span>
      </span>
    )
  }
  if (msg.includes('Meta sync OK:')) {
    const parts = msg.replace('Meta sync OK:', '').split('—')
    return (
      <span className="text-text-dim flex gap-2">
        <span className="w-4 text-center text-accent/50">🔄</span>
        <span className="flex-1">
          <span className="font-bold text-text/80">{parts[0]}</span>—
          <span className="text-text-dim/60 text-[9px]">{parts[1]}</span>
        </span>
      </span>
    )
  }
  return (
    <span className={`${LEVEL_COLORS[level] ?? 'text-text'} flex gap-2`}>
      <span className="w-4 text-center">{level === 'error' ? '🚨' : level === 'warn' ? '⚠️' : '>_'}</span>
      <span>{msg}</span>
    </span>
  )
}

export default function TerminalLog({ entries = [] }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div className="h-64 overflow-y-auto bg-bg-primary p-3 font-mono text-[11px] leading-relaxed shadow-inner border border-white/5">
      {entries.map((entry, i) => (
        <div key={entry.id ?? i} className="flex gap-3 py-1 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
          <span className="text-text-dim/40 shrink-0 w-16">
            {formatTime(entry.timestamp)}
          </span>
          <div className="flex-1">
            {formatMessage(entry.message, entry.level)}
          </div>
        </div>
      ))}
      <div className="mt-2 pl-19">
        <BlinkingCursor />
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
