const SIZE = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' }
const COLOR = {
  good:    'bg-success shadow-[0_0_4px_#22c55e]',
  warning: 'bg-warning shadow-[0_0_4px_#eab308]',
  danger:  'bg-danger  shadow-[0_0_4px_#ef4444]',
  neutral: 'bg-text-dim',
}

export default function TrafficLight({ status = 'neutral', size = 'sm' }) {
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${SIZE[size] ?? SIZE.sm} ${COLOR[status] ?? COLOR.neutral}`}
      title={status.toUpperCase()}
    />
  )
}
