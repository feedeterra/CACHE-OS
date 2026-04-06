import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { formatCurrencyAR, getKpiStatus } from '../lib/mathHelpers'
import { RANGE_OPTIONS, resolveRange } from '../lib/dateRanges'
import BlinkingCursor from '../components/BlinkingCursor'

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

function StatCard({ label, value, hint, status = 'neutral', big = false }) {
  return (
    <div className="border border-border/40 bg-bg-secondary p-3 flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <p className="text-text-dim font-mono uppercase tracking-widest text-[9px]">{label}</p>
        {status !== 'neutral' && (
          <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
            status === 'good' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'
          }`} />
        )}
      </div>
      <p className={`font-bold font-mono leading-none ${big ? 'text-2xl' : 'text-xl'} ${STATUS_COLORS[status] || 'text-text'}`}>
        {value}
      </p>
      {hint && <p className="text-[8px] text-text-dim/50 font-mono mt-0.5">{hint}</p>}
    </div>
  )
}

function CellInput({ date, category, count, revenue, onSave }) {
  const [val, setVal]       = useState('')
  const [revVal, setRevVal] = useState('')
  const [revRaw, setRevRaw] = useState(0) // valor numérico real
  const [status, setStatus] = useState(null)

  function handleRevChange(e) {
    // Eliminar todo lo que no sea dígito
    const digits = e.target.value.replace(/\D/g, '')
    const num = digits === '' ? 0 : parseInt(digits, 10)
    setRevRaw(num)
    // Formatear con puntos como separador de miles
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
      setVal('')
      setRevVal('')
      setRevRaw(0)
      setStatus('saved')
      setTimeout(() => setStatus(null), 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="flex gap-1 items-stretch">
      <div className="flex flex-col flex-1 gap-1">
        {/* Ventas */}
        <div className="relative">
          <input
            type="number" min="0" value={val}
            placeholder="Cantidad de ventas"
            aria-label="Cantidad de ventas del día"
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
        {/* Facturación */}
        <div className="relative">
          <input
            type="text" inputMode="numeric" value={revVal}
            placeholder="Facturación del día"
            aria-label="Facturación del día en pesos"
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

      {/* Restar */}
      <button
        onClick={() => action(-1)}
        disabled={status === 'saving'}
        title="Corregir / restar"
        className="w-10 font-mono text-sm font-bold shrink-0 bg-bg-secondary text-text-dim border border-white/5 hover:bg-danger/20 hover:text-danger disabled:opacity-40 cursor-pointer"
      >−</button>

      {/* Guardar */}
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
        {status === 'saving' ? '...' : status === 'saved' ? '✓ OK' : status === 'error' ? 'ERROR' : 'GUARDAR'}
      </button>
    </div>
  )
}

export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [copied, setCopied]   = useState(false)
  const [rangeKey, setRangeKey]     = useState('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')

  const { from: dateFrom, to: dateTo } = resolveRange(rangeKey, customFrom, customTo)

  async function loadData() {
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
          <p className="text-text-dim text-[10px]">LINK INVÁLIDO O CLIENTE INACTIVO</p>
        </div>
      </div>
    )
  }

  const {
    client, totalSpend, todaySpend, totalLeads,
    totalSales, totalRevenue, roasReal, cpaReal,
    dailySales, categories,
  } = data

  const today = todayStr()
  const cats  = categories?.length > 0 ? categories : ['general']
  const goals = client.kpi_goals ?? {}

  // --- Pacing hacia objetivo de facturación ---
  const now         = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate()
  const monthPct    = daysElapsed / daysInMonth
  const targetRevenue  = goals.target_revenue ?? null
  const targetRoas     = goals.target_roas ?? null
  const revenuePct     = targetRevenue ? Math.min((totalRevenue / targetRevenue) * 100, 100) : null
  const revenueStatus  = targetRevenue
    ? getKpiStatus(totalRevenue, targetRevenue * monthPct * 0.85, false)
    : 'neutral'

  // --- ROAS status ---
  const roasStatus = roasReal
    ? getKpiStatus(roasReal, targetRoas || 3, false)
    : 'neutral'

  // --- CPA status ---
  const cpaTargets   = goals.cpa_targets ?? []
  const bestCpaTarget = cpaTargets.length > 0 ? Math.min(...cpaTargets.map((t) => t.target)) : (goals.target_cpa ?? null)
  const cpaStatus    = getKpiStatus(cpaReal, bestCpaTarget, true)

  // --- Day map ---
  const dayMap = {}
  for (const d of dailySales) {
    if (!dayMap[d.date]) dayMap[d.date] = {}
    dayMap[d.date][d.category || 'general'] = { count: Number(d.count), revenue: Number(d.revenue || 0) }
  }
  if (!(today in dayMap)) dayMap[today] = {}
  const days = Object.keys(dayMap).sort((a, b) => b.localeCompare(a)).slice(0, 7)

  // --- Chart data ---
  const chartData = [...days].reverse().map((d) => {
    let ventas = 0, facturacion = 0
    for (const c of cats) {
      ventas      += dayMap[d][c]?.count   || 0
      facturacion += dayMap[d][c]?.revenue || 0
    }
    return { date: fmtDate(d), ventas, facturacion, isToday: d === today }
  })
  const hasRevenue = chartData.some((d) => d.facturacion > 0)

  return (
    <div className="space-y-3 text-xs max-w-2xl mx-auto pb-8">

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
          {copied ? '✓ COPIADO' : '⎘ COPIAR LINK'}
        </button>
      </div>

      {/* ── Selector de período ── */}
      <div className="flex flex-wrap gap-1.5">
        {RANGE_OPTIONS.filter(o => o.key !== 'custom').map((o) => (
          <button
            key={o.key}
            onClick={() => { setRangeKey(o.key); setLoading(true) }}
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
          onClick={() => { setRangeKey('custom'); setLoading(true) }}
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
            <span className="text-text-dim font-mono text-[9px]">→</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="flex-1 bg-bg-primary border border-border/40 text-text font-mono text-[9px] px-2 py-1.5 focus:outline-none focus:border-accent" />
          </div>
        )}
      </div>

      {/* ── Sección 1: Inversión publicitaria ── */}
      <div>
        <p className="text-[9px] text-text-dim/60 font-mono uppercase tracking-widest mb-2">
          INVERSIÓN PUBLICITARIA
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="HOY"
            value={todaySpend > 0 ? formatCurrencyAR(todaySpend) : '—'}
            hint="Lo que se invirtió hoy en publicidad"
            status="neutral"
          />
          <StatCard
            label="ACUMULADO DEL MES"
            value={formatCurrencyAR(totalSpend)}
            hint={`${daysElapsed} de ${daysInMonth} días transcurridos`}
            status="neutral"
            big
          />
        </div>

        {/* Desglose por Producto */}
        {data?.productMetrics?.length > 0 && (
          <div className="border border-border/20 bg-bg-secondary p-4 mt-2">
            <p className="text-[9px] text-text-dim/60 font-mono uppercase tracking-widest mb-3">
              INVERSIÓN Y CPA — POR PRODUCTO
            </p>
            <div className="space-y-2">
              {data.productMetrics.map((product, i) => (
                <div key={i} className="border border-border/30 bg-bg-primary/40 p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-mono font-bold text-accent uppercase">
                      {product.name}
                    </p>
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
      </div>

      {/* ── Sección 2: Resultados de ventas ── */}
      <div>
        <p className="text-[9px] text-text-dim/60 font-mono uppercase tracking-widest mb-2">
          TUS VENTAS DEL MES
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="CANTIDAD DE VENTAS"
            value={totalSales > 0 ? String(totalSales) : '0'}
            hint={cpaReal ? `Costo por venta: ${formatCurrencyAR(cpaReal)}` : 'Sin ventas registradas'}
            status={totalSales > 0 ? cpaStatus : 'neutral'}
            big
          />
          <StatCard
            label="FACTURACIÓN TOTAL"
            value={totalRevenue > 0 ? formatCurrencyAR(totalRevenue) : '—'}
            hint={targetRevenue ? `Objetivo: ${formatCurrencyAR(targetRevenue)}` : 'Ingresá el monto por día'}
            status={revenueStatus}
            big
          />
        </div>

        {/* Barra de progreso hacia objetivo de facturación */}
        {targetRevenue != null && (
          <div className="mt-2 border border-border/30 bg-bg-secondary p-3">
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
                  revenueStatus === 'good' ? 'bg-success' :
                  revenueStatus === 'warning' ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${Math.min(revenuePct ?? 0, 100)}%` }}
              />
            </div>
            <p className="text-[8px] text-text-dim/50 font-mono mt-1">
              {formatCurrencyAR(totalRevenue)} de {formatCurrencyAR(targetRevenue)} · vas {revenuePct != null && revenuePct >= monthPct * 100 ? 'adelante' : 'detrás'} del ritmo esperado
            </p>
          </div>
        )}
      </div>

      {/* ── Sección 3: ROAS (solo cuando hay revenue) ── */}
      {totalRevenue > 0 && (
        <div className={`border p-4 ${
          roasStatus === 'good'    ? 'border-success/40 bg-success/5' :
          roasStatus === 'warning' ? 'border-warning/40 bg-warning/5' :
                                     'border-danger/40 bg-danger/5'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">
              RETORNO DE INVERSIÓN (ROAS)
            </p>
            <span className={`text-[9px] font-mono uppercase ${STATUS_COLORS[roasStatus]}`}>
              {roasStatus === 'good' ? '▲ BUENO' : roasStatus === 'warning' ? '◆ REGULAR' : '▼ A MEJORAR'}
            </span>
          </div>
          <p className={`font-bold font-mono text-3xl leading-none mb-1 ${STATUS_COLORS[roasStatus]}`}>
            {roasReal ? `${roasReal.toFixed(2)}x` : '—'}
          </p>
          <p className="text-[9px] text-text-dim font-mono">
            {roasReal
              ? `Por cada $1 invertido en publicidad, generás $${roasReal.toFixed(2)} en ventas.`
              : 'Completá la facturación para calcular el retorno.'
            }
            {targetRoas && roasReal && ` Objetivo: ${targetRoas}x.`}
          </p>
        </div>
      )}

      {/* ── Sección 4: Gráfico de evolución ── */}
      <div className="border border-border/20 bg-bg-secondary p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest">
            EVOLUCIÓN — ÚLTIMOS 7 DÍAS
          </p>
          {hasRevenue && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[8px] font-mono text-accent/70">
                <span className="inline-block w-2.5 h-2.5 bg-accent/60" />VENTAS
              </span>
              <span className="flex items-center gap-1 text-[8px] font-mono text-success/70">
                <span className="inline-block w-5 h-0.5 bg-success" />FACTURACIÓN
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={chartData} margin={{ top: 4, right: hasRevenue ? 48 : 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }}
              tickLine={false} axisLine={false}
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
                          ? `${p.value} ventas`
                          : formatCurrencyAR(p.value)}
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            <Bar yAxisId="left" dataKey="ventas" radius={[2, 2, 0, 0]} maxBarSize={36}>
              {chartData.map((d, i) => (
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
                dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Sección 5: Registro diario ── */}
      <div className="border border-border/20 bg-bg-secondary p-4">
        <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-1">
          REGISTRAR VENTAS
        </p>
        <p className="text-[9px] text-text-dim/60 font-mono mb-4">
          Ingresá las ventas del día y la facturación total de ese día. Podés corregir con el botón −.
        </p>
        <div className="space-y-3">
          {days.map((date) => (
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

      {/* CPA por categoría (solo si hay más de una) */}
      {cats.length > 1 && totalSales > 0 && (
        <div className="border border-border/20 bg-bg-secondary p-4">
          <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-1">
            COSTO POR VENTA — POR CATEGORÍA
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

      <div className="text-center py-2">
        <p className="text-[8px] text-text-dim/20 font-mono uppercase tracking-widest">
          CACHE AGENCY // PORTAL DE RENDIMIENTO
        </p>
      </div>
    </div>
  )
}
