import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import {
  formatCurrency, computeCPA, fillDailyGaps, projectMonthEnd,
  computeWoW, getPacingAlert, formatPercent
} from '../lib/mathHelpers'
import TerminalLog from '../components/TerminalLog'
import BlinkingCursor from '../components/BlinkingCursor'

const PACE_STATUS = {
  'on-track':    { color: 'text-success', bar: 'bg-success' },
  overspending:  { color: 'text-danger',  bar: 'bg-danger' },
  underspending: { color: 'text-text-dim', bar: 'bg-text-dim' },
}

// Micro-detail decorative coordinate string
const COORD = '[34.55°S, 58.44°W]'

function Led({ color = 'text-success' }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full bg-current ${color}`} style={{ animation: 'led-pulse 2s ease-in-out infinite' }} />
}

function PaceBar({ pct }) {
  const clamped = Math.min(pct, 100)
  const style = pct > 105 ? PACE_STATUS.overspending : pct < 80 ? PACE_STATUS.underspending : PACE_STATUS['on-track']
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`font-mono text-[10px] ${style.color}`}>{pct}%</span>
    </div>
  )
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-sm px-3 py-2 text-[11px]">
      <p className="text-text-dim font-mono mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className={p.dataKey === 'spend' ? 'text-accent font-mono' : 'text-success font-mono'}>
          {p.dataKey === 'spend' ? formatCurrency(p.value) : `${p.value} leads`}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [clients, setClients]     = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [chartRange, setChartRange] = useState('MTD')   // 'MTD' | 'WoW'

  const today    = new Date()
  const year     = today.getFullYear()
  const month    = today.getMonth() + 1
  const dateFrom = `${year}-${String(month).padStart(2,'0')}-01`
  const dateTo   = today.toISOString().slice(0, 10)

  async function loadData() {
    setLoading(true)
    const [{ data: clientData }, { data: snapData }, { data: logData }] = await Promise.all([
      supabase.from('clients').select('*').eq('is_active', true),
      supabase.from('meta_snapshots').select('client_id, date, spend, leads').gte('date', dateFrom).lte('date', dateTo),
      supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    setClients(clientData ?? [])
    setSnapshots(snapData ?? [])
    setLogs((logData ?? []).reverse().map((l) => ({
      id: l.id, timestamp: new Date(l.created_at).getTime(), level: l.level, message: l.message,
    })))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const ch = supabase.channel('system_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (payload) => {
        const r = payload.new
        setLogs((prev) => [...prev, { id: r.id, timestamp: new Date(r.created_at).getTime(), level: r.level, message: r.message }])
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const totalSpend = snapshots.reduce((s, r) => s + Number(r.spend), 0)
  const totalLeads = snapshots.reduce((s, r) => s + Number(r.leads ?? 0), 0)
  const avgCPL     = computeCPA(totalSpend, totalLeads)

  const dataByDay = {}
  for (const s of snapshots) {
    if (!dataByDay[s.date]) dataByDay[s.date] = { spend: 0, leads: 0 }
    dataByDay[s.date].spend += Number(s.spend)
    dataByDay[s.date].leads += Number(s.leads ?? 0)
  }
  const chartData = fillDailyGaps(
    Object.entries(dataByDay).map(([date, d]) => ({ date, ...d })), today, ['spend','leads']
  ).map((d) => ({ ...d, date: d.date.slice(5) }))

  const clientRows = clients.map((c) => {
    const snaps = snapshots.filter((s) => s.client_id === c.id)
    const spend = snaps.reduce((a, s) => a + Number(s.spend), 0)
    const leads = snaps.reduce((a, s) => a + Number(s.leads ?? 0), 0)
    const pace  = c.monthly_budget ? projectMonthEnd(spend, Number(c.monthly_budget), today) : null
    const pacingAlert = getPacingAlert(pace?.projectedUtilization)
    return { ...c, spend, leads, cpl: computeCPA(spend, leads), pace, pacingAlert }
  })

  // WoW comparison
  const wow = computeWoW(snapshots, 'spend', today)

  // Alerts: clients with pacing issues
  const alerts = clientRows.filter((c) => c.pacingAlert?.level !== 'good' && c.pacingAlert != null)

  const STATS = [
    { label: 'Spend MTD',     value: formatCurrency(totalSpend), sub: 'inversión acumulada', glow: 'glow-accent' },
    { label: 'Leads totales', value: String(totalLeads),          sub: 'contactos generados', glow: '' },
    { label: 'CPL promedio',  value: avgCPL ? formatCurrency(avgCPL) : '—', sub: 'costo por lead', glow: '' },
    { label: 'Clientes activos', value: String(clients.length),   sub: 'cuentas operativas', glow: '' },
  ]

  if (loading) return (
    <div className="flex items-center gap-2 font-mono text-xs text-text-dim pt-10 justify-center">
      <Led /> <span>CARGANDO DATOS</span> <BlinkingCursor />
    </div>
  )

  return (
    <div className="space-y-4 text-sm">

      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Led color="text-success" />
          <span className="font-display font-bold text-text tracking-tight text-[15px]">MÉTRICAS GLOBALES</span>
          <BlinkingCursor />
        </div>
        <div className="ml-auto flex items-center gap-4 text-[9px] text-text-dim font-mono">
          <span className="flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded-sm"><Led color="text-success" /> SYS:ONLINE</span>
          <span className="flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded-sm"><Led color="text-accent" /> META:SYNC</span>
          <span className="flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded-sm"><Led color="text-success" /> WA:ACTIVO</span>
        </div>
      </div>

      {/* Stat cards — asymmetric: 3 igual + 1 destacada */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={s.label} className={`glass hud-corners rounded-sm p-4 relative overflow-hidden ${i === 0 ? 'glow-accent' : ''}`}>
            {/* Decorative coord */}
            <span className="absolute bottom-2 right-2 text-[8px] font-mono text-text-dim/20 select-none">{COORD}</span>
            <p className="text-text-dim text-[10px] font-mono uppercase tracking-widest mb-2">{s.label}</p>
            <p className={`font-display font-bold leading-none mb-1 ${i === 0 ? 'text-2xl text-accent' : 'text-xl text-text'}`}>
              {s.value}
            </p>
            <p className="text-[10px] text-text-dim/50 font-mono">{s.sub}</p>
            {i === 0 && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />}
          </div>
        ))}
      </div>

      {/* Chart + Client table — 2-col asymmetric */}
      <div className="grid grid-cols-5 gap-3">

        {/* Chart — wider */}
        <div className="col-span-3 glass rounded-sm p-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-text tracking-tight text-[13px]">Spend & Leads</p>
              <p className="text-[10px] text-text-dim/60 font-mono">{dateFrom} → {dateTo}</p>
            </div>
            <span className="text-[8px] font-mono text-text-dim/20 select-none">SYS::CHART_V2</span>
          </div>
          {chartData.every((d) => d.spend === 0) ? (
            <div className="h-36 flex items-center justify-center">
              <span className="text-text-dim/40 font-mono text-[11px] animate-blink">[ SIN DATOS — EJECUTAR META SYNC ]</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={148}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3fb950" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7d8590', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="spend" tick={{ fill: '#7d8590', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={44} />
                <YAxis yAxisId="leads" orientation="right" tick={{ fill: '#7d8590', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={<ChartTip />} />
                <Area yAxisId="spend" type="monotone" dataKey="spend" stroke="#F97316" strokeWidth={1.5} fill="url(#sg)" />
                <Area yAxisId="leads" type="monotone" dataKey="leads" stroke="#3fb950" strokeWidth={1.5} fill="url(#lg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Client quick-view — narrower */}
        <div className="col-span-2 glass rounded-sm p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-text tracking-tight text-[13px]">Clientes</p>
            <span className="text-[8px] font-mono text-text-dim/20 select-none">MATRIX_v1</span>
          </div>
          <div className="space-y-2">
            {clientRows.map((c) => {
              const pct = c.pace ? Math.round(c.pace.projectedUtilization) : null
              const st  = c.pace?.status
              return (
                <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <Led color={st === 'on-track' ? 'text-success' : st === 'overspending' ? 'text-danger' : 'text-text-dim'} />
                  <Link to={`/admin/client/${c.id}`} className="flex-1 min-w-0">
                    <p className="text-text font-medium text-[12px] truncate hover:text-accent transition-colors">{c.name}</p>
                    <p className="font-mono text-[10px] text-text-dim">{formatCurrency(c.spend)} · {c.leads} leads</p>
                  </Link>
                  {pct != null && <PaceBar pct={pct} />}
                </div>
              )
            })}
            {clientRows.length === 0 && (
              <p className="text-text-dim/40 font-mono text-[11px] text-center py-6">sin clientes activos</p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="glass rounded-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Led color="text-danger" />
            <p className="font-display font-bold text-text tracking-tight text-[14px]">PACING ALERTS</p>
            <span className="ml-auto text-[8px] font-mono text-text-dim/20">REAL_TIME</span>
          </div>
          <div className="space-y-2">
            {alerts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border border-white/5 px-3 py-2">
                <span className="text-lg">{c.pacingAlert.emoji}</span>
                <div className="flex-1">
                  <p className="font-mono text-[11px] text-text">{c.name.toUpperCase()}</p>
                  <p className="font-mono text-[9px] text-text-dim">
                    Pacing proyectado: {Math.round(c.pace?.projectedUtilization)}% del presupuesto
                  </p>
                </div>
                <span className={`font-mono text-[9px] px-2 py-0.5 border ${
                  c.pacingAlert.level === 'danger'
                    ? 'border-danger/40 text-danger'
                    : 'border-warning/40 text-warning'
                }`}>{c.pacingAlert.label}</span>
                <Link to={`/admin/client/${c.id}`} className="text-accent font-mono text-[9px] hover:underline">[→]</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WoW Badge */}
      {wow.deltaPct != null && (
        <div className="flex items-center gap-2 px-1">
          <span className="font-mono text-[9px] text-text-dim/50">SEMANA ACTUAL VS ANTERIOR:</span>
          <span className={`font-mono text-[10px] font-bold ${
            wow.deltaPct >= 0 ? 'text-success' : 'text-danger'
          }`}>
            {wow.deltaPct >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(wow.deltaPct), 1)} en spend
          </span>
        </div>
      )}

      {/* System log */}
      <div className="glass rounded-sm p-4 relative">
        <div className="flex items-center gap-2 mb-3">
          <Led color="text-accent" />
          <p className="font-medium text-text tracking-tight text-[13px]">Sistema / Actividad</p>
          <span className="ml-auto text-[8px] font-mono text-text-dim/20 select-none">REALTIME::FEED</span>
        </div>
        <TerminalLog entries={logs} />
      </div>

    </div>
  )
}
