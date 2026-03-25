import { formatCurrency, formatPercent, computeCPA, getKpiStatus } from '../lib/mathHelpers'
import TrafficLight from './TrafficLight'

const TL = { good: 'text-success', warning: 'text-warning', danger: 'text-danger', neutral: 'text-text-dim' }

function aggregateAds(rows) {
  const map = {}
  for (const r of rows) {
    const key = r.ad_id ?? 'unknown'
    if (!map[key]) {
      map[key] = {
        ad_id: key, ad_name: r.ad_name ?? key,
        thumbnail_url: r.thumbnail_url ?? null,
        creative_body: r.creative_body ?? null,
        creative_title: r.creative_title ?? null,
        spend: 0, impressions: 0, clicks: 0, reach: 0,
        leads: 0, purchases: 0, purchase_value: 0,
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
    if (!c.thumbnail_url && r.thumbnail_url) c.thumbnail_url = r.thumbnail_url
    if (!c.creative_body && r.creative_body) c.creative_body = r.creative_body
    if (!c.creative_title && r.creative_title) c.creative_title = r.creative_title
  }
  return Object.values(map).map((c) => ({
    ...c,
    cpl: computeCPA(c.spend, c.leads),
    cpa: computeCPA(c.spend, c.purchases),
    roas: c.spend > 0 && c.purchase_value > 0 ? c.purchase_value / c.spend : null,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : null,
  }))
}

export default function TopCreatives({ ads, isLeads, goals }) {
  const aggregated = aggregateAds(ads)
  if (aggregated.length === 0) return null

  // Score: for leads, lower CPL = better. For conversions, higher ROAS or lower CPA = better
  const scored = aggregated
    .filter((a) => a.spend > 0)
    .map((a) => {
      let score = 0
      if (isLeads) {
        score = a.cpl && a.cpl > 0 ? 1 / a.cpl : 0
      } else {
        score = a.roas ?? (a.cpa && a.cpa > 0 ? 1 / a.cpa : 0)
      }
      return { ...a, score }
    })
    .sort((a, b) => b.score - a.score)

  const top = scored.slice(0, 6)
  if (top.length === 0) return null

  const avgScore = scored.reduce((s, a) => s + a.score, 0) / scored.length
  const threshold = avgScore * 1.3

  return (
    <div className="border border-border/40 bg-bg-secondary p-3">
      <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-3">
        // TOP_CREATIVES — MEJORES ANUNCIOS DEL MES
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {top.map((a, i) => {
          const isTop = a.score > threshold
          const primaryMetric = isLeads ? a.cpl : a.cpa
          const primaryLabel = isLeads ? 'CPL' : 'CPA'
          const st = isLeads
            ? getKpiStatus(a.cpl, goals.target_cpl, true)
            : getKpiStatus(a.cpa, goals.target_cpa, true)

          return (
            <div key={a.ad_id} className={`border p-2 transition-colors ${
              isTop
                ? 'border-success/60 bg-success/5'
                : 'border-border/30 bg-bg-primary/40'
            }`}>
              <div className="flex gap-2">
                {a.thumbnail_url ? (
                  <img src={a.thumbnail_url} className="w-12 h-12 object-cover border border-border/20 shrink-0" />
                ) : (
                  <div className="w-12 h-12 border border-border/20 bg-bg-primary flex items-center justify-center shrink-0">
                    <span className="text-text-dim/30 text-[8px] font-mono">NO IMG</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    {isTop && <span className="text-warning text-[10px]">★</span>}
                    <span className="text-[9px] font-mono text-text truncate block">
                      {(a.ad_name || a.ad_id).slice(0, 30).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold font-mono ${TL[st]}`}>
                      {primaryMetric ? formatCurrency(primaryMetric) : '—'}
                    </span>
                    <span className="text-[8px] text-text-dim font-mono">{primaryLabel}</span>
                    <TrafficLight status={st} size="sm" />
                  </div>
                  <div className="flex gap-2 mt-0.5 text-[8px] font-mono text-text-dim">
                    <span>{formatCurrency(a.spend)}</span>
                    <span>CTR {a.ctr ? formatPercent(a.ctr) : '—'}</span>
                    {!isLeads && a.roas && <span>ROAS {a.roas.toFixed(1)}x</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[8px] text-text-dim/40 font-mono mt-2 text-center">
        ★ = RENDIMIENTO SUPERIOR AL PROMEDIO
      </p>
    </div>
  )
}
