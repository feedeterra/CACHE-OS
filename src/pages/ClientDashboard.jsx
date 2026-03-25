import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import {
  formatCurrency, computeCPA, fillDailyGaps, projectMonthEnd,
  getKpiStatus, getCtrStatus, getRoasStatus, formatPercent, formatNumber,
  computeScaleProjection
} from '../lib/mathHelpers'
import { syncClient } from '../services/metaApi'
import BlinkingCursor from '../components/BlinkingCursor'
import HudButton from '../components/HudButton'
import TrafficLight from '../components/TrafficLight'
import PerformanceTabs from '../components/PerformanceTabs'
import TopCreatives from '../components/TopCreatives'

const TL = { good: 'text-success', warning: 'text-warning', danger: 'text-danger', neutral: 'text-text-dim' }

function KpiCard({ label, value, status, subtext }) {
  return (
    <div className="glass hud-corners p-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-text-dim font-mono uppercase tracking-widest text-[9px]">{label}</p>
        <TrafficLight status={status} size="md" />
      </div>
      <p className={`font-bold font-display text-xl leading-none ${TL[status] ?? 'text-accent'}`}>{value}</p>
      {subtext && <p className="text-[9px] text-text-dim font-mono mt-1.5">{subtext}</p>}
    </div>
  )
}

function PaceBar({ pct }) {
  const clamped = Math.min(pct, 100)
  const color = pct > 105 ? 'bg-danger' : pct < 80 ? 'bg-text-dim' : 'bg-success'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-bg-primary border border-border/20">
        <div className={`h-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-text-dim font-mono text-[10px] w-10 text-right">{pct}%</span>
    </div>
  )
}

function FunnelBar({ label, value, pct }) {
  const w = Math.max(pct, 2)
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-20 text-[9px] text-text-dim font-mono uppercase shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-bg-primary border border-border/10">
        <div className="h-full bg-accent/50" style={{ width: `${w}%` }} />
      </div>
      <span className="w-14 text-right font-mono text-[10px] text-text shrink-0">{formatNumber(value)}</span>
      <span className="w-10 text-right font-mono text-[9px] text-text-dim shrink-0">{formatPercent(pct, 1)}</span>
    </div>
  )
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-secondary border border-border/40 px-2 py-1 font-mono text-[10px]">
      <p className="text-text-dim mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className={p.dataKey === 'spend' ? 'text-accent' : 'text-success'}>
          {p.dataKey === 'spend' ? formatCurrency(p.value) : formatNumber(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function ClientDashboard() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [adsets, setAdsets] = useState([])
  const [ads, setAds] = useState([])
  const [salesByCategory, setSalesByCategory] = useState([])
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [demographics, setDemographics] = useState([])
  const [geographic, setGeographic] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scalePct, setScalePct] = useState(20)

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const dateTo = today.toISOString().slice(0, 10)

  async function loadData() {
    setLoading(true)
    const results = await Promise.allSettled([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('meta_snapshots').select('*').eq('client_id', id).gte('date', dateFrom).lte('date', dateTo).order('date'),
      supabase.from('campaign_snapshots').select('*').eq('client_id', id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('adset_snapshots').select('*').eq('client_id', id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('ad_snapshots').select('*').eq('client_id', id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('portal_sales_daily').select('date, count, category').eq('client_id', id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('demographic_snapshots').select('age, gender, spend, impressions, leads, reach').eq('client_id', id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('geographic_snapshots').select('region, spend, leads, reach').eq('client_id', id).gte('date', dateFrom).lte('date', dateTo),
    ])
    const get = (i) => results[i].status === 'fulfilled' ? results[i].value.data : null
    setClient(get(0))
    setSnapshots(get(1) ?? [])
    setCampaigns(get(2) ?? [])
    setAdsets(get(3) ?? [])
    setAds(get(4) ?? [])
    const sales = get(5) ?? []
    setSalesByCategory(sales)
    setTotalSales(sales.reduce((s, r) => s + Number(r.count), 0))
    setDemographics(get(6) ?? [])
    setGeographic(get(7) ?? [])
    setLoading(false)
  }

  async function handleSync() {
    setSyncing(true)
    try { await syncClient(id, dateFrom, dateTo) } catch (e) { console.error(e) }
    await loadData()
    setSyncing(false)
  }

  function copyPortalLink() {
    if (!client?.magic_link_token) return
    navigator.clipboard.writeText(`${window.location.origin}/portal/${client.magic_link_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  useEffect(() => { loadData() }, [id])

  if (loading || !client) {
    return <div className="flex items-center gap-2 font-mono text-xs text-text-dim pt-6">LOADING_CLIENT_DATA <BlinkingCursor /></div>
  }

  const goals = client.kpi_goals ?? {}
  const isLeads = client.funnel_type !== 'conversions'
  const primary = isLeads ? 'leads' : 'purchases'

  const totalSpend = snapshots.reduce((s, r) => s + Number(r.spend), 0)
  const totalLeads = snapshots.reduce((s, r) => s + Number(r.leads ?? 0), 0)
  const totalPurchases = snapshots.reduce((s, r) => s + Number(r.purchases ?? 0), 0)
  const totalPurchaseVal = snapshots.reduce((s, r) => s + Number(r.purchase_value ?? 0), 0)
  const totalImpressions = snapshots.reduce((s, r) => s + Number(r.impressions ?? 0), 0)
  const totalClicks = snapshots.reduce((s, r) => s + Number(r.clicks ?? 0), 0)
  const totalLPV = snapshots.reduce((s, r) => s + Number(r.landing_page_view ?? 0), 0)
  const totalATC = snapshots.reduce((s, r) => s + Number(r.add_to_cart ?? 0), 0)
  const totalIC = snapshots.reduce((s, r) => s + Number(r.initiate_checkout ?? 0), 0)

  const freqSnaps = snapshots.filter((r) => r.frequency)
  const avgFreq = freqSnaps.length > 0 ? freqSnaps.reduce((s, r) => s + Number(r.frequency), 0) / freqSnaps.length : null
  const cpl = computeCPA(totalSpend, totalLeads)
  const cpa = computeCPA(totalSpend, totalPurchases)
  const roasMeta = totalSpend > 0 && totalPurchaseVal > 0 ? totalPurchaseVal / totalSpend : null
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : null
  const cpaReal = computeCPA(totalSpend, totalSales)

  // Scale simulator for this specific client
  const targetCpaForScale = isLeads ? cpl : (cpaReal || cpa)
  const scaleResult = targetCpaForScale ? computeScaleProjection(totalSpend, targetCpaForScale, scalePct) : null

  const cpaTargets = goals.cpa_targets ?? []
  const bestCpaTarget = cpaTargets.length > 0 ? Math.min(...cpaTargets.map((t) => t.target)) : null

  // CPA per category: match campaign/ad names to category, sum matching spend / sales
  function computeCategoryMetrics() {
    if (cpaTargets.length === 0) return []
    const salesByCat = {}
    for (const s of salesByCategory) {
      const cat = (s.category || 'general').toLowerCase()
      salesByCat[cat] = (salesByCat[cat] || 0) + Number(s.count)
    }
    return cpaTargets.map((t) => {
      const catName = t.name.toLowerCase()
      const catSales = salesByCat[catName] || 0

      // Match ads/campaigns whose names contain the category name
      let catSpend = 0
      const allRows = [...campaigns, ...ads]
      for (const r of allRows) {
        const name = (r.ad_name || r.campaign_name || '').toLowerCase()
        if (name.includes(catName)) catSpend += Number(r.spend ?? 0)
      }
      // If no name match, use proportional split
      if (catSpend === 0 && totalSpend > 0 && totalSales > 0) {
        catSpend = totalSpend * (catSales / totalSales)
      }

      const catCpa = computeCPA(catSpend, catSales)
      return { ...t, catSales, catSpend, catCpa, status: getKpiStatus(catCpa, t.target, true) }
    })
  }
  const categoryMetrics = computeCategoryMetrics()

  const chartData = fillDailyGaps(snapshots, today, ['spend', primary]).map((d) => ({ ...d, date: d.date.slice(5) }))
  const pace = client.monthly_budget ? projectMonthEnd(totalSpend, Number(client.monthly_budget), today) : null

  const kpis = isLeads ? [
    { label: 'SPEND_MTD', value: formatCurrency(totalSpend), status: 'neutral' },
    { label: 'LEADS', value: String(totalLeads), status: getKpiStatus(totalLeads, goals.target_leads, false), subtext: goals.target_leads ? `META: ${goals.target_leads}` : null },
    { label: 'CPL', value: cpl ? formatCurrency(cpl) : '—', status: getKpiStatus(cpl, goals.target_cpl, true), subtext: goals.target_cpl ? `META: ${formatCurrency(goals.target_cpl)}` : null },
    { label: 'CPA_REAL', value: cpaReal ? formatCurrency(cpaReal) : '—', status: getKpiStatus(cpaReal, bestCpaTarget, true), subtext: totalSales > 0 ? `${totalSales} ventas` : 'SIN VENTAS' },
    { label: 'CTR', value: ctr ? formatPercent(ctr) : '—', status: getCtrStatus(ctr), subtext: 'click-through rate' },
    { label: 'CPM', value: cpm ? formatCurrency(cpm) : '—', status: 'neutral', subtext: 'costo por mil imp.' },
  ] : [
    { label: 'SPEND_MTD', value: formatCurrency(totalSpend), status: 'neutral' },
    { label: 'CPA_META', value: cpa ? formatCurrency(cpa) : '—', status: getKpiStatus(cpa, goals.target_cpa, true), subtext: goals.target_cpa ? `META: ${formatCurrency(goals.target_cpa)}` : null },
    { label: 'CPA_REAL', value: cpaReal ? formatCurrency(cpaReal) : '—', status: getKpiStatus(cpaReal, bestCpaTarget, true), subtext: totalSales > 0 ? `${totalSales} ventas` : 'SIN VENTAS' },
    { label: 'ROAS', value: roasMeta ? `${roasMeta.toFixed(2)}x` : '—', status: getRoasStatus(roasMeta), subtext: roasMeta && roasMeta < 2 ? 'ALERTA: < 2x' : 'META: > 3x' },
    { label: 'CTR', value: ctr ? formatPercent(ctr) : '—', status: getCtrStatus(ctr), subtext: ctr && ctr < 0.7 ? 'FATIGA CREATIVA' : 'click-through rate' },
    { label: 'CPM', value: cpm ? formatCurrency(cpm) : '—', status: 'neutral', subtext: 'competición' },
  ]


  const funnelBase = totalLPV || totalATC || totalIC || totalPurchases
  const funnelSteps = !isLeads && funnelBase > 0 ? [
    { label: 'LPV', value: totalLPV, pct: 100 },
    { label: 'ADD_CART', value: totalATC, pct: totalLPV > 0 ? (totalATC / totalLPV) * 100 : 0 },
    { label: 'CHECKOUT', value: totalIC, pct: totalLPV > 0 ? (totalIC / totalLPV) * 100 : 0 },
    { label: 'PURCHASE', value: totalPurchases, pct: totalLPV > 0 ? (totalPurchases / totalLPV) * 100 : 0 },
  ] : null

  const paceStatus = pace?.status
  const paceColor = paceStatus === 'on-track' ? 'text-success' : paceStatus === 'overspending' ? 'text-danger' : 'text-text-dim'

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/30 pb-2 flex-wrap">
        <span className="text-accent font-bold font-mono text-sm tracking-widest">
          {client.name.toUpperCase().replace(/ /g, '_')}
        </span>
        <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
          isLeads ? 'text-success border-success/40 bg-success/10' : 'text-accent border-accent/40 bg-accent/10'
        }`}>
          {isLeads ? 'LEADS' : 'CONVERSIONS'}
        </span>
        <BlinkingCursor />
        <div className="ml-auto flex items-center gap-2">
          {pace && <span className={`text-[10px] font-mono uppercase ${paceColor}`}>{paceStatus?.replace('-', '_').toUpperCase()}</span>}
          <Link
            to={`/admin/clients?edit=${id}`}
            className="border border-border/50 text-text-dim hover:bg-border/10 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 transition-colors"
          >
            [✎ CONFIG]
          </Link>
          {client.magic_link_token && (
            <button
              onClick={copyPortalLink}
              className="border border-accent/50 text-accent hover:bg-accent/10 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 cursor-pointer transition-colors"
            >
              {copied ? '[✓ COPIADO]' : '[⎘ PORTAL]'}
            </button>
          )}
          {client.magic_link_token && (
            <Link
              to={`/portal/${client.magic_link_token}`}
              target="_blank"
              className="border border-success/50 text-success hover:bg-success/10 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 transition-colors"
            >
              [↗ ABRIR PORTAL]
            </Link>
          )}
          <HudButton onClick={handleSync} disabled={syncing} className="text-[10px] py-1 px-3">
            {syncing ? 'SYNCING...' : '[↻] SYNC'}
          </HudButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* CPA per Category */}
      {categoryMetrics.length > 0 && (
        <div className="border border-border/40 bg-bg-secondary p-3">
          <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-2">// CPA_REAL — POR CATEGORÍA</p>
          <table className="w-full font-mono text-[10px]">
            <thead>
              <tr className="text-text-dim border-b border-border/20">
                <th className="py-1 font-normal text-left">CATEGORÍA</th>
                <th className="py-1 font-normal text-right">TARGET</th>
                <th className="py-1 font-normal text-right">SPEND</th>
                <th className="py-1 font-normal text-right">VENTAS</th>
                <th className="py-1 font-normal text-right">CPA_REAL</th>
                <th className="py-1 font-normal text-center">ST</th>
              </tr>
            </thead>
            <tbody>
              {categoryMetrics.map((t, i) => (
                <tr key={i} className="border-b border-border/10 hover:bg-accent/5">
                  <td className="py-1.5 text-text font-bold">{t.name.toUpperCase().replace(/ /g, '_')}</td>
                  <td className="py-1.5 text-right text-text-dim">{formatCurrency(t.target)}</td>
                  <td className="py-1.5 text-right text-accent">{formatCurrency(t.catSpend)}</td>
                  <td className="py-1.5 text-right text-text-dim">{t.catSales}</td>
                  <td className={`py-1.5 text-right font-bold ${TL[t.status]}`}>
                    {t.catCpa ? formatCurrency(t.catCpa) : '—'}
                  </td>
                  <td className="py-1.5 text-center"><TrafficLight status={t.status} size="md" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalSales === 0 && (
            <p className="text-text-dim/50 font-mono text-[9px] mt-2 text-center">
              REGISTRA VENTAS DESDE EL PORTAL PARA CALCULAR CPA REAL POR CATEGORÍA
            </p>
          )}
        </div>
      )}

      {/* Pacing */}
      {pace && (
        <div className="border border-border/40 bg-bg-secondary p-3">
          <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-2">// BUDGET_PACING</p>
          <div className="flex items-center gap-4">
            <div className="flex-1"><PaceBar pct={Math.round(pace.projectedUtilization)} /></div>
            <div className="text-[10px] font-mono text-text-dim space-y-0.5 shrink-0">
              <p>BUDGET: {formatCurrency(Number(client.monthly_budget))}</p>
              <p>PROJECTED: <span className={paceColor}>{formatCurrency(pace.projected)}</span></p>
              <p>REC_DAILY: {formatCurrency(pace.recommendedDaily)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="border border-border/40 bg-bg-secondary p-3">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] text-accent font-mono uppercase tracking-widest">
            // SPEND_&amp;_{isLeads ? 'LEADS' : 'PURCHASES'}_TIMELINE
          </p>
          {chartData.length > 0 && (() => {
            const daysWithData = chartData.filter((d) => d.spend > 0).length || 1
            const avgSpend = totalSpend / daysWithData
            const avgMetric = (isLeads ? totalLeads : totalPurchases) / daysWithData
            return (
              <div className="text-right font-mono text-[9px] text-text-dim space-y-0.5 shrink-0 ml-4">
                <p>AVG_DAILY_SPEND <span className="text-accent">{formatCurrency(avgSpend)}</span></p>
                <p>AVG_DAILY_{isLeads ? 'LEADS' : 'PURCHASES'} <span className="text-success">{avgMetric.toFixed(1)}</span></p>
              </div>
            )
          })()}
        </div>
        <ResponsiveContainer width="100%" height={128}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1a1f2e" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="spend" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={48} />
            <YAxis yAxisId="metric" orientation="right" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<ChartTip />} />
            <Area yAxisId="spend" type="monotone" dataKey="spend" stroke="#F97316" strokeWidth={1.5} fill="url(#sg)" />
            <Area yAxisId="metric" type="monotone" dataKey={primary} stroke="#22c55e" strokeWidth={1.5} fill="url(#mg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Funnel */}
      {funnelSteps && (
        <div className="border border-border/40 bg-bg-secondary p-3">
          <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-2">// CONVERSION_FUNNEL</p>
          {funnelSteps.map((s) => <FunnelBar key={s.label} {...s} />)}
          {totalPurchaseVal > 0 && (
            <div className="mt-2 pt-2 border-t border-border/20 flex gap-4 font-mono text-[10px] text-text-dim">
              <span>REVENUE: <span className="text-success">{formatCurrency(totalPurchaseVal)}</span></span>
              <span>ROAS: <span className={TL[getKpiStatus(roas, goals.target_roas, false)]}>{roas ? `${roas.toFixed(2)}x` : '—'}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Demographics */}
      {(() => {
        if (demographics.length === 0 && geographic.length === 0) return (
          <div className="border border-border/40 bg-bg-secondary p-3">
            <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-2">// AUDIENCIA_DEMOGRÁFICA</p>
            <p className="text-text-dim/50 font-mono text-[10px] text-center py-6">
              [ SIN DATOS — EJECUTAR SYNC PARA OBTENER DEMOGRAFÍA DE META ]
            </p>
          </div>
        )
        // Aggregate by age (all genders)
        const byAge = {}
        for (const d of demographics) {
          if (!byAge[d.age]) byAge[d.age] = { age: d.age, spend: 0, leads: 0, reach: 0 }
          byAge[d.age].spend += Number(d.spend ?? 0)
          byAge[d.age].leads += Number(d.leads ?? 0)
          byAge[d.age].reach += Number(d.reach ?? 0)
        }
        const AGE_ORDER = ['13-17','18-24','25-34','35-44','45-54','55-64','65+','unknown']
        const ageData = AGE_ORDER.filter((a) => byAge[a]).map((a) => ({
          age: a, spend: Math.round(byAge[a].spend), leads: byAge[a].leads, reach: byAge[a].reach,
        }))

        // Aggregate by gender
        const byGender = {}
        for (const d of demographics) {
          const g = d.gender === 'male' ? 'Hombres' : d.gender === 'female' ? 'Mujeres' : 'Otro'
          if (!byGender[g]) byGender[g] = { gender: g, spend: 0, leads: 0 }
          byGender[g].spend += Number(d.spend ?? 0)
          byGender[g].leads += Number(d.leads ?? 0)
        }
        const genderData = Object.values(byGender)
        const GENDER_COLORS = { Hombres: '#F97316', Mujeres: '#3fb950', Otro: '#7d8590' }

        const DemoTip = ({ active, payload, label }) => {
          if (!active || !payload?.length) return null
          return (
            <div className="bg-bg-secondary border border-border/40 px-2 py-1.5 font-mono text-[10px] space-y-0.5">
              <p className="text-text-dim mb-1">{label}</p>
              {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                  {p.name}: {p.dataKey === 'spend' ? formatCurrency(p.value) : formatNumber(p.value)}
                </p>
              ))}
            </div>
          )
        }

        // Aggregate geographic data
        const byRegion = {}
        for (const d of geographic) {
          if (!byRegion[d.region]) byRegion[d.region] = { region: d.region, spend: 0, leads: 0, reach: 0 }
          byRegion[d.region].spend += Number(d.spend ?? 0)
          byRegion[d.region].leads += Number(d.leads ?? 0)
          byRegion[d.region].reach += Number(d.reach ?? 0)
        }
        const topRegions = Object.values(byRegion)
          .sort((a, b) => b.spend - a.spend)
          .slice(0, 10)
        const maxRegionSpend = topRegions[0]?.spend || 1

        return (
          <div className="border border-border/40 bg-bg-secondary p-3">
            <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-4">// AUDIENCIA_DEMOGRÁFICA</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Age breakdown */}
              <div>
                <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest mb-2">Por edad — Spend & Mensajes</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ageData} margin={{ top: 2, right: 4, left: 0, bottom: 0 }} barSize={14}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="age" tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="spend" tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={36} />
                    <YAxis yAxisId="leads" orientation="right" tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} width={24} />
                    <Tooltip content={<DemoTip />} />
                    <Bar yAxisId="spend" dataKey="spend" name="Spend" fill="#F97316" fillOpacity={0.7} radius={[2,2,0,0]} />
                    <Bar yAxisId="leads" dataKey="leads" name="Mensajes" fill="#22c55e" fillOpacity={0.7} radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gender breakdown */}
              <div>
                <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest mb-2">Por género — Spend & Mensajes</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={genderData} margin={{ top: 2, right: 4, left: 0, bottom: 0 }} barSize={28}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="gender" tick={{ fill: '#7d8590', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="spend" tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={36} />
                    <YAxis yAxisId="leads" orientation="right" tick={{ fill: '#7d8590', fontSize: 8, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} width={24} />
                    <Tooltip content={<DemoTip />} />
                    <Bar yAxisId="spend" dataKey="spend" name="Spend" radius={[3,3,0,0]}>
                      {genderData.map((g) => <Cell key={g.gender} fill={GENDER_COLORS[g.gender] ?? '#F97316'} fillOpacity={0.75} />)}
                    </Bar>
                    <Bar yAxisId="leads" dataKey="leads" name="Mensajes" fill="#22c55e" fillOpacity={0.5} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-3 mt-1 justify-center">
                  {genderData.map((g) => (
                    <span key={g.gender} className="flex items-center gap-1 font-mono text-[8px] text-text-dim">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: GENDER_COLORS[g.gender] }} />
                      {g.gender} — {formatCurrency(g.spend)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Top regions */}
              <div>
                <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest mb-2">Top provincias — Spend</p>
                {topRegions.length === 0 ? (
                  <p className="text-text-dim/40 font-mono text-[9px] text-center py-8">[ SIN DATOS GEO — EJECUTAR SYNC ]</p>
                ) : (
                  <div className="space-y-1.5" style={{ height: 180, overflowY: 'auto' }}>
                    {topRegions.map((r, i) => (
                      <div key={r.region} className="flex items-center gap-2">
                        <span className="font-mono text-[8px] text-text-dim/50 w-3 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-mono text-[9px] text-text truncate">{r.region}</span>
                            <span className="font-mono text-[9px] text-accent shrink-0 ml-1">{formatCurrency(r.spend)}</span>
                          </div>
                          <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent/60 rounded-full"
                              style={{ width: `${(r.spend / maxRegionSpend) * 100}%` }}
                            />
                          </div>
                        </div>
                        {r.leads > 0 && <span className="font-mono text-[8px] text-success shrink-0">{r.leads}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Top Creatives */}
      <TopCreatives ads={ads} isLeads={isLeads} goals={goals} />

      {/* Performance Tabs — Campaigns / Adsets / Ads */}
      <PerformanceTabs
        campaigns={campaigns}
        adsets={adsets}
        ads={ads}
        isLeads={isLeads}
        goals={goals}
      />

      {/* Scale Simulator */}
      <div className="glass rounded-sm p-4 mt-6 border-accent/20 border">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-display font-bold text-accent tracking-tight text-[14px]">SIMULADOR DE ESCALA TÁCTICA</span>
          <span className="ml-auto text-[8px] font-mono text-text-dim/20">META::MODEL_v1</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-[10px] text-text-dim w-24">ESCALAR +{scalePct}%</span>
          <input
            type="range" min={5} max={200} step={5} value={scalePct}
            onChange={(e) => setScalePct(Number(e.target.value))}
            className="flex-1 accent-[#F97316] cursor-pointer"
          />
          <span className="font-mono text-accent text-[12px] w-12 text-right">{scalePct}%</span>
        </div>
        {scaleResult ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'NUEVO SPEND (MES)',   value: formatCurrency(scaleResult.newSpend),          hint: `+${scalePct}% presupuesto` },
              { label: 'NUEVO CPA EST.', value: formatCurrency(scaleResult.projectedCPA),       hint: `degradación x${scaleResult.cpmDegradation.toFixed(2)}` },
              { label: `${isLeads ? 'LEADS' : 'CONVERSIONES'} EST.`, value: Math.round(scaleResult.projectedConversions), hint: 'volumen proyectado' },
            ].map((s) => (
              <div key={s.label} className="border border-white/5 p-3 text-center bg-bg-primary/30">
                <p className="font-mono text-[9px] text-text-dim uppercase tracking-widest mb-1">{s.label}</p>
                <p className="font-display font-bold text-text text-lg leading-none">{s.value}</p>
                <p className="font-mono text-[8px] text-text-dim/50 mt-1">{s.hint}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-dim/40 font-mono text-[11px] text-center py-4">[ SE REQUIERE CPA Y SPEND PARA PROYECTAR ]</p>
        )}
      </div>

    </div>
  )
}
