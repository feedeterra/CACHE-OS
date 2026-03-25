import { useState } from 'react'
import { formatCurrency, formatPercent, formatNumber, getKpiStatus, computeCPA } from '../lib/mathHelpers'
import TrafficLight from './TrafficLight'

const TL = { good: 'text-success', warning: 'text-warning', danger: 'text-danger', neutral: 'text-text-dim' }
const TABS = ['CAMPAÑAS', 'CONJUNTOS', 'ANUNCIOS']

function aggregate(rows, idKey, nameKey, extra = {}) {
  const map = {}
  for (const r of rows) {
    const key = r[idKey] ?? 'unknown'
    if (!map[key]) {
      map[key] = {
        id: key, name: r[nameKey] ?? key,
        spend: 0, impressions: 0, clicks: 0, reach: 0,
        leads: 0, purchases: 0, purchase_value: 0,
        landing_page_view: 0, add_to_cart: 0, initiate_checkout: 0,
        freq_sum: 0, freq_days: 0,
        effective_status: r.effective_status ?? null,
        ...Object.fromEntries(Object.keys(extra).map((k) => [k, r[k] ?? null])),
      }
    }
    const c = map[key]
    c.spend += Number(r.spend ?? 0)
    c.impressions += Number(r.impressions ?? 0)
    c.clicks += Number(r.clicks ?? 0)
    c.reach += Number(r.reach ?? 0)
    c.leads += Number(r.leads ?? 0)
    c.purchases += Number(r.purchases ?? 0)
    c.purchase_value += Number(r.purchase_value ?? 0)
    c.landing_page_view += Number(r.landing_page_view ?? 0)
    c.add_to_cart += Number(r.add_to_cart ?? 0)
    c.initiate_checkout += Number(r.initiate_checkout ?? 0)
    if (r.frequency) { c.freq_sum += Number(r.frequency); c.freq_days++ }
    if (!c.effective_status && r.effective_status) c.effective_status = r.effective_status
  }
  return Object.values(map).map((c) => ({
    ...c,
    cpl: computeCPA(c.spend, c.leads),
    cpa: computeCPA(c.spend, c.purchases),
    roas: c.spend > 0 && c.purchase_value > 0 ? c.purchase_value / c.spend : null,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : null,
    frequency: c.freq_days > 0 ? c.freq_sum / c.freq_days : null,
  }))
}

function groupInactive(items) {
  const active = items.filter((i) => !i.effective_status || i.effective_status === 'ACTIVE')
  const inactive = items.filter((i) => i.effective_status && i.effective_status !== 'ACTIVE')
  if (inactive.length === 0) return active.sort((a, b) => b.spend - a.spend)

  const grouped = {
    id: '_inactive_', name: `CAMPAÑAS DESACTIVADAS (${inactive.length})`,
    spend: 0, impressions: 0, clicks: 0, reach: 0, leads: 0,
    purchases: 0, purchase_value: 0, freq_sum: 0, freq_days: 0,
    effective_status: 'PAUSED', _isGrouped: true,
  }
  for (const i of inactive) {
    grouped.spend += i.spend; grouped.impressions += i.impressions
    grouped.clicks += i.clicks; grouped.leads += i.leads
    grouped.purchases += i.purchases; grouped.purchase_value += i.purchase_value
  }
  grouped.cpl = computeCPA(grouped.spend, grouped.leads)
  grouped.cpa = computeCPA(grouped.spend, grouped.purchases)
  grouped.roas = grouped.spend > 0 && grouped.purchase_value > 0 ? grouped.purchase_value / grouped.spend : null
  grouped.ctr = grouped.impressions > 0 ? (grouped.clicks / grouped.impressions) * 100 : null

  return [...active.sort((a, b) => b.spend - a.spend), grouped]
}

export default function PerformanceTabs({ campaigns, adsets, ads, isLeads, goals }) {
  const [tab, setTab] = useState(0)

  const campAgg = groupInactive(aggregate(campaigns, 'campaign_id', 'campaign_name'))
  const adsetAgg = aggregate(adsets, 'adset_id', 'adset_name').sort((a, b) => b.spend - a.spend)
  const adAgg = aggregate(ads, 'ad_id', 'ad_name', { thumbnail_url: null }).sort((a, b) => b.spend - a.spend)

  const datasets = [campAgg, adsetAgg, adAgg]
  const data = datasets[tab] ?? []
  const topSpend = data.length > 0 ? data[0].spend : 1

  return (
    <div className="border border-border/40 bg-bg-secondary p-3">
      <div className="flex items-center gap-1 mb-3 border-b border-border/20 pb-2">
        {TABS.map((t, i) => (
          <button
            key={t} onClick={() => setTab(i)}
            className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border-b-2 transition-colors cursor-pointer ${
              tab === i ? 'border-accent text-accent' : 'border-transparent text-text-dim hover:text-text'
            }`}
          >
            {t} ({datasets[i].length})
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="text-text-dim font-mono text-[10px] py-4 text-center">[ NO DATA — RUN SYNC ]</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="font-mono text-[10px]" style={{ minWidth: '760px', width: '100%' }}>
            <thead>
              <tr className="text-text-dim border-b border-border/20">
                <th className="py-1 font-normal text-left sticky left-0 bg-bg-secondary min-w-[180px]">NOMBRE</th>
                <th className="py-1 font-normal text-right whitespace-nowrap px-2">SPEND</th>
                <th className="py-1 font-normal text-left w-20 px-1">%</th>
                {isLeads ? (
                  <>
                    <th className="py-1 font-normal text-right px-2">MENSAJES</th>
                    <th className="py-1 font-normal text-right px-2">CPL</th>
                  </>
                ) : (
                  <>
                    <th className="py-1 font-normal text-right px-2">COMPRAS</th>
                    <th className="py-1 font-normal text-right px-2">CPA</th>
                    <th className="py-1 font-normal text-right px-2">ROAS</th>
                  </>
                )}
                <th className="py-1 font-normal text-right px-2">CTR</th>
                <th className="py-1 font-normal text-right px-2 whitespace-nowrap">ALCANCE</th>
                <th className="py-1 font-normal text-right px-2 whitespace-nowrap">FREC.</th>
                <th className="py-1 font-normal text-center px-2">ST</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c, i) => {
                const st = isLeads
                  ? getKpiStatus(c.cpl, goals.target_cpl, true)
                  : getKpiStatus(c.cpa, goals.target_cpa, true)
                const isWinner = i === 0 && !c._isGrouped
                const pct = topSpend > 0 ? (c.spend / topSpend) * 100 : 0
                const freqColor = c.frequency > 4 ? TL.danger : c.frequency > 3 ? TL.warning : TL.neutral
                return (
                  <tr key={c.id} className={`border-b border-border/10 hover:bg-accent/5 ${
                    c._isGrouped ? 'opacity-50' : isWinner ? 'bg-success/5' : ''
                  }`}>
                    <td className="py-1.5 text-text sticky left-0 bg-bg-secondary pr-2">
                      <span className="flex items-center gap-1.5 max-w-[200px]">
                        {isWinner && <span className="text-warning shrink-0">★</span>}
                        {tab === 2 && c.thumbnail_url && (
                          <img src={c.thumbnail_url} className="w-6 h-6 object-cover border border-border/20 shrink-0" />
                        )}
                        <span className="truncate">{(c.name || c.id).toUpperCase().replace(/ /g, '_')}</span>
                        {c.effective_status && c.effective_status !== 'ACTIVE' && (
                          <span className="text-[8px] text-text-dim/60 shrink-0 ml-1">[{c.effective_status}]</span>
                        )}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-accent whitespace-nowrap px-2">{formatCurrency(c.spend)}</td>
                    <td className="py-1.5 px-1">
                      <div className="w-16 h-1.5 bg-bg-primary border border-border/10">
                        <div className="h-full bg-accent/40" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </td>
                    {isLeads ? (
                      <>
                        <td className="py-1.5 text-right text-success px-2">{c.leads}</td>
                        <td className={`py-1.5 text-right px-2 ${TL[getKpiStatus(c.cpl, goals.target_cpl, true)]}`}>
                          {c.cpl ? formatCurrency(c.cpl) : '—'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-1.5 text-right text-success px-2">{c.purchases}</td>
                        <td className={`py-1.5 text-right px-2 ${TL[getKpiStatus(c.cpa, goals.target_cpa, true)]}`}>
                          {c.cpa ? formatCurrency(c.cpa) : '—'}
                        </td>
                        <td className={`py-1.5 text-right px-2 ${TL[getKpiStatus(c.roas, goals.target_roas, false)]}`}>
                          {c.roas ? `${c.roas.toFixed(2)}x` : '—'}
                        </td>
                      </>
                    )}
                    <td className={`py-1.5 text-right px-2 ${TL[getKpiStatus(c.ctr, goals.target_ctr, false)]}`}>
                      {c.ctr ? formatPercent(c.ctr) : '—'}
                    </td>
                    <td className="py-1.5 text-right text-text-dim px-2 whitespace-nowrap">
                      {c.reach > 0 ? formatNumber(c.reach) : '—'}
                    </td>
                    <td className={`py-1.5 text-right px-2 font-bold ${c.frequency ? freqColor : 'text-text-dim'}`}>
                      {c.frequency ? c.frequency.toFixed(2) : '—'}
                    </td>
                    <td className="py-1.5 text-center px-2"><TrafficLight status={st} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
