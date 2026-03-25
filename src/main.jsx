import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Mouse spotlight: update --mx/--my on .glass panels for CSS radial-gradient
document.addEventListener('mousemove', (e) => {
  const panels = document.querySelectorAll('.glass')
  panels.forEach((panel) => {
    const rect = panel.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    panel.style.setProperty('--mx', `${x}%`)
    panel.style.setProperty('--my', `${y}%`)
  })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
