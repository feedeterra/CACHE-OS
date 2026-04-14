import { formatCurrencyAR } from '../lib/mathHelpers'
import TrafficLight from './TrafficLight'

function getStatus(costPerResult, target) {
  if (!costPerResult || !target) return 'neutral'
  if (costPerResult <= target) return 'good'
  if (costPerResult <= target * 1.25) return 'warning'
  return 'danger'
}

export default function PortalTopAds({ ads, isLeads, goals }) {
  if (!ads || ads.length === 0) return null

  const costLabel    = isLeads ? 'Costo por contacto' : 'Costo por venta'
  const resultsLabel = isLeads ? 'Contactos' : 'Ventas'
  const target       = isLeads ? (goals?.target_cpl ?? null) : (goals?.target_cpa ?? null)

  return (
    <div className="border border-border/20 bg-bg-secondary p-4">
      <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-0.5">
        ANUNCIOS QUE MEJOR FUNCIONAN
      </p>
      <p className="text-[9px] text-text-dim/60 font-mono mb-4">
        Ordenados de menor a mayor costo por resultado · ★ mejor del periodo
      </p>

      <div className="space-y-3">
        {ads.map((ad, i) => {
          const isTop    = i === 0 && ads.length > 1 && ad.costPerResult !== null
          const status   = getStatus(ad.costPerResult, target)
          const hasImage = !!ad.thumbnail_url

          const topBorder = status === 'good'    ? 'border-t-success'
                          : status === 'warning' ? 'border-t-warning'
                          : status === 'danger'  ? 'border-t-danger'
                          : 'border-t-border/20'

          return (
            <div
              key={ad.ad_id}
              className={`border border-border/20 border-t-2 ${topBorder} bg-bg-primary/30`}
            >
              <div className="flex gap-0">
                {/* Imagen / preview */}
                {hasImage ? (
                  <img
                    src={ad.thumbnail_url}
                    alt="Creatividad"
                    className="w-20 h-20 object-cover shrink-0 border-r border-border/20"
                  />
                ) : (
                  <div className="w-20 h-20 shrink-0 border-r border-border/20 bg-bg-primary flex flex-col items-center justify-center gap-1 p-2">
                    {ad.creative_title ? (
                      <p className="text-[7px] font-mono text-text-dim/60 text-center leading-tight line-clamp-4">
                        {ad.creative_title}
                      </p>
                    ) : (
                      <span className="text-text-dim/20 text-[8px] font-mono">SIN IMG</span>
                    )}
                  </div>
                )}

                {/* Datos */}
                <div className="flex-1 min-w-0 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[10px] font-mono text-text leading-tight line-clamp-2 flex-1">
                      {isTop && <span className="text-warning mr-1">★</span>}
                      {(ad.ad_name || ad.ad_id).slice(0, 50)}
                    </p>
                    <TrafficLight status={status} size="md" />
                  </div>

                  {/* Creative body como subtitulo */}
                  {ad.creative_body && (
                    <p className="text-[8px] font-mono text-text-dim/50 mb-2 line-clamp-1 italic">
                      "{ad.creative_body.slice(0, 60)}{ad.creative_body.length > 60 ? '...' : ''}"
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[8px] font-mono text-text-dim/60 mb-0.5">{costLabel}</p>
                      <p className={`text-[13px] font-bold font-mono leading-none ${
                        status === 'good' ? 'text-success' : status === 'danger' ? 'text-danger' : 'text-text'
                      }`}>
                        {ad.costPerResult ? formatCurrencyAR(ad.costPerResult) : '—'}
                      </p>
                      {target && ad.costPerResult && (
                        <p className="text-[7px] font-mono text-text-dim/40 mt-0.5">
                          obj: {formatCurrencyAR(target)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-text-dim/60 mb-0.5">{resultsLabel}</p>
                      <p className="text-[13px] font-bold font-mono text-accent leading-none">
                        {ad.results > 0 ? ad.results : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-text-dim/60 mb-0.5">Invertido</p>
                      <p className="text-[11px] font-mono text-text-dim leading-none">
                        {formatCurrencyAR(ad.spend)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
