function SimpleBar({ label, value, max, sublabel }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-16 text-[9px] font-mono text-text-dim text-right shrink-0 truncate">{label}</span>
      <div className="flex-1 h-3 bg-bg-primary overflow-hidden">
        <div className="h-full bg-accent/50 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-[10px] font-mono text-text text-right shrink-0">{sublabel}</span>
    </div>
  )
}

export default function PortalAudience({ demographics, topRegions, isLeads }) {
  const { byAge = [], byGender = [] } = demographics ?? {}
  const hasAge    = byAge.length > 0
  const hasGender = byGender.length > 0
  const hasRegion = topRegions?.length > 0

  if (!hasAge && !hasGender && !hasRegion) return null

  const resultLabel = isLeads ? 'contactos' : 'ventas'

  // Generate insight sentence
  let insight = null
  if (hasAge || hasGender) {
    const topAge    = hasAge    ? [...byAge].sort((a, b) => b.results - a.results)[0] : null
    const topGender = hasGender ? byGender[0] : null
    const total     = byGender.reduce((s, g) => s + g.results, 0)
    const gPct      = total > 0 && topGender ? Math.round((topGender.results / total) * 100) : null

    const parts = []
    if (gPct && gPct > 50) parts.push(`${gPct}% ${topGender.gender.toLowerCase()}`)
    if (topAge)            parts.push(`de ${topAge.age} años`)
    if (hasRegion)         parts.push(`principalmente en ${topRegions[0].region}`)

    if (parts.length > 0) {
      insight = `La mayoria de tus ${resultLabel} vienen de ${parts.join(', ')}.`
    }
  }

  const maxAge    = Math.max(...byAge.map((a) => a.results), 1)
  const maxGender = Math.max(...byGender.map((g) => g.results), 1)
  const maxRegion = Math.max(...(topRegions?.map((r) => r.results) ?? []), 1)
  const totalGender = byGender.reduce((s, g) => s + g.results, 0)

  return (
    <div className="border border-border/20 bg-bg-secondary p-4">
      <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-0.5">
        TU AUDIENCIA
      </p>
      {insight && (
        <p className="text-[10px] text-text font-mono leading-relaxed mb-4">{insight}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hasAge && (
          <div>
            <p className="text-[8px] font-mono text-text-dim/60 uppercase tracking-widest mb-2">Por edad</p>
            <div className="space-y-0.5">
              {byAge.map((a) => (
                <SimpleBar key={a.age} label={a.age} value={a.results} max={maxAge} sublabel={String(a.results)} />
              ))}
            </div>
          </div>
        )}

        {hasGender && (
          <div>
            <p className="text-[8px] font-mono text-text-dim/60 uppercase tracking-widest mb-2">Por genero</p>
            <div className="space-y-1">
              {byGender.map((g) => (
                <SimpleBar key={g.gender} label={g.gender} value={g.results} max={maxGender} sublabel={String(g.results)} />
              ))}
              {totalGender > 0 && (
                <div className="pt-2 space-y-0.5">
                  {byGender.map((g) => (
                    <p key={g.gender} className="text-[9px] font-mono text-text-dim/60">
                      {g.gender}: {Math.round((g.results / totalGender) * 100)}%
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {hasRegion && (
          <div>
            <p className="text-[8px] font-mono text-text-dim/60 uppercase tracking-widest mb-2">Top provincias</p>
            <div className="space-y-0.5">
              {topRegions.map((r, i) => (
                <SimpleBar
                  key={r.region}
                  label={`${i + 1}. ${r.region}`}
                  value={r.results}
                  max={maxRegion}
                  sublabel={String(r.results)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
