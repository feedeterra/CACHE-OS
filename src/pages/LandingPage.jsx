import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate, AnimatePresence } from 'framer-motion'

// ─── Data ───────────────────────────────────────────────────────────────────

const CLIENTS = [
  'VEMPRA VIAJES', 'VITALE ORFEBRERÍA', 'HR EXPRESS', 'LATE METAL JOYAS',
  'VEMPRA MENDOZA', 'VARU DISTRIBUIDORA', 'CASA DURÁN', 'BELLITA',
  'RAKAN POPCORN', 'VARU HERRAMIENTAS', 'VERDA JOYERÍA', 'WINCO',
  'TU MOTO BAHÍA BLANCA', 'ORYX', 'CAMPBELL', 'BAMBI', 'STAR TRAK',
]

const TOOLS = [
  'Meta Ads', 'TikTok Ads', 'Kommo CRM', 'ManyChat',
  'Tiendanube', 'Antigravity', 'Claude Code', 'Hostinger',
]

const STATS = [
  { raw: 64, prefix: '+', suffix: '', label: 'Empresas que trabajaron con nosotros', context: 'E-commerce, mayoristas, servicios, viajes' },
  { raw: 24.8, prefix: '$', suffix: 'M', label: 'Inversión publicitaria gestionada', context: 'Solo en Meta Ads en Argentina' },
  { raw: 315, prefix: '+', suffix: '', label: 'Productos y servicios validados', context: 'Con datos reales de mercado' },
  { raw: 7, prefix: '3–', suffix: 'd', label: 'Para validar si hay mercado', context: 'Sin quemar presupuesto de más' },
]

const TESTIMONIALS = [
  {
    quote: 'En 2 semanas optimizamos el catálogo y supimos exactamente qué se vendía. Escalamos los productos ganadores y validamos precios con datos reales, no con intuición.',
    name: 'Nico', company: 'Vempra',
  },
  {
    quote: 'No sabíamos cuánto nos costaba cada cliente. Con CACHE empezamos a medirlo de verdad: usamos IA y CRM para dirigirnos solo a los que realmente iban a comprar.',
    name: 'Vale', company: 'Winco',
  },
  {
    quote: 'Cubren todo de punta a punta: estrategia, contenido, Meta, CRM, API de conversiones, dashboard, IA y Tiendanube. Dejamos de depender de cinco proveedores distintos.',
    name: 'Ale', company: 'Varu Distribuidora',
  },
  {
    quote: 'En 60 días bajamos el CPA un 42% y duplicamos los leads calificados. Ahora tomamos decisiones con datos, no con suposiciones.',
    name: 'Rubén', company: 'Bellita',
  },
]

const WA = 'https://wa.me/5492346306562?text=Hola%2C%20quiero%20hablar%20con%20un%20experto%20para%20generar%20una%20reuni%C3%B3n'

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}


const slideRight = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1.2) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: v => {
        // Si el target tiene decimales, mostramos un decimal
        const isDecimal = target % 1 !== 0
        setValue(isDecimal ? parseFloat(v.toFixed(1)) : Math.round(v))
      },
    })
    return () => controls.stop()
  }, [inView, target, duration])

  return [ref, value]
}

// ─── Shared components ───────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

function SectionLabel({ children, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          height: '1px', width: '24px', transformOrigin: 'left',
          backgroundColor: light ? '#f5a623' : '#d48a0a',
          flexShrink: 0,
        }}
      />
      <p style={{
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', margin: 0,
        color: light ? '#f5a623' : '#d48a0a',
      }}>
        {children}
      </p>
    </div>
  )
}

function FaseTag({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'inline-block',
        backgroundColor: '#f5e6c8', border: '1px solid #e8c87a',
        borderRadius: '6px', padding: '4px 12px', marginBottom: '20px',
      }}
    >
      <span style={{ color: '#7a4e00', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em' }}>
        {children}
      </span>
    </motion.div>
  )
}

// ─── Stat counter card ───────────────────────────────────────────────────────

function StatCard({ raw, prefix, suffix, label, context, light }) {
  const [ref, value] = useCountUp(raw, 1.4)
  const display = suffix === 'd' ? '3–7d' : `${prefix}${value}${suffix}`

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p style={{
        fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 800,
        color: light ? '#f5a623' : '#d48a0a',
        lineHeight: 1, marginBottom: '6px', letterSpacing: '-0.03em',
      }}>
        {display}
      </p>
      <p style={{ fontSize: '0.85rem', color: light ? '#ccc' : '#333', lineHeight: 1.45, fontWeight: 600, marginBottom: '4px' }}>{label}</p>
      {context && <p style={{ fontSize: '0.72rem', color: light ? '#777' : '#999', lineHeight: 1.4 }}>{context}</p>}
    </motion.div>
  )
}

function TestimonialSlider() {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setDir(1)
      setIndex(prev => (prev + 1) % TESTIMONIALS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  function goTo(i) {
    setDir(i > index ? 1 : -1)
    setIndex(i)
  }

  const t = TESTIMONIALS[index]

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        backgroundColor: '#fff', border: '1px solid #d8d4cd',
        borderRadius: '16px', padding: 'clamp(24px, 5vw, 48px) clamp(20px, 5vw, 40px)',
        minHeight: 'unset', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', justifyContent: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative',
      }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <p style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', fontStyle: 'italic',
              color: '#1a1a1a', lineHeight: 1.6, marginBottom: '20px',
              fontWeight: 500, letterSpacing: '-0.01em', maxWidth: '700px',
            }}>
              "{t.quote}"
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: '#f8f7f4', border: '1px solid #d8d4cd',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#d48a0a', fontSize: '1rem',
              }}>
                {t.name.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem' }}>{t.name}</p>
                <p style={{ color: '#d48a0a', fontSize: '0.85rem', fontWeight: 600 }}>{t.company}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
        {TESTIMONIALS.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => goTo(i)}
            animate={{ width: i === index ? 24 : 8, backgroundColor: i === index ? '#d48a0a' : '#d8d4cd' }}
            transition={{ duration: 0.3 }}
            style={{ height: 8, borderRadius: 4, border: 'none', cursor: 'pointer' }}
          />
        ))}
      </div>
    </div>
  )
}

const ROTATING_WORDS = ['vende.', 'escala.', 'rinde.', 'convierte.']

function RotatingH1({ mobile = false }) {
  const [wordIndex, setWordIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length)
        setVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.h1
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      style={{
        fontSize: mobile ? 'clamp(2rem, 9vw, 3rem)' : 'clamp(3.2rem, 6vw, 6.5rem)',
        fontWeight: 900, lineHeight: 0.96,
        letterSpacing: '-0.02em', color: '#fff',
        textTransform: 'uppercase',
        width: '100%', marginBottom: 0,
        textAlign: mobile ? 'center' : 'left',
      }}
    >
      <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Publicidad que</span>
      <div style={{ display: 'block', height: '1.05em', overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: '0%' }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'block', color: '#d48a0a', position: 'absolute', left: 0, right: 0, textAlign: 'inherit' }}
          >
            {ROTATING_WORDS[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.h1>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef(null)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#f0eeea', color: '#1a1a1a' }}
         className="min-h-screen overflow-x-hidden">

      {/* ── NAV ── */}
      <nav style={{ backgroundColor: 'rgba(17,17,17,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
           className="fixed top-0 w-full z-40 px-5 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>CACHE</span>
          <Link to="/login" style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}
                className="hover:text-white transition-colors">
            Acceso clientes
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100svh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '100px 24px 48px',
          position: 'relative', overflow: 'hidden',
          backgroundColor: '#111',
        }}
      >
        {/* Background blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* Blob top-right */}
          <motion.div
            animate={{ y: [0, -24, 0], x: [0, 12, 0], scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '-10%', right: '-5%',
              width: '55vw', height: '55vw', maxWidth: '600px', maxHeight: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,138,10,0.22) 0%, transparent 75%)',
              filter: 'blur(60px)',
            }}
          />
          {/* Blob bottom-left */}
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -14, 0], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut', delay: 2 }}
            style={{
              position: 'absolute', bottom: '5%', left: '-8%',
              width: '45vw', height: '45vw', maxWidth: '480px', maxHeight: '480px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,138,10,0.13) 0%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
          {/* Center subtle glow */}
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 1 }}
            style={{
              position: 'absolute', top: '30%', left: '20%',
              width: '40vw', height: '30vw', maxWidth: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,230,180,0.15) 0%, transparent 65%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto w-full" style={{ position: 'relative', zIndex: 1 }}>

          {/* ── MOBILE: columna centrada ── */}
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="flex md:hidden flex-col items-center text-center"
          >
            <motion.div variants={fadeUp} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#f5e6c8', border: '1px solid #e8c87a',
              borderRadius: '100px', padding: '4px 12px', marginBottom: '16px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d48a0a', display: 'inline-block' }} />
              <span style={{ color: '#7a4e00', fontSize: '0.72rem', fontWeight: 600 }}>Agencia de Performance</span>
            </motion.div>

            <RotatingH1 mobile />

            <motion.p variants={fadeUp} style={{ fontSize: '0.95rem', color: '#aaa', lineHeight: 1.6, marginTop: '16px', width: '100%' }}>
              Validamos tu producto en <strong style={{ color: '#fff' }}>3 a 7 días</strong> y escalamos lo que funciona.
            </motion.p>

            {/* Mini stats row */}
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0', marginTop: '20px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 0' }}>
              {[
                { n: '+64', label: 'empresas' },
                { n: '+315', label: 'productos' },
                { n: '$24M', label: 'gestionados' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <p style={{ fontWeight: 800, color: '#d48a0a', fontSize: '1.1rem', lineHeight: 1 }}>{s.n}</p>
                  <p style={{ color: '#555', fontSize: '0.65rem', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} style={{ marginTop: '20px', width: '100%' }}>
              <motion.a href={WA} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backgroundColor: '#d48a0a', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  padding: '13px 20px', borderRadius: '10px', textDecoration: 'none', width: '100%',
                  boxShadow: '0 4px 20px rgba(212,138,10,0.32)',
                }}
                whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}
              >
                <WhatsAppIcon />
                Analizamos tu situación gratis →
              </motion.a>
              <p style={{ color: '#555', fontSize: '0.72rem', marginTop: '8px' }}>Sin compromiso · Respondemos en el día</p>
            </motion.div>
          </motion.div>

          {/* ── DESKTOP: todo izquierda + testimonio flotante derecha ── */}
          <div className="hidden md:block" style={{ position: 'relative' }}>

            <motion.div
              initial="hidden" animate="visible" variants={stagger}
              style={{ maxWidth: '620px', display: 'flex', flexDirection: 'column' }}
            >
              <motion.div variants={fadeUp} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#f5e6c8', border: '1px solid #e8c87a',
                borderRadius: '100px', padding: '5px 14px', marginBottom: '28px',
                alignSelf: 'flex-start',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#d48a0a', display: 'inline-block' }} />
                <span style={{ color: '#7a4e00', fontSize: '0.78rem', fontWeight: 600 }}>Agencia de Performance</span>
              </motion.div>

              <RotatingH1 />

              <motion.p variants={fadeUp} style={{ fontSize: '1.05rem', color: '#aaa', lineHeight: 1.75, marginTop: '28px', marginBottom: '36px', maxWidth: '500px' }}>
                Validamos cualquier producto o servicio en el mercado argentino en{' '}
                <strong style={{ color: '#fff', fontWeight: 700 }}>3 a 7 días</strong>.
                Métricas reales y un proceso que escala basado en datos, no en intuición.
              </motion.p>

              <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <motion.a href={WA} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    backgroundColor: '#d48a0a', color: '#fff', fontWeight: 700, fontSize: '1rem',
                    padding: '16px 28px', borderRadius: '10px', textDecoration: 'none',
                    boxShadow: '0 4px 24px rgba(212,138,10,0.32)',
                  }}
                  whileHover={{ backgroundColor: '#b87608', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}
                >
                  <WhatsAppIcon />
                  Analizamos tu situación gratis →
                </motion.a>
                <p style={{ color: '#555', fontSize: '0.78rem', lineHeight: 1.5 }}>Sin compromiso<br />Respondemos en el día</p>
              </motion.div>
            </motion.div>

            {/* Testimonios flotantes — columna derecha */}
            {[
              { initial: 'R', name: 'Rubén · Bellita', quote: 'En 60 días bajamos el costo por cliente un 42% y duplicamos los leads.', delay: 1.0 },
              { initial: 'N', name: 'Nico · Vempra', quote: 'En 2 semanas supimos exactamente qué se vendía. Escalamos los ganadores.', delay: 1.15 },
              { initial: 'V', name: 'Vale · Winco', quote: 'Empezamos a medir el costo real por cliente. Cambió todo.', delay: 1.3 },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: t.delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: `${18 + i * 32}%`,
                  width: '210px',
                }}
              >
                <div style={{ display: 'flex', gap: '11px' }}>
                  <div style={{
                    width: '2px', flexShrink: 0, borderRadius: '2px',
                    background: 'linear-gradient(to bottom, transparent, rgba(212,138,10,0.5), transparent)',
                  }} />
                  <div>
                    <p style={{ color: '#666', fontSize: '0.75rem', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '8px' }}>
                      "{t.quote}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, color: '#d48a0a', fontSize: '0.64rem',
                      }}>{t.initial}</div>
                      <p style={{ color: '#444', fontSize: '0.68rem' }}>{t.name}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

          </div>

        </div>

        {/* Scroll hint mobile */}
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '32px' }}
        >
          <p style={{ fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Seguí leyendo</p>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
              <path d="M8 3v10M4 9l4 4 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: '1px solid #d8d4cd', borderBottom: '1px solid #d8d4cd', backgroundColor: '#e8e6e2', padding: '56px 20px' }}>
        <motion.div
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          {STATS.map((s, i) => (
            <motion.div key={i} variants={fadeUp}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <section style={{ padding: '28px 0', borderBottom: '1px solid #d8d4cd', overflow: 'hidden', backgroundColor: '#f0eeea' }}>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Confiaron en nosotros
        </p>
        <div className="relative w-full overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
               style={{ background: 'linear-gradient(to right, #f0eeea, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
               style={{ background: 'linear-gradient(to left, #f0eeea, transparent)' }} />
          <div className="flex animate-marquee whitespace-nowrap">
            {[...CLIENTS, ...CLIENTS].map((name, i) => (
              <span key={i} className="inline-flex items-center mx-6 md:mx-10">
                <span style={{ color: '#d48a0a', fontSize: '7px', marginRight: '8px' }}>◆</span>
                <span style={{ fontWeight: 700, color: '#aaa', fontSize: '0.75rem', letterSpacing: '0.12em' }}>{name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* ── DOS CAMINOS ── */}
      <section style={{ padding: 'clamp(56px, 10vw, 96px) 20px', backgroundColor: '#e8e6e2' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}><SectionLabel>El proceso se adapta a cómo vendés</SectionLabel></motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111', lineHeight: 1.05, marginBottom: '24px' }}>
              Dos formas de vender.<br />
              <span style={{ color: '#d48a0a' }}>Un solo proceso.</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.7, maxWidth: '680px', margin: '0 auto' }}>
              No somos un proveedor externo; aprendemos de tus productos, entendemos a tu cliente y armamos una estrategia a medida para que escales con <strong style={{ color: '#111' }}>certeza</strong>, no con suposiciones.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-5"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{ border: '1px solid #d8d4cd', borderRadius: '16px', padding: '36px', backgroundColor: '#f0eeea' }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#999', textTransform: 'uppercase', marginBottom: '16px' }}>Venta directa</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', marginBottom: '14px', lineHeight: 1.2 }}>Mi cliente compra solo.</h3>
              <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '28px', fontSize: '0.95rem' }}>
                Productos físicos o digitales. Checkout, pago, entrega. Cuando la oferta, el creativo y la audiencia están alineados, el producto se vende solo. El problema es encontrar ese punto de equilibrio sin quemar el presupuesto.
              </p>
              <div style={{ borderTop: '1px solid #d8d4cd', paddingTop: '20px' }}>
                <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>Métrica que define tu rentabilidad</p>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem' }}>CPA real por venta</p>
              </div>
            </motion.div>

            <motion.div
              variants={slideRight}
              whileHover={{ y: -4, boxShadow: '0 8px 48px rgba(212,138,10,0.18)', transition: { duration: 0.2 } }}
              style={{ border: '2px solid #d48a0a', borderRadius: '16px', padding: '36px', backgroundColor: '#fdf7ec', boxShadow: '0 0 32px rgba(212,138,10,0.1)' }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#d48a0a', textTransform: 'uppercase', marginBottom: '16px' }}>Venta por conversación</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', marginBottom: '14px', lineHeight: 1.2 }}>Mi cliente me escribe antes de comprar.</h3>
              <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '28px', fontSize: '0.95rem' }}>
                Cerrás por mensaje, por llamada, por visita. Ticket alto, decisión más lenta. Acá el creativo tiene que atraer al cliente correcto, no a cualquiera. Un lead barato que no cierra es más caro que uno caro que sí.
              </p>
              <div style={{ borderTop: '1px solid #fde68a', paddingTop: '20px' }}>
                <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>Métrica que define tu rentabilidad</p>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem' }}>CPA real por lead que cierra</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.6 }}
            style={{ textAlign: 'center', color: '#666', marginTop: '36px', fontSize: '1rem', lineHeight: 1.7 }}
          >
            El proceso es el mismo. Lo que cambia es qué medimos como conversión.<br />
            Empezamos entendiendo cómo vendés, y construimos la estrategia desde ahí.
          </motion.p>
        </div>
      </section>

      {/* ── FASE 1 ── */}
      <section style={{ padding: 'clamp(56px, 10vw, 96px) 20px', backgroundColor: '#f0eeea', borderTop: '1px solid #d8d4cd', borderBottom: '1px solid #d8d4cd' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}><FaseTag>FASE 1 · DÍA 1 AL 7</FaseTag></motion.div>
              <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#111', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '20px' }}>
                Cualquier producto.<br />
                Cualquier catálogo.<br />
                <span style={{ color: '#d48a0a' }}>Una verdad.</span>
              </motion.h2>
              <motion.p variants={fadeUp} style={{ color: '#555', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '16px' }}>
                Diseñamos el test con <strong style={{ color: '#111' }}>creatividad de alto nivel</strong> y lo corremos en Meta Ads. En menos de una semana, los números hablan.
              </motion.p>
              <motion.p variants={fadeUp} style={{ color: '#555', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Si funciona, <strong style={{ color: '#d48a0a' }}>escalamos</strong>. Si no, cortamos antes de seguir tirando plata a la basura.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              style={{ backgroundColor: '#e8e6e2', border: '1px solid #d8d4cd', borderRadius: '16px', padding: '36px' }}
            >
              {[
                { icon: '🎯', title: 'Encontramos el mercado', desc: 'El mismo producto le funciona a una audiencia y le cuesta el triple a otra. Identificamos el segmento exacto donde tu CPA cierra los números.' },
                { icon: '⚡', title: 'Resultado en días, no en meses', desc: 'Sin contratos largos ni promesas. En 3 a 7 días sabés si hay mercado. Con datos. No con intuición.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    paddingBottom: i === 0 ? '28px' : 0,
                    marginBottom: i === 0 ? '28px' : 0,
                    borderBottom: i === 0 ? '1px solid #d0ccc5' : 'none',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#f8f7f4', border: '1px solid #d8d4cd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#111', marginBottom: '6px' }}>{item.title}</p>
                    <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FASE 2: CPA REAL ── */}
      <section style={{ padding: 'clamp(56px, 10vw, 96px) 20px', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
        {/* Fondo glow naranja difuso — animated pulse */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%', height: '60%',
            background: 'radial-gradient(ellipse, rgba(245,166,35,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '6px', padding: '4px 12px', marginBottom: '20px' }}>
                <span style={{ color: '#f5a623', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>FASE 2 · LA MÉTRICA QUE IMPORTA</span>
              </div>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '16px' }}>
              El ROAS miente.<br />
              El <span style={{ color: '#f5a623' }}>CPA real</span> decide<br />
              si tu negocio es rentable.
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#888', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              No importa si vendés a $5.000 o $5.000.000. La pregunta que define todo es la misma: ¿cuánto te cuesta conseguir un cliente que realmente paga?
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {[
              { n: '01', title: 'El ROAS se infla', desc: 'Atribuciones dobles, ventas orgánicas contadas como paid, iOS 14 rompiendo el pixel. El número de Ads Manager no es tu realidad.', accent: false },
              { n: '02', title: 'El costo por lead engaña', desc: 'Leads baratos que no cierran son más caros que leads caros que compran. Medir el lead sin medir la venta es operar a ciegas.', accent: false },
              { n: '03', title: 'El CPA real es la verdad', desc: 'Cuánto te cuesta un cliente que paga. De este número depende si escalás basado en datos o si estás quemando presupuesto sin saberlo.', accent: true },
            ].map((c, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                style={{
                  borderRadius: '16px', padding: '32px',
                  border: c.accent ? '2px solid #f5a623' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: c.accent ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.04)',
                  boxShadow: c.accent ? '0 0 40px rgba(245,166,35,0.12)' : 'none',
                }}
              >
                <p style={{ fontSize: '2rem', fontWeight: 800, color: c.accent ? '#f5a623' : '#333', marginBottom: '16px' }}>{c.n}</p>
                <p style={{ fontWeight: 700, color: '#fff', marginBottom: '10px', fontSize: '1.05rem' }}>{c.title}</p>
                <p style={{ color: '#777', fontSize: '0.9rem', lineHeight: 1.7 }}>{c.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FASE 3: CREATIVIDAD ── */}
      <section style={{ padding: 'clamp(56px, 10vw, 96px) 0', backgroundColor: '#f0eeea', borderBottom: '1px solid #d8d4cd', overflow: 'hidden' }}>
        <div className="max-w-6xl mx-auto" style={{ padding: '0 20px' }}>

          {/* Título + copy: 2 cols en desktop, 1 col en mobile */}
          <div className="grid md:grid-cols-2 gap-10 items-start" style={{ marginBottom: '40px' }}>
            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}><FaseTag>FASE 3 · EL MOTOR DE ESCALA</FaseTag></motion.div>
              <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#111', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '20px' }}>
                Un creativo ganador<br />
                no es una estrategia.<br />
                <span style={{ color: '#d48a0a' }}>Es un accidente.</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} style={{ color: '#555', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '16px' }}>
                El algoritmo premia la variedad. Cuando siempre mostrás lo mismo, la audiencia se satura y el costo sube. Producimos múltiples <strong style={{ color: '#111' }}>ángulos, formatos y hooks</strong> para que siempre haya algo fresco que probar.
              </motion.p>
              <motion.p variants={fadeUp} style={{ color: '#555', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Cada creativo prueba una hipótesis. Los que funcionan, se escalan. Los que no, enseñan algo. Así construimos un <strong style={{ color: '#111' }}>banco de conocimiento</strong> sobre tu cliente que ningún competidor puede comprar.
              </motion.p>
            </motion.div>
          </div>

          {/* Tarjetas: 4 cols en desktop, 2 cols en mobile */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            style={{ marginBottom: '36px' }}
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {[
              { icon: '🎨', label: 'Ángulos creativos', desc: 'Distintos enfoques para el mismo producto' },
              { icon: '📐', label: 'Formatos múltiples', desc: 'Video, imagen, carrusel, UGC' },
              { icon: '🪝', label: 'Hook + retención', desc: 'Los primeros 3 segundos atrapan. Los siguientes 15 convierten.' },
              { icon: '📈', label: 'Escala sostenida', desc: 'CPA estable a medida que crecés' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.07)', transition: { duration: 0.2 } }}
                style={{ border: '1px solid #d8d4cd', borderRadius: '12px', padding: '20px', backgroundColor: '#e8e6e2', cursor: 'default' }}
              >
                <span style={{ fontSize: '1.3rem', display: 'block', marginBottom: '10px' }}>{item.icon}</span>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '0.85rem', marginBottom: '6px' }}>{item.label}</p>
                <p style={{ color: '#888', fontSize: '0.78rem', lineHeight: 1.5 }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Stack marquee: full width, fuera del max-w container */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <p style={{ fontSize: '0.68rem', color: '#aaa', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '14px', textAlign: 'center' }}>
            Stack de herramientas
          </p>
          <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#111', padding: '14px 0' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to right, #111, transparent)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to left, #111, transparent)' }} />
            <div className="flex animate-marquee whitespace-nowrap">
              {[...TOOLS, ...TOOLS].map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block', flexShrink: 0,
                    fontSize: '0.78rem', fontWeight: 600, color: '#d48a0a',
                    backgroundColor: 'rgba(212,138,10,0.08)',
                    border: '1px solid rgba(212,138,10,0.45)',
                    borderRadius: '100px', padding: '6px 18px', margin: '0 8px',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section style={{ padding: 'clamp(56px, 10vw, 96px) 20px', backgroundColor: '#e8e6e2' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-14"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}><SectionLabel>Clientes reales</SectionLabel></motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111', lineHeight: 1.1 }}>
              Lo que cambia cuando<br />el proceso funciona.
            </motion.h2>
          </motion.div>

          <TestimonialSlider />
        </div>
      </section>

      {/* ── FILTRO ── */}
      <section style={{ padding: 'clamp(56px, 10vw, 96px) 20px', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: '50%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(245,166,35,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <SectionLabel light>Esto es para vos si...</SectionLabel>
            </motion.div>
            {[
              'Tenés un producto o servicio y querés saber si tiene mercado',
              'Estás invirtiendo en publicidad pero no sabés cuánto te cuesta cada cliente',
              'Vendés por WhatsApp, por visita, por llamada o por checkout',
              'Querés escalar sin quemar presupuesto en pruebas sin método',
              'Te tomás el mercado argentino en serio y querés competir de verdad',
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: '#d4d0c8', fontSize: '0.95rem', lineHeight: 1.55 }}>{item}</p>
              </motion.div>
            ))}
            <motion.div variants={fadeUp} style={{ marginTop: '28px' }}>
              <motion.a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  backgroundColor: '#d48a0a', color: '#fff',
                  fontWeight: 700, fontSize: '0.9rem',
                  padding: '12px 22px', borderRadius: '8px',
                  textDecoration: 'none',
                }}
                whileHover={{ backgroundColor: '#b87608' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                Hablá con nosotros →
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.div
            className="text-center md:text-left"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={slideRight}
          >
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '20px' }}>
              No aceptamos<br />a todos.<br />
              <span style={{ color: '#f5a623' }}>Aceptamos<br />a los que van en serio.</span>
            </h2>
            <p style={{ color: '#aaa', lineHeight: 1.7, fontSize: '0.95rem' }}>
              Si llegaste hasta acá, probablemente sos de los que entienden que escalar requiere proceso, no suerte. Eso ya es suficiente para hablar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: 'clamp(72px, 14vw, 120px) 20px', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: 'radial-gradient(ellipse, rgba(37,211,102,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
          />
        </div>

        <motion.div
          className="max-w-3xl mx-auto text-center"
          style={{ position: 'relative', zIndex: 1 }}
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(2.2rem, 7vw, 4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.0, marginBottom: '20px', textTransform: 'uppercase' }}>
            Publicidad que<br />
            <span style={{ color: '#25D366' }}>cierra ventas.</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: '#888', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 12px' }}>
            30 minutos. Sin compromiso. Si te podemos ayudar, te lo decimos. Si no, tambien.
          </motion.p>
          <motion.p variants={fadeUp} style={{ color: 'rgba(37,211,102,0.7)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '36px', letterSpacing: '0.04em' }}>
            MAXIMO 3 CLIENTES NUEVOS POR MES
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                backgroundColor: '#25D366', color: '#fff',
                fontWeight: 700, fontSize: '1rem',
                padding: '16px 32px', borderRadius: '12px',
                textDecoration: 'none', width: '100%', maxWidth: '360px',
                justifyContent: 'center',
                boxShadow: '0 4px 32px rgba(37,211,102,0.3)',
              }}
              whileHover={{ backgroundColor: '#1ebe5d', scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <WhatsAppIcon />
              Hablá con un experto gratis
            </motion.a>
          </motion.div>
          <motion.p variants={fadeUp} style={{ marginTop: '14px', color: '#444', fontSize: '0.8rem' }}>
            Respondemos en el dia
          </motion.p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #d8d4cd', padding: '40px 20px', backgroundColor: '#e8e6e2' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
            <span style={{ fontWeight: 800, color: '#111', fontSize: '0.9rem' }}>CACHE</span>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#111', color: '#fff',
                fontWeight: 600, fontSize: '0.85rem',
                padding: '10px 20px', borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              <WhatsAppIcon />
              Hablá con nosotros
            </a>
            <div className="flex gap-6">
              <Link to="/login" style={{ color: '#999', fontSize: '0.8rem', textDecoration: 'none' }}>Acceso clientes</Link>
            </div>
          </div>
          <p style={{ color: '#bbb', fontSize: '0.72rem', textAlign: 'center' }}>© 2026 CACHE Agency · Argentina</p>
        </div>
      </footer>
    </div>
  )
}
