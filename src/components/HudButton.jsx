const VARIANTS = {
  primary:
    'bg-accent text-bg-primary hover:bg-accent-soft active:brightness-110',
  ghost:
    'bg-transparent text-accent border border-accent hover:bg-accent/10 active:bg-accent/20',
  success:
    'bg-success/20 text-success border border-success/40 hover:bg-success/30',
  danger:
    'bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30',
}

export default function HudButton({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 font-mono text-sm uppercase tracking-wider
        rounded-none cursor-pointer transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant] ?? VARIANTS.primary}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
