export default function BlinkingCursor({ className = '' }) {
  return (
    <span
      className={`inline-block animate-blink text-accent font-mono ${className}`}
      aria-hidden="true"
    >
      _
    </span>
  )
}
