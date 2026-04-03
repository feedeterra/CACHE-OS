import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import HudPanel from '../components/HudPanel'
import BlinkingCursor from '../components/BlinkingCursor'

const CLIENTS = [
  'VEMPRA VIAJES', 'VITALE ORFEBRERÍA', 'HR EXPRESS IDAHO', 'LATE METAL JOYAS',
  'VEMPRA MENDOZA', 'VARU DISTRIBUIDORA', 'HR EXPRESS MONTANA', 'CASA DURÁN',
  'RAKAN POPCORN', 'VARU HERRAMIENTAS', 'HR EXPRESS MINNESOTA', 'VERDA JOYERÍA',
  'HR EXPRESS NEBRASKA', 'TU MOTO BAHÍA BLANCA', 'HR EXPRESS IOWA',
  'HR EXPRESS WISCONSIN', 'HR EXPRESS ND & SD',
]

const CALENDLY_URL = 'https://calendly.com/cacheagency/asesoriagratis'

function openCalendly() {
  if (window.Calendly) {
    window.Calendly.initPopupWidget({ url: CALENDLY_URL })
  } else {
    window.open(CALENDLY_URL, '_blank')
  }
}

export default function LandingPage() {
  useEffect(() => {
    // Load Calendly widget script once
    if (!document.getElementById('calendly-script')) {
      const s = document.createElement('script')
      s.id = 'calendly-script'
      s.src = 'https://assets.calendly.com/assets/external/widget.js'
      s.async = true
      document.head.appendChild(s)

      // Calendly popup CSS
      const link = document.createElement('link')
      link.href = 'https://assets.calendly.com/assets/external/widget.css'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden selection:bg-accent/30 selection:text-white">
      {/* HUD Scan Line Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-20">
        <div className="w-full h-[2px] bg-accent/30 animate-scan shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold font-display text-lg tracking-widest">CACHE // OS</span>
            <span className="text-[10px] font-mono text-text-dim/40 border border-white/5 px-2 py-0.5">v2.0</span>
          </div>
          <Link 
            to="/login"
            className="text-[10px] text-accent hover:bg-accent/10 font-mono uppercase tracking-[0.2em] border border-accent/20 px-4 py-2 transition-all"
          >
            [ LOGIN_ACCESS ]
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 mb-6">
            <span className="text-accent font-mono text-[10px] tracking-widest uppercase">
              // INFRAESTRUCTURA_DE_ELITE_ACTIVADA
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter mb-8">
            CRECIMIENTO <br />
            <span className="text-accent">SIN PUNTOS CIEGOS.</span>
          </h1>
          <p className="max-w-2xl text-text-dim text-lg md:text-xl font-sans leading-relaxed mb-10">
            Somos la agencia que utiliza tecnología propietaria para gestionar tu inversión. 
            Transparencia radical, IA 24/7 y ejecución táctica de nivel militar.
          </p>

          {/* CTA → Calendly */}
          <div className="flex flex-wrap gap-4 items-center">
            <button 
              onClick={openCalendly}
              className="bg-accent text-black font-display font-bold px-8 py-4 text-sm hover:bg-white transition-colors uppercase tracking-widest cursor-pointer"
            >
              Solicitar Auditoría Táctica
            </button>
            <Link to="/login" className="px-6 py-4 border border-white/10 text-white font-mono text-xs hover:border-accent/40 transition-all flex items-center gap-2 uppercase">
              Ver Demo <span className="text-accent animate-pulse">●</span>
            </Link>
          </div>
          <p className="mt-4 text-[10px] text-text-dim/50 font-mono">
            // SIN_CONTRATOS · ASESORÍA_GRATIS · 100%_CONFIDENCIAL
          </p>
        </div>

        {/* Decorative Grid Background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--color-accent) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
        </div>
      </header>

      {/* Trust Bar — Stats */}
      <section className="py-12 px-6 border-y border-white/5 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {[
              { label: 'SPEND GESTIONADO', value: '$25M+' },
              { label: 'LEADS CAPTURADOS', value: '450K+' },
              { label: 'KPI ACCURACY', value: '99.8%' },
              { label: 'TIEMPO DE RESPUESTA', value: '<5ms' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-accent text-3xl font-display font-black mb-2">{stat.value}</p>
                <p className="text-[10px] text-text-dim font-mono tracking-widest uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Marquee */}
      <section className="py-6 border-b border-white/5 overflow-hidden">
        <p className="text-[9px] text-text-dim/30 font-mono tracking-[0.3em] uppercase text-center mb-5">
          // CLIENTES_ACTIVOS
        </p>
        <div className="relative w-full overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex animate-marquee whitespace-nowrap">
            {[...CLIENTS, ...CLIENTS].map((name, i) => (
              <span key={i} className="inline-flex items-center mx-6 md:mx-10">
                <span className="text-accent/40 text-[8px] mr-2">◆</span>
                <span className="font-display font-bold text-white/40 text-xs md:text-sm tracking-[0.15em] uppercase">{name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Section (Visual Tour) */}
      <section className="py-20 px-6 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-display font-bold text-white mb-4 uppercase tracking-tight">
              NUESTRA INFRAESTRUCTURA
            </h2>
            <div className="w-20 h-1 bg-accent mb-6"></div>
            <p className="text-text-dim font-mono text-sm max-w-xl">
              Olvídate de los reportes PDF del mes pasado. Con CACHE-OS, tienes control total en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <HudPanel title="01. EL_DASHBOARD_HUD" subtitle="FULL_TRANSPARENCY">
              <div className="aspect-video bg-bg-surface/50 overflow-hidden relative group">
                <img 
                  src="https://raw.githubusercontent.com/feedeterra/CACHE-OS/main/public/demo_dashboard.png" 
                  alt="Dashboard HUD" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] text-accent font-mono mb-1">METRICAS_EN_VIVO</p>
                  <p className="text-xs text-text-dim">Mira el pulso de tu inversión cada minuto.</p>
                </div>
              </div>
            </HudPanel>

            <HudPanel title="02. AGENTE_GUARDIAN" subtitle="SECURITY_AI">
              <div className="aspect-video bg-bg-surface/50 overflow-hidden relative group">
                <img 
                  src="https://raw.githubusercontent.com/feedeterra/CACHE-OS/main/public/demo_logs.png" 
                  alt="System Logs" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] text-accent font-mono mb-1">PROTECCION_24_7</p>
                  <p className="text-xs text-text-dim">Nuestra IA detecta anomalías y corrige el rumbo.</p>
                </div>
              </div>
            </HudPanel>

            <HudPanel title="03. PORTAL_CLIENTE" subtitle="MOBILE_CONTROL">
              <div className="aspect-video bg-bg-surface/50 overflow-hidden relative group">
                <img 
                  src="https://raw.githubusercontent.com/feedeterra/CACHE-OS/main/public/demo_mobile.png" 
                  alt="Mobile Portal" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] text-accent font-mono mb-1">ACCESO_TOTAL</p>
                  <p className="text-xs text-text-dim">Tu agencia en tu bolsillo. Siempre online.</p>
                </div>
              </div>
            </HudPanel>
          </div>
        </div>
      </section>

      {/* Social Proof — Testimonial */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] text-accent font-mono tracking-[0.3em] uppercase mb-8">
            // CASO_DE_ÉXITO
          </p>
          <blockquote className="text-white text-xl md:text-2xl font-sans leading-relaxed mb-6 italic">
            "En 60 días redujeron nuestro CPA un 42% y duplicaron los leads calificados. 
            La transparencia del dashboard cambió completamente cómo tomamos decisiones."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-accent font-display font-bold text-sm">DR</span>
            </div>
            <div className="text-left">
              <p className="text-white font-display font-bold text-sm">Director de Marketing</p>
              <p className="text-text-dim font-mono text-[10px]">E-COMMERCE // ARGENTINA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA with Scarcity */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-8 tracking-tighter">
            ¿ESTÁS LISTO PARA EL <br />
            <span className="text-accent">NIVEL TÁCTICO?</span>
          </h2>
          <p className="text-text-dim text-lg font-sans mb-6">
            No aceptamos a todos los clientes. Solo a aquellos que buscan dominar su nicho con infraestructura real.
          </p>

          {/* Scarcity Indicator */}
          <div className="inline-block border border-accent/20 bg-accent/5 px-6 py-3 mb-10">
            <p className="text-accent font-mono text-xs tracking-widest uppercase">
              <span className="animate-pulse inline-block mr-2">●</span>
              ABRIL 2026: 3 DE 5 CUPOS DISPONIBLES
            </p>
          </div>

          <div className="block">
            <button
              onClick={openCalendly}
              className="inline-block bg-white text-black font-display font-bold px-12 py-5 text-sm hover:bg-accent transition-colors uppercase tracking-[0.3em] cursor-pointer"
            >
              Solicitar Auditoría Táctica
            </button>
          </div>
        </div>
      </section>

      {/* Footer Log */}
      <footer className="py-10 px-6 border-t border-white/5 bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] text-text-dim font-mono tracking-widest uppercase">
            © 2026 CACHE AGENCY // ALL RIGHTS RESERVED <BlinkingCursor />
          </p>
          <div className="flex gap-8">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-[9px] text-text-dim hover:text-accent font-mono tracking-widest uppercase transition-colors">Twitter // X</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[9px] text-text-dim hover:text-accent font-mono tracking-widest uppercase transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
