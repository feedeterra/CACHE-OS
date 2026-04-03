import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Mouse spotlight: update --mx/--my on .glass panels for CSS radial-gradient
// Throttled with requestAnimationFrame to avoid layout thrashing on every pixel
let _rafId = null
document.addEventListener('mousemove', (e) => {
  if (_rafId) return
  _rafId = requestAnimationFrame(() => {
    document.querySelectorAll('.glass').forEach((panel) => {
      const rect = panel.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      panel.style.setProperty('--mx', `${x}%`)
      panel.style.setProperty('--my', `${y}%`)
    })
    _rafId = null
  })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
