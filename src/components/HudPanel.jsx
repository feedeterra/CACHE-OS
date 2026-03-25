export default function HudPanel({ title, children, className = '' }) {
  return (
    <div
      className={`border border-border rounded-none bg-bg-secondary p-4 ${className}`}
    >
      {title && (
        <div className="mb-3">
          <span className="text-xs text-accent font-mono uppercase tracking-widest">
            {title}
          </span>
          <div className="mt-1 h-px bg-accent opacity-30" />
        </div>
      )}
      {children}
    </div>
  )
}
