import HudPanel from './HudPanel'

export default function StatCard({ label, value, delta, className = '' }) {
  const deltaColor =
    delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-text-dim'
  const deltaSign = delta > 0 ? '+' : ''

  return (
    <HudPanel className={className}>
      <p className="text-xs text-text-dim uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-accent font-mono">{value}</p>
      {delta !== undefined && delta !== null && (
        <p className={`text-xs mt-1 font-mono ${deltaColor}`}>
          {deltaSign}{delta}%
        </p>
      )}
    </HudPanel>
  )
}
