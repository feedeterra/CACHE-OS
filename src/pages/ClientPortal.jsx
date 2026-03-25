import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, getKpiStatus } from '../lib/mathHelpers'
import BlinkingCursor from '../components/BlinkingCursor'

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function todayStr() { return new Date().toISOString().slice(0, 10) }

function fmtDate(d) {
  const [, m, day] = d.split('-')
  return `${day} ${MONTHS[parseInt(m) - 1]}`
}

function CellInput({ date, category, count, revenue, isToday, isConversions, onSave }) {
  const [val, setVal] = useState('')
  const [revVal, setRevVal] = useState('')
  const [status, setStatus] = useState(null)

  async function action(multiplier) {
    const n = val === '' ? 0 : parseInt(val)
    const r = revVal === '' ? 0 : parseFloat(revVal)
    if ((isNaN(n) || n === 0) && (isNaN(r) || r === 0)) return
    const newCount = Math.max(0, count + (n * multiplier))
    const newRev = Math.max(0, revenue + (r * multiplier))
    if (newCount === count && newRev === revenue) return // no change
    setStatus('saving')
    const result = await onSave(date, newCount, newRev, category)
    if (result?.ok) {
      setVal('')
      setRevVal('')
      setStatus('saved')
      setTimeout(() => setStatus(null), 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <div className="flex gap-1 items-stretch">
        <div className="flex flex-col flex-1 gap-1">
          <div className="relative">
            <input
              type="number" min="0" value={val}
              placeholder="Ventas (0)"
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && action(1)}
              className="w-full bg-bg-primary border border-white/10 focus:border-accent text-accent font-display font-bold text-lg px-2 py-2 rounded-none focus:outline-none text-center placeholder:text-text-dim/30"
            />
            {count > 0 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-text-dim">Acum: {count}</span>}
          </div>
          {isConversions && (
            <div className="relative">
              <input
                type="number" min="0" value={revVal}
                placeholder="Ingresos ($0)"
                onChange={(e) => setRevVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && action(1)}
                className="w-full bg-bg-primary border border-success/20 focus:border-success text-success font-display font-bold text-lg px-2 py-2 rounded-none focus:outline-none text-center placeholder:text-success/30"
              />
              {revenue > 0 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-success/60">Acum: ${revenue}</span>}
            </div>
          )}
        </div>
        
        {/* Undo / Subtract Button */}
        <button
          onClick={() => action(-1)}
          disabled={status === 'saving'}
          className="px-2 w-10 font-mono text-xs font-bold transition-colors shrink-0 bg-bg-secondary text-text-dim border border-white/5 hover:bg-danger/20 hover:text-danger disabled:opacity-50 disabled:cursor-not-allowed"
          title="Descontar valores ingresados por error"
        >
          -
        </button>

        {/* Add / Save Button */}
        <button
          onClick={() => action(1)}
          disabled={status === 'saving' || (val === '' && revVal === '')}
          className={`px-2 w-16 font-mono text-xs font-bold uppercase transition-colors shrink-0
            ${status === 'saving' ? 'bg-bg-primary text-text-dim border border-text-dim' :
              status === 'saved'  ? 'bg-success text-bg-primary cursor-default' :
              status === 'error'  ? 'bg-danger text-bg-primary cursor-pointer' :
              (val === '' && revVal === '') ? 'bg-bg-secondary text-text-dim border border-white/10 cursor-default' :
              'bg-accent text-bg-primary hover:bg-accent-soft cursor-pointer'}
          `}
        >
          {status === 'saving' ? '...' : status === 'saved' ? '✓' : status === 'error' ? 'ERR' : '+ SUM'}
        </button>
      </div>
      {(count === 0 && revenue === 0) && !isToday && <span className="text-[9px] text-text-dim/50 font-mono pl-1">Sin datos de hoy</span>}
    </div>
  )
}

export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  async function loadData() {
    const { data: result, error: err } = await supabase.functions.invoke('portal-data', {
      body: { token },
    })
    if (err || result?.error) {
      setError('ACCESS_DENIED')
    } else {
      setData(result)
    }
    setLoading(false)
  }

  async function handleSave(date, count, revenue, category) {
    const { data: result } = await supabase.functions.invoke('portal-upsert-day', {
      body: { token, date, count, revenue, category },
    })
    if (result?.ok) {
      supabase.functions.invoke('portal-data', { body: { token } }).then(({ data: fresh }) => {
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

  useEffect(() => { loadData() }, [token])

  if (loading) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-text-dim pt-10 justify-center">
        AUTENTICANDO <BlinkingCursor />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="border border-danger p-8 font-mono text-center space-y-2">
          <p className="text-danger text-sm font-bold tracking-widest">ACCESS_DENIED</p>
          <p className="text-text-dim text-[10px]">TOKEN INVÁLIDO O CLIENTE INACTIVO</p>
        </div>
      </div>
    )
  }

  const { client, totalSpend, totalLeads, totalSales, totalRevenue, roasReal, cpaReal, dailySales, categories } = data
  const today = todayStr()
  const cats = categories && categories.length > 0 ? categories : ['general']
  const isEcommerce = client.funnel_type === 'conversions'

  // Build day map grouped by date, with each category
  const dayMap = {}
  for (const d of dailySales) {
    if (!dayMap[d.date]) dayMap[d.date] = {}
    dayMap[d.date][d.category || 'general'] = { count: d.count, revenue: d.revenue || 0 }
  }
  if (!(today in dayMap)) dayMap[today] = {}
  const days = Object.keys(dayMap).sort((a, b) => b.localeCompare(a)).slice(0, 7) // Sólo la última semana

  // Prepare chart data (chronological order)
  const chartData = [...days].reverse().map(d => {
    let sum = 0;
    for (const c of cats) sum += (dayMap[d][c]?.count || 0)
    return { date: fmtDate(d), sales: sum, isToday: d === today }
  })

  // Growth indicator
  const salesThisMonth = totalSales
  const spendFormatted = formatCurrency(totalSpend)
  const cpaFormatted = cpaReal ? formatCurrency(cpaReal) : null
  const revenueFormatted = isEcommerce ? formatCurrency(totalRevenue) : null

  // KPI Targets
  const goals = client.kpi_goals ?? {}
  const targetLeads = goals.target_leads ?? null
  const targetCpa = goals.target_cpa ?? null
  const cpaTargets = goals.cpa_targets ?? []
  const bestCpaTarget = cpaTargets.length > 0 ? Math.min(...cpaTargets.map((t) => t.target)) : targetCpa
  const cpaStatus = getKpiStatus(cpaReal, bestCpaTarget, true)
  
  // Status Colors
  const STATUS_COLORS = {
    good: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    neutral: 'text-accent'
  }

  return (
    <div className="space-y-3 text-xs max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 pb-2 flex-wrap">
        <span className="text-text-dim font-mono text-[9px] uppercase tracking-widest">PORTAL</span>
        <span className="text-accent font-bold font-mono text-sm tracking-widest">
          {client.name.toUpperCase().replace(/ /g, '_')}
        </span>
        <BlinkingCursor />
        <button
          onClick={copyLink}
          className="ml-auto border border-accent/50 text-accent hover:bg-accent/10 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 cursor-pointer transition-colors"
        >
          {copied ? '[✓ COPIADO]' : '[⎘ COPIAR LINK]'}
        </button>
      </div>

      {/* Welcome message */}
      <div className="border border-success/30 bg-success/5 p-3">
        <p className="text-success font-mono text-[10px] uppercase tracking-widest mb-1">
          // RESUMEN DEL MES
        </p>
        <p className="text-text font-mono text-[11px] leading-relaxed">
          {salesThisMonth > 0
            ? `¡Excelente! Llevas ${salesThisMonth} venta${salesThisMonth > 1 ? 's' : ''} registrada${salesThisMonth > 1 ? 's' : ''} este mes. ${isEcommerce && totalRevenue > 0 ? `Tus ingresos reportados son de ${revenueFormatted}. ` : ''}`
            : 'Registra tus ventas diarias aquí para hacer seguimiento del rendimiento. '
          }
          {cpaFormatted && `Tu costo por adquisición real es de ${cpaFormatted}. `}
          {totalSpend > 0 && `Inversión publicitaria acumulada: ${spendFormatted}.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            label: 'INVERSIÓN', value: spendFormatted, status: 'neutral',
            hint: 'Inversión publicitaria este mes',
          },
          {
            label: 'VENTAS', value: String(totalSales), status: cpaStatus,
            hint: 'Total de ventas en el mes',
          },
          {
            label: 'COSTO X VENTA', value: cpaFormatted ?? '—', status: cpaStatus,
            hint: 'Costo por adquisición (real)',
          },
          isEcommerce
            ? {
                label: 'ROAS', value: roasReal ? `${roasReal.toFixed(2)}x` : '—', status: getKpiStatus(roasReal, goals.target_roas || 3, false),
                hint: 'Retorno de Inversión (Calculado)',
              }
            : {
                label: 'CONTACTOS', value: String(totalLeads), status: getKpiStatus(totalLeads, targetLeads, false),
                hint: 'Personas que contactaron por ads',
              },
        ].map((s) => (
          <div key={s.label} className="border border-border/40 bg-bg-secondary p-3">
            <div className="flex justify-between items-start mb-1">
              <p className="text-text-dim font-mono uppercase tracking-widest text-[9px]">{s.label}</p>
              {s.status !== 'neutral' && (
                <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'good' ? 'bg-success' : s.status === 'warning' ? 'bg-warning' : 'bg-danger'}`} />
              )}
            </div>
            <p className={`font-bold font-mono text-xl leading-none ${STATUS_COLORS[s.status] || 'text-text'}`}>{s.value}</p>
            <p className="text-[8px] text-text-dim/60 font-mono mt-1.5">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Evolution Chart */}
      <div className="glass hud-corners p-4 mt-2 mb-2">
        <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest mb-3">
          // TENDENCIA 7 DÍAS
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} tickCount={3} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-bg-primary border border-border/40 p-2">
                    <p className="text-accent font-bold font-mono text-sm">{payload[0].value} ventas</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="sales" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {chartData.map((d, i) => (
                <Cell key={`cell-${i}`} fill={d.isToday ? '#F97316' : '#F97316'} fillOpacity={d.isToday ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily sales list */}
      <div className="glass hud-corners p-4">
        <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-1">
          // REGISTRO DE VENTAS (ÚLTIMOS 7 DÍAS)
        </p>
        <p className="text-[9px] text-text-dim/60 font-mono mb-4">
          Ingresa tus ventas del día y presiona Guardar.
        </p>
        <div className="space-y-3">
          {days.map((date) => (
            <div key={date} className={`p-3 border flex flex-col gap-2 ${date === today ? 'border-accent bg-accent/5' : 'border-white/5 bg-bg-primary/40'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`font-mono text-[10px] tracking-widest uppercase ${date === today ? 'text-accent font-bold' : 'text-text-dim'}`}>
                  {fmtDate(date)} {date === today && ' (HOY)'}
                </span>
              </div>
              {cats.map((cat) => (
                <div key={cat}>
                  {cats.length > 1 && <p className="text-[9px] font-mono text-text-dim mb-1">{cat === 'general' ? 'VENTAS' : cat.toUpperCase()}</p>}
                  <CellInput
                    date={date}
                    category={cat}
                    count={dayMap[date]?.[cat]?.count ?? 0}
                    revenue={dayMap[date]?.[cat]?.revenue ?? 0}
                    isToday={date === today}
                    isConversions={isEcommerce}
                    onSave={handleSave}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CPA by category */}
      {cats.length > 1 && totalSales > 0 && (
        <div className="border border-border/40 bg-bg-secondary p-3">
          <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-2">
            // COSTO POR VENTA — POR CATEGORÍA
          </p>
          <p className="text-[9px] text-text-dim/60 font-mono mb-2">
            Cuánto cuesta adquirir cada tipo de venta
          </p>
          <div className="grid grid-cols-2 gap-2">
            {cats.map((cat) => {
              const catSales = dailySales
                .filter((d) => (d.category || 'general') === cat)
                .reduce((s, d) => s + Number(d.count), 0)
              const catCpa = catSales > 0 && totalSpend > 0 ? totalSpend * (catSales / totalSales) / catSales : null
              return (
                <div key={cat} className="border border-border/30 bg-bg-primary/40 p-2">
                  <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest mb-0.5">
                    {cat === 'general' ? 'GENERAL' : cat.toUpperCase()}
                  </p>
                  <p className="font-bold font-mono text-lg text-accent">
                    {catCpa ? formatCurrency(catCpa) : '—'}
                  </p>
                  <p className="text-[8px] text-text-dim/60 font-mono">{catSales} ventas</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-[8px] text-text-dim/30 font-mono uppercase tracking-widest">
          CACHE AGENCY // PORTAL DE RENDIMIENTO
        </p>
      </div>
    </div>
  )
}
