import { Link } from 'react-router-dom'
import HudPanel from '../components/HudPanel'
import BlinkingCursor from '../components/BlinkingCursor'

export default function LandingPage() {
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
          <div className="flex flex-wrap gap-4">
            <button className="bg-accent text-black font-display font-bold px-8 py-4 text-sm hover:bg-white transition-colors uppercase tracking-widest">
              Solicitar Auditoria Táctica
            </button>
            <Link to="/login" className="px-8 py-4 border border-white/10 text-white font-mono text-xs hover:border-accent/40 transition-all flex items-center gap-2 uppercase">
              Ver Demo Live <span className="text-accent animate-pulse">●</span>
            </Link>
          </div>
        </div>

        {/* Decorative Grid Background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--color-accent) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
        </div>
      </header>

      {/* Infrastructure Section (Visual Tour) */}
      <section className="py-20 px-6 border-t border-white/5 bg-bg-secondary/30">
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

      {/* Trust / Stats Section */}
      <section className="py-20 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
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
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-8 tracking-tighter">
            ¿ESTÁS LISTO PARA EL <br />
            <span className="text-accent">NIVEL TÁCTICO?</span>
          </h2>
          <p className="text-text-dim text-lg font-sans mb-12">
            No aceptamos a todos los clientes. Solo a aquellos que buscan dominar su nicho con infraestructura real.
          </p>
          <button className="bg-white text-black font-display font-bold px-12 py-5 text-sm hover:bg-accent transition-colors uppercase tracking-[0.3em]">
            Desplegar ahora
          </button>
        </div>
      </section>

      {/* Footer Log */}
      <footer className="py-10 px-6 border-t border-white/5 bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] text-text-dim font-mono tracking-widest uppercase">
            © 2026 CACHE AGENCY // ALL RIGHTS RESERVED <BlinkingCursor />
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[9px] text-text-dim hover:text-accent font-mono tracking-widest uppercase transition-colors">Twitter // X</a>
            <a href="#" className="text-[9px] text-text-dim hover:text-accent font-mono tracking-widest uppercase transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
