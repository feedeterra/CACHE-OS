import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { formatCurrencyAR, getKpiStatus } from '../lib/mathHelpers'
import { RANGE_OPTIONS, resolveRange } from '../lib/dateRanges'
import BlinkingCursor from '../components/BlinkingCursor'
import TrafficLight from '../components/TrafficLight'
import PortalTopAds from '../components/PortalTopAds'
import PortalAudience from '../components/PortalAudience'

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function todayStr() { return new Date().toISOString().slice(0, 10) }

function fmtDate(d) {
  const [, m, day] = d.split('-')
  return `${day} ${MONTHS[parseInt(m) - 1]}`
}

function fmtYAxis(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}K`
  return String(v)
}

const STATUS_COLORS = {
  good:    'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
  neutral: 'text-accent',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, hint, status = 'neutral', big = false }) {
  const topBorder = status === 'good'    ? 'border-t-success'
                  : status === 'warning' ? 'border-t-warning'
                  : status === 'danger'  ? 'border-t-danger'
                  : 'border-t-border/20'
  return (
    <div className={`border border-border/30 border-t-2 ${topBorder} bg-bg-primary/40 p-3 flex flex-col gap-1`}>
      <div className="flex justify-between items-start mb-0.5">
        <p className="text-text-dim font-mono uppercase tracking-widest text-[9px] leading-tight">{label}</p>
        <TrafficLight status={status} size="md" />
      </div>
      <p className={`font-bold font-mono leading-none ${big ? 'text-2xl' : 'text-xl'} ${STATUS_COLORS[status] || 'text-text'}`}>
        {value}
      </p>
      {hint && <p className="text-[9px] text-text-dim/50 font-mono mt-1">{hint}</p>}
    </div>
  )
}

function ExecutiveSummary({ isLeads, totalSpend, totalContacts, cpl, totalSales, totalRevenue, roasReal, cpaReal, todaySpend, goals }) {
  const cpaTargets    = goals.cpa_targets ?? []
  const bestCpaTarget = cpaTargets.length > 0 ? Math.min(...cpaTargets.map((t) => t.target)) : (goals.target_cpa ?? null)
  const cpaStatus     = getKpiStatus(cpaReal, bestCpaTarget, true)
  const cplStatus     = getKpiStatus(cpl, goals.target_cpl, true)

  let narrative = ''
  if (isLeads) {
    const cplStr = cpl ? ` a ${formatCurrencyAR(cpl)} cada uno` : ''
    const contacts = totalContacts || 0
    narrative = contacts > 0
      ? `Invertiste ${formatCurrencyAR(totalSpend)} y generaste ${contacts} contacto${contacts !== 1 ? 's' : ''}${cplStr}.`
      : `Invertiste ${formatCurrencyAR(totalSpend)} en publicidad este periodo.`
    if (totalSales > 0 && cpaReal) {
      narrative += ` Se registraron ${totalSales} venta${totalSales !== 1 ? 's' : ''} a un CPA real de ${formatCurrencyAR(cpaReal)}.`
    }
  } else {
    const revenueStr = totalRevenue > 0 ? ` Facturaste ${formatCurrencyAR(totalRevenue)}.` : ''
    const roasStr    = roasReal ? ` ROAS: ${roasReal.toFixed(2)}x.` : ''
    narrative = totalSales > 0
      ? `Invertiste ${formatCurrencyAR(totalSpend)} y generaste ${totalSales} venta${totalSales !== 1 ? 's' : ''}.${revenueStr}${roasStr}`
      : `Invertiste ${formatCurrencyAR(totalSpend)} en publicidad. Registra tus ventas para ver el retorno.`
  }

  const cards = isLeads
    ? [
        {
          label: 'INVERTIDO',
          value: formatCurrencyAR(totalSpend),
          hint: todaySpend > 0 ? `Hoy: ${formatCurrencyAR(todaySpend)}` : 'total del periodo',
          status: 'neutral',
        },
        {
          label: 'CONTACTOS',
          value: String(totalContacts || 0),
          hint: 'mensajes / leads de Meta',
          status: 'neutral',
        },
        {
          label: 'COSTO / CONTACTO',
          value: cpl ? formatCurrencyAR(cpl) : '—',
          hint: goals.target_cpl ? `objetivo: ${formatCurrencyAR(goals.target_cpl)}` : 'costo por contacto de Meta',
          status: cpl ? cplStatus : 'neutral',
        },
        {
          label: 'CPA REAL',
          value: cpaReal ? formatCurrencyAR(cpaReal) : '—',
          hint: bestCpaTarget
            ? `objetivo: ${formatCurrencyAR(bestCpaTarget)}${totalSales > 0 ? ` · ${totalSales} ventas` : ''}`
            : totalSales > 0 ? `${totalSales} ventas registradas` : 'registra ventas para calcular',
          status: cpaReal ? cpaStatus : 'neutral',
        },
      ]
    : [
        {
          label: 'INVERTIDO',
          value: formatCurrencyAR(totalSpend),
          hint: todaySpend > 0 ? `Hoy: ${formatCurrencyAR(todaySpend)}` : 'total del periodo',
          status: 'neutral',
        },
        {
          label: 'VENTAS',
          value: String(totalSales || 0),
          hint: 'registradas en el periodo',
          status: 'neutral',
        },
        {
          label: 'CPA REAL',
          value: cpaReal ? formatCurrencyAR(cpaReal) : '—',
          hint: bestCpaTarget ? `objetivo: ${formatCurrencyAR(bestCpaTarget)}` : 'costo por venta real',
          status: cpaReal ? cpaStatus : 'neutral',
        },
        {
          label: 'FACTURACION',
          value: totalRevenue > 0 ? formatCurrencyAR(totalRevenue) : '—',
          hint: roasReal ? `ROAS ${roasReal.toFixed(2)}x` : 'ingresa ventas para calcular',
          status: roasReal ? getKpiStatus(roasReal, goals.target_roas || 3, false) : 'neutral',
        },
      ]

  return (
    <div className="border border-accent/20 bg-bg-secondary p-4">
      <p className="text-[11px] text-text font-mono leading-relaxed mb-4">{narrative}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  )
}

function CellInput({ date, category, count, revenue, onSave }) {
  const [val, setVal]       = useState('')
  const [revVal, setRevVal] = useState('')
  const [revRaw, setRevRaw] = useState(0)
  const [status, setStatus] = useState(null)

  function handleRevChange(e) {
    const digits = e.target.value.replace(/\D/g, '')
    const num = digits === '' ? 0 : parseInt(digits, 10)
    setRevRaw(num)
    setRevVal(num > 0 ? new Intl.NumberFormat('es-AR').format(num) : '')
  }

  async function action(multiplier) {
    const n = val === '' ? 0 : parseInt(val)
    const r = revRaw
    if ((isNaN(n) || n === 0) && (isNaN(r) || r === 0)) return
    const newCount = Math.max(0, count + n * multiplier)
    const newRev   = Math.max(0, revenue + r * multiplier)
    if (newCount === count && newRev === revenue) return
    setStatus('saving')
    const result = await onSave(date, newCount, newRev, category)
    if (result?.ok) {
      setVal(''); setRevVal(''); setRevRaw(0)
      setStatus('saved')
      setTimeout(() => setStatus(null), 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="flex gap-1 items-stretch">
      <div className="flex flex-col flex-1 gap-1">
        <div className="relative">
          <input
            type="number" min="0" value={val}
            placeholder="Cantidad de ventas"
            aria-label="Cantidad de ventas del dia"
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && action(1)}
            className="w-full bg-bg-primary border border-white/10 focus:border-accent text-accent font-display font-bold text-lg px-3 py-2 rounded-none focus:outline-none text-center placeholder:text-text-dim/30"
          />
          {count > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-text-dim">
              acum: {count}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text" inputMode="numeric" value={revVal}
            placeholder="Facturacion del dia"
            aria-label="Facturacion del dia en pesos"
            onChange={handleRevChange}
            onKeyDown={(e) => e.key === 'Enter' && action(1)}
            className="w-full bg-bg-primary border border-success/20 focus:border-success text-success font-display font-bold text-base px-3 py-2 rounded-none focus:outline-none text-center placeholder:text-success/20"
          />
          {revenue > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-success/60">
              acum: {formatCurrencyAR(revenue)}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => action(-1)}
        disabled={status === 'saving'}
        title="Corregir / restar"
        className="w-10 font-mono text-sm font-bold shrink-0 bg-bg-secondary text-text-dim border border-white/5 hover:bg-danger/20 hover:text-danger disabled:opacity-40 cursor-pointer"
      >−</button>
      <button
        onClick={() => action(1)}
        disabled={status === 'saving' || (val === '' && revVal === '')}
        className={`w-20 font-mono text-[10px] font-bold uppercase shrink-0 transition-colors cursor-pointer
          ${status === 'saving'  ? 'bg-bg-primary text-text-dim border border-text-dim' :
            status === 'saved'   ? 'bg-success text-bg-primary' :
            status === 'error'   ? 'bg-danger text-bg-primary' :
            (val === '' && revVal === '') ? 'bg-bg-secondary text-text-dim/40 border border-white/10 cursor-default' :
            'bg-accent text-bg-primary hover:bg-accent-soft'}`}
      >
        {status === 'saving' ? '...' : status === 'saved' ? 'OK' : status === 'error' ? 'ERROR' : 'GUARDAR'}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [copied, setCopied]       = useState(false)
  const [rangeKey, setRangeKey]   = useState('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]   = useState('')
  const [registrarOpen, setRegistrarOpen] = useState(false)

  const { from: dateFrom, to: dateTo } = resolveRange(rangeKey, customFrom, customTo)

  async function loadData() {
    setLoading(true)
    const { data: result, error: err } = await supabase.functions.invoke('portal-data', {
      body: { token, dateFrom, dateTo },
    })
    if (err || result?.error) setError('ACCESS_DENIED')
    else setData(result)
    setLoading(false)
  }

  async function handleSave(date, count, revenue, category) {
    const { data: result } = await supabase.functions.invoke('portal-upsert-day', {
      body: { token, date, count, revenue, category },
    })
    if (result?.ok) {
      supabase.functions.invoke('portal-data', { body: { token, dateFrom, dateTo } }).then(({ data: fresh }) => {
        if (fresh && !fresh.error) setData(fresh)
      })
    }
    return result
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  useEffect(() => { loadData() }, [token, dateFrom, dateTo])

  if (loading) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-text-dim pt-10 justify-center">
        CARGANDO <BlinkingCursor />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="border border-danger p-8 font-mono text-center space-y-2">
          <p className="text-danger text-sm font-bold tracking-widest">ACCESO DENEGADO</p>
          <p className="text-text-dim text-[10px]">LINK INVALIDO O CLIENTE INACTIVO</p>
        </div>
      </div>
    )
  }

  const {
    client, totalSpend, todaySpend, totalLeads, totalContacts, cpl,
    totalSales, totalRevenue, roasReal, cpaReal,
    dailySales, categories, productMetrics,
    topAds, demographics, topRegions, chartData: serverChartData,
  } = data

  const today    = todayStr()
  const now      = new Date()
  const cats     = categories?.length > 0 ? categories : ['general']
  const goals    = client.kpi_goals ?? {}
  const isLeads  = client.funnel_type !== 'conversions'

  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysElapsed  = now.getDate()
  const monthPct     = daysElapsed / daysInMonth
  const targetRevenue = goals.target_revenue ?? null
  const targetRoas    = goals.target_roas ?? null
  const revenuePct    = targetRevenue ? Math.min((totalRevenue / targetRevenue) * 100, 100) : null
  const revenueStatus = targetRevenue
    ? getKpiStatus(totalRevenue, targetRevenue * monthPct * 0.85, false)
    : 'neutral'
  const roasStatus    = roasReal ? getKpiStatus(roasReal, targetRoas || 3, false) : 'neutral'
  const cpaTargets    = goals.cpa_targets ?? []
  const bestCpaTarget = cpaTargets.length > 0 ? Math.min(...cpaTargets.map((t) => t.target)) : (goals.target_cpa ?? null)
  const cpaStatus     = getKpiStatus(cpaReal, bestCpaTarget, true)

  // Chart: use serverChartData (full range) with fallback to client-side computation
  const dayMap = {}
  for (const d of dailySales) {
    if (!dayMap[d.date]) dayMap[d.date] = {}
    dayMap[d.date][d.category || 'general'] = { count: Number(d.count), revenue: Number(d.revenue || 0) }
  }
  if (!(today in dayMap)) dayMap[today] = {}
  const registroDays = Object.keys(dayMap).sort((a, b) => b.localeCompare(a)).slice(0, 7)

  const chartDisplayData = serverChartData
    ? serverChartData.map((d) => ({ ...d, date: fmtDate(d.date), isToday: d.date === today }))
    : registroDays.slice().reverse().map((d) => {
        let ventas = 0, facturacion = 0
        for (const c of cats) {
          ventas      += dayMap[d][c]?.count   || 0
          facturacion += dayMap[d][c]?.revenue || 0
        }
        return { date: fmtDate(d), ventas, facturacion, isToday: d === today }
      })

  const hasRevenue   = chartDisplayData.some((d) => d.facturacion > 0)
  const chartInterval = chartDisplayData.length > 14 ? Math.ceil(chartDisplayData.length / 6) : 0

  return (
    <div className="space-y-4 text-xs max-w-2xl mx-auto pb-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 border-b border-border/30 pb-2 flex-wrap">
        <span className="text-accent font-bold font-mono text-sm tracking-widest">
          {client.name.toUpperCase().replace(/ /g, '_')}
        </span>
        <span className="text-text-dim font-mono text-[9px] uppercase">
          {MONTHS[now.getMonth()]} {now.getFullYear()}
        </span>
        <BlinkingCursor />
        <button
          onClick={copyLink}
          className="ml-auto border border-accent/30 text-accent/70 hover:text-accent hover:border-accent font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 cursor-pointer transition-colors"
        >
          {copied ? 'COPIADO' : 'COPIAR LINK'}
        </button>
      </div>

      {/* ── Selector de periodo ── */}
      <div className="flex flex-wrap gap-1.5">
        {RANGE_OPTIONS.filter(o => o.key !== 'custom').map((o) => (
          <button
            key={o.key}
            onClick={() => { setRangeKey(o.key) }}
            className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border transition-colors cursor-pointer ${
              rangeKey === o.key
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border/30 text-text-dim hover:text-text'
            }`}
          >
            {o.label}
          </button>
        ))}
        <button
          onClick={() => { setRangeKey('custom') }}
          className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1.5 border transition-colors cursor-pointer ${
            rangeKey === 'custom'
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border/30 text-text-dim hover:text-text'
          }`}
        >
          Personalizado
        </button>
        {rangeKey === 'custom' && (
          <div className="flex items-center gap-1 w-full mt-1">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="flex-1 bg-bg-primary border border-border/40 text-text font-mono text-[9px] px-2 py-1.5 focus:outline-none focus:border-accent" />
            <span className="text-text-dim font-mono text-[9px]">-</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="flex-1 bg-bg-primary border border-border/40 text-text font-mono text-[9px] px-2 py-1.5 focus:outline-none focus:border-accent" />
          </div>
        )}
      </div>

      {/* ── Resumen ejecutivo ── */}
      <ExecutiveSummary
        isLeads={isLeads}
        totalSpend={totalSpend}
        todaySpend={todaySpend}
        totalLeads={totalLeads}
        totalContacts={totalContacts ?? totalLeads}
        cpl={cpl ?? (totalLeads > 0 ? totalSpend / totalLeads : null)}
        totalSales={totalSales}
        totalRevenue={totalRevenue}
        roasReal={roasReal}
        cpaReal={cpaReal}
        goals={goals}
      />

      {/* ── Progreso hacia objetivo de facturacion ── */}
      {targetRevenue != null && (
        <div className="border border-border/20 bg-bg-secondary p-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">
              PROGRESO HACIA OBJETIVO
            </span>
            <span className={`text-[10px] font-mono font-bold ${STATUS_COLORS[revenueStatus]}`}>
              {revenuePct != null ? `${revenuePct.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className="h-2 bg-bg-primary border border-border/20 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                revenueStatus === 'good' ? 'bg-success' : revenueStatus === 'warning' ? 'bg-warning' : 'bg-danger'
              }`}
              style={{ width: `${Math.min(revenuePct ?? 0, 100)}%` }}
            />
          </div>
          <p className="text-[8px] text-text-dim/50 font-mono mt-1">
            {formatCurrencyAR(totalRevenue)} de {formatCurrencyAR(targetRevenue)} — vas {revenuePct != null && revenuePct >= monthPct * 100 ? 'adelante' : 'detras'} del ritmo esperado
          </p>
        </div>
      )}

      {/* ── Evolucion del periodo ── */}
      <div className="border border-border/20 bg-bg-secondary p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest">
            EVOLUCION DEL PERIODO
          </p>
          {hasRevenue && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[8px] font-mono text-accent/70">
                <span className="inline-block w-2.5 h-2.5 bg-accent/60" />{isLeads ? 'CONTACTOS' : 'VENTAS'}
              </span>
              <span className="flex items-center gap-1 text-[8px] font-mono text-success/70">
                <span className="inline-block w-5 h-0.5 bg-success" />FACTURACION
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={chartDisplayData} margin={{ top: 4, right: hasRevenue ? 48 : 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }}
              tickLine={false} axisLine={false}
              interval={chartInterval}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }}
              tickLine={false} axisLine={false}
              tickCount={4}
            />
            {hasRevenue && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={fmtYAxis}
                tick={{ fill: '#22c55e', fontSize: 8, fontFamily: 'Space Mono' }}
                tickLine={false} axisLine={false}
                tickCount={4}
              />
            )}
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-bg-primary border border-border/50 p-2 space-y-0.5">
                    <p className="text-text-dim font-mono text-[9px] uppercase mb-1">{label}</p>
                    {payload.map((p) => (
                      <p key={p.dataKey} className="font-mono text-xs font-bold" style={{ color: p.color }}>
                        {p.dataKey === 'ventas'
                          ? `${p.value} ${isLeads ? 'contactos' : 'ventas'}`
                          : formatCurrencyAR(p.value)}
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            <Bar yAxisId="left" dataKey="ventas" radius={[2, 2, 0, 0]} maxBarSize={36}>
              {chartDisplayData.map((d, i) => (
                <Cell key={i} fill="#F97316" fillOpacity={d.isToday ? 1 : 0.45} />
              ))}
            </Bar>
            {hasRevenue && (
              <Line
                yAxisId="right"
                dataKey="facturacion"
                type="monotone"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 2, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Anuncios que mejor funcionan ── */}
      {topAds?.length > 0 && (
        <PortalTopAds ads={topAds} isLeads={isLeads} goals={goals} />
      )}

      {/* ── Audiencia ── */}
      {(demographics?.byAge?.length > 0 || demographics?.byGender?.length > 0 || topRegions?.length > 0) && (
        <PortalAudience demographics={demographics} topRegions={topRegions} isLeads={isLeads} />
      )}

      {/* ── ROAS (solo cuando hay revenue) ── */}
      {totalRevenue > 0 && (
        <div className={`border p-4 ${
          roasStatus === 'good'    ? 'border-success/40 bg-success/5' :
          roasStatus === 'warning' ? 'border-warning/40 bg-warning/5' :
                                     'border-danger/40 bg-danger/5'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">
              RETORNO DE INVERSION (ROAS)
            </p>
            <span className={`text-[9px] font-mono uppercase ${STATUS_COLORS[roasStatus]}`}>
              {roasStatus === 'good' ? 'BUENO' : roasStatus === 'warning' ? 'REGULAR' : 'A MEJORAR'}
            </span>
          </div>
          <p className={`font-bold font-mono text-3xl leading-none mb-1 ${STATUS_COLORS[roasStatus]}`}>
            {roasReal ? `${roasReal.toFixed(2)}x` : '—'}
          </p>
          <p className="text-[9px] text-text-dim font-mono">
            {roasReal
              ? `Por cada $1 invertido en publicidad, generaste $${roasReal.toFixed(2)} en ventas.`
              : 'Completa la facturacion para calcular el retorno.'
            }
            {targetRoas && roasReal && ` Objetivo: ${targetRoas}x.`}
          </p>
        </div>
      )}

      {/* ── Desglose por producto ── */}
      {productMetrics?.length > 0 && (
        <div className="border border-border/20 bg-bg-secondary p-4">
          <p className="text-[9px] text-text-dim/60 font-mono uppercase tracking-widest mb-3">
            INVERSION Y CPA POR PRODUCTO
          </p>
          <div className="space-y-2">
            {productMetrics.map((product, i) => (
              <div key={i} className="border border-border/30 bg-bg-primary/40 p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-mono font-bold text-accent uppercase">{product.name}</p>
                  <p className={`text-[9px] font-mono ${product.cpa && product.target && product.cpa <= product.target ? 'text-success' : product.cpa && product.target && product.cpa > product.target ? 'text-danger' : 'text-text-dim'}`}>
                    {product.cpa ? formatCurrencyAR(product.cpa) : '—'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[8px] font-mono">
                  <div>
                    <p className="text-text-dim/60 mb-0.5">INVERTIDO</p>
                    <p className="text-accent font-bold">{formatCurrencyAR(product.spend)}</p>
                  </div>
                  <div>
                    <p className="text-text-dim/60 mb-0.5">VENTAS</p>
                    <p className="text-text font-bold">{product.sales}</p>
                  </div>
                  <div>
                    <p className="text-text-dim/60 mb-0.5">TARGET CPA</p>
                    <p className="text-text-dim font-bold">{formatCurrencyAR(product.target)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CPA por categoria (solo si hay mas de una) ── */}
      {cats.length > 1 && totalSales > 0 && (
        <div className="border border-border/20 bg-bg-secondary p-4">
          <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-1">
            COSTO POR VENTA — POR CATEGORIA
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {cats.map((cat) => {
              const catSales = dailySales
                .filter((d) => (d.category || 'general') === cat)
                .reduce((s, d) => s + Number(d.count), 0)
              const catCpa = catSales > 0 && totalSpend > 0
                ? (totalSpend * (catSales / totalSales)) / catSales
                : null
              return (
                <div key={cat} className="border border-border/30 bg-bg-primary/40 p-3">
                  <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest mb-0.5">
                    {cat === 'general' ? 'GENERAL' : cat.toUpperCase()}
                  </p>
                  <p className="font-bold font-mono text-lg text-accent">
                    {catCpa ? formatCurrencyAR(catCpa) : '—'}
                  </p>
                  <p className="text-[8px] text-text-dim/60 font-mono">{catSales} ventas</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Registrar ventas — colapsable ── */}
      <div className="border border-border/20 bg-bg-secondary">
        <button
          onClick={() => setRegistrarOpen(!registrarOpen)}
          className="w-full p-4 text-left flex items-center justify-between cursor-pointer hover:bg-border/5 transition-colors"
        >
          <div>
            <p className="text-[10px] text-accent font-mono uppercase tracking-widest">
              {registrarOpen ? '▼' : '▶'} REGISTRAR VENTAS DEL DIA
            </p>
            <p className="text-[9px] text-text-dim/60 font-mono mt-0.5">
              Ingresa la cantidad de ventas y facturacion de cada dia
            </p>
          </div>
          <span className={`font-mono text-[9px] ${registrarOpen ? 'text-accent' : 'text-text-dim/40'}`}>
            {registrarOpen ? 'CERRAR' : 'ABRIR'}
          </span>
        </button>

        {registrarOpen && (
          <div className="px-4 pb-4 border-t border-border/20">
            <div className="space-y-3 mt-4">
              {registroDays.map((date) => (
                <div
                  key={date}
                  className={`p-3 border ${date === today ? 'border-accent/60 bg-accent/5' : 'border-white/5 bg-bg-primary/30'}`}
                >
                  <p className={`font-mono text-[10px] tracking-widest uppercase mb-2 ${date === today ? 'text-accent font-bold' : 'text-text-dim'}`}>
                    {fmtDate(date)}{date === today ? ' — HOY' : ''}
                  </p>
                  {cats.map((cat) => (
                    <div key={cat}>
                      {cats.length > 1 && (
                        <p className="text-[9px] font-mono text-text-dim mb-1">
                          {cat === 'general' ? 'GENERAL' : cat.toUpperCase()}
                        </p>
                      )}
                      <CellInput
                        date={date}
                        category={cat}
                        count={dayMap[date]?.[cat]?.count ?? 0}
                        revenue={dayMap[date]?.[cat]?.revenue ?? 0}
                        onSave={handleSave}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-2">
        <p className="text-[8px] text-text-dim/20 font-mono uppercase tracking-widest">
          CACHE AGENCY // PORTAL DE RENDIMIENTO
        </p>
      </div>
    </div>
  )
}
