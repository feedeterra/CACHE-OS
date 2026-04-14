import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate, AnimatePresence, useScroll, useSpring } from 'framer-motion'

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
    quote: 'En 60 días bajamos el CPA un 42% y duplicamos los leads calificados. Ahora tomamos decisiones con datos, no con suposiciones.',
    name: 'Rubén', company: 'Bellita', metric: 'CPA -42%',
  },
  {
    quote: 'En 15 días identificamos los productos ganadores y el ROAS real subió un 40%. Cortamos lo que no funcionaba y el costo por venta bajó un 35%.',
    name: 'Nico', company: 'Vempra', metric: 'ROAS +40%',
  },
  {
    quote: 'No sabíamos cuánto nos costaba cada cliente. Redujimos el costo por lead a la mitad en el primer mes de trabajo con CACHE.',
    name: 'Vale', company: 'Winco', metric: 'CPL -50%',
  },
  {
    quote: 'Consolidar la pauta nos permitió escalar la inversión un 3x manteniendo el CPA bajo. El ROAS real mejoró un 60% en el primer trimestre.',
    name: 'Ale', company: 'Varu Distribuidora', metric: 'ESCALA 3X',
  },
]

const WA = 'https://wa.me/5492346306562?text=Hola%2C%20quiero%20que%20analicen%20mi%20cuenta%20de%20Meta%20Ads%20y%20ver%20c%C3%B3mo%20mejorar%20mis%20resultados'

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

const floating = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
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

function TestimonialGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      {TESTIMONIALS.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            backgroundColor: '#fff',
            border: '1px solid #d8d4cd',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                backgroundColor: '#f8f7f4', border: '1px solid #d8d4cd',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#d48a0a', fontSize: '0.75rem',
              }}>
                {t.name.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 800, color: '#111', fontSize: '0.85rem', lineHeight: 1.2 }}>{t.name}</p>
                <p style={{ color: '#d48a0a', fontSize: '0.7rem', fontWeight: 600 }}>{t.company}</p>
              </div>
            </div>
            <motion.div 
              variants={floating}
              animate="animate"
              style={{
                backgroundColor: 'rgba(212,138,10,0.08)',
                border: '1px solid rgba(212,138,10,0.25)',
                borderRadius: '6px',
                padding: '4px 10px',
                color: '#d48a0a',
                fontSize: '0.65rem',
                fontWeight: 800,
              }}
            >
              {t.metric}
            </motion.div>
          </div>
          
          <p style={{
            fontSize: '0.88rem',
            fontStyle: 'italic',
            color: '#333',
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 500,
          }}>
            "{t.quote}"
          </p>
        </motion.div>
      ))}
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
  const [strategy, setStrategy] = useState('ecommerce')
  
  // Scroll Progress Logic
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#f0eeea', color: '#1a1a1a' }}
         className="min-h-screen overflow-x-hidden">

      {/* ── SCROLL PROGRESS BAR ── */}
      <motion.div
        style={{
          scaleX,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: '#d48a0a',
          transformOrigin: '0%',
          zIndex: 100,
          boxShadow: '0 0 10px rgba(212,138,10,0.4)',
        }}
      />

      {/* ── NAV ── */}
      <nav style={{ backgroundColor: 'rgba(17,17,17,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
           className="fixed top-0 w-full z-40 px-5 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 10, height: 10, backgroundColor: '#d48a0a', transform: 'rotate(45deg)', borderRadius: '1px' }} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>CACHE</span>
          </div>
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
          padding: 'clamp(80px, 12vh, 120px) 24px 40px',
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
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#f5e6c8', border: '1px solid #e8c87a',
              borderRadius: '100px', padding: '5px 16px', marginBottom: '20px',
            }}>
              <div style={{ width: 6, height: 6, backgroundColor: '#d48a0a', transform: 'rotate(45deg)', borderRadius: '1px' }} />
              <span style={{ color: '#7a4e00', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em' }}>Agencia de Performance</span>
            </motion.div>

            <RotatingH1 mobile />

            <motion.p variants={fadeUp} style={{ fontSize: '0.95rem', color: '#aaa', lineHeight: 1.6, marginTop: '16px', width: '100%' }}>
              Si invertís en publicidad y no sabés exactamente cuánto te cuesta cada venta, ese es tu problema. Lo resolvemos en <strong style={{ color: '#fff' }}>3 a 7 días</strong>.
            </motion.p>

            <motion.p variants={fadeUp} style={{ fontSize: '0.72rem', color: 'rgba(212,138,10,0.8)', fontWeight: 600, marginTop: '10px', letterSpacing: '0.04em' }}>
              2 LUGARES DISPONIBLES ESTE MES
            </motion.p>

            {/* Mini stats row */}
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0', marginTop: '16px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 0' }}>
              {[
                { n: '+64', label: 'empresas' },
                { n: '+315', label: 'productos' },
                { n: '$24M', label: 'gestionados' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <p style={{ fontWeight: 800, color: '#d48a0a', fontSize: '1rem', lineHeight: 1 }}>{s.n}</p>
                  <p style={{ color: '#555', fontSize: '0.6rem', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} style={{ marginTop: '16px', width: '100%' }}>
              <motion.a href={WA} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backgroundColor: '#d48a0a', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                  padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', width: '100%',
                  boxShadow: '0 4px 20px rgba(212,138,10,0.32)',
                }}
                whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}
              >
                <WhatsAppIcon />
                Analizamos tu situación gratis →
              </motion.a>
              <p style={{ color: '#555', fontSize: '0.68rem', marginTop: '6px' }}>Sin compromiso · Respondemos en el día</p>
            </motion.div>
          </motion.div>

          {/* ── DESKTOP: todo izquierda + testimonio flotante derecha ── */}
          <div className="hidden md:block" style={{ position: 'relative' }}>

            <motion.div
              initial="hidden" animate="visible" variants={stagger}
              style={{ maxWidth: '620px', display: 'flex', flexDirection: 'column' }}
            >
              <motion.div variants={fadeUp} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#f5e6c8', border: '1px solid #e8c87a',
                borderRadius: '100px', padding: '6px 18px', marginBottom: '28px',
                alignSelf: 'flex-start',
              }}>
                <div style={{ width: 7, height: 7, backgroundColor: '#d48a0a', transform: 'rotate(45deg)', borderRadius: '1px' }} />
                <span style={{ color: '#7a4e00', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.02em' }}>Agencia de Performance</span>
              </motion.div>

              <RotatingH1 />

              <motion.p variants={fadeUp} style={{ fontSize: '1.05rem', color: '#aaa', lineHeight: 1.75, marginTop: '28px', marginBottom: '8px', maxWidth: '500px' }}>
                Si invertís en publicidad y todavía no sabés exactamente cuánto te cuesta cada venta, ese es tu problema. Lo resolvemos con datos reales en <strong style={{ color: '#fff', fontWeight: 700 }}>3 a 7 días</strong>.
              </motion.p>

              <motion.p variants={fadeUp} style={{ fontSize: '0.75rem', color: 'rgba(212,138,10,0.8)', fontWeight: 600, marginBottom: '28px', letterSpacing: '0.05em' }}>
                2 LUGARES DISPONIBLES ESTE MES
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
                  Pedí tu diagnóstico gratuito →
                </motion.a>
                <p style={{ color: '#555', fontSize: '0.78rem', lineHeight: 1.5 }}>30 min · Sin compromiso<br />Respondemos en el día</p>
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
      <section style={{ borderTop: '1px solid #d8d4cd', borderBottom: '1px solid #d8d4cd', backgroundColor: '#e8e6e2', padding: 'clamp(40px, 6vw, 64px) 20px' }}>
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
      <section style={{ padding: '16px 0', borderBottom: '1px solid #d8d4cd', overflow: 'hidden', backgroundColor: '#f0eeea' }}>
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


      {/* ── FILTRO ── */}
      <section style={{ padding: 'clamp(42px, 8vw, 96px) 20px', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: '50%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(245,166,35,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 md:gap-16 items-start" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            className="w-full lg:w-1/2"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={slideRight}
          >
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '16px' }}>
              No aceptamos<br />a todos.<br />
              <span style={{ color: '#f5a623' }}>Aceptamos<br />a los que van en serio.</span>
            </h2>
            <p style={{ color: '#aaa', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Si llegaste hasta acá, probablemente sos de los que entienden que escalar requiere proceso, no suerte. Eso ya es suficiente para hablar.
            </p>
          </motion.div>

          <motion.div
            className="w-full lg:w-1/2"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <SectionLabel light>Esto es para vos si...</SectionLabel>
            </motion.div>
            {[
              'Tenés un producto o servicio y querés saber si tiene mercado',
              <span>Estás invirtiendo (o dispuesto a invertir) desde <strong style={{ color: "#fff" }}>USD 30 diarios</strong> en pauta</span>,
              'Vendés por WhatsApp, por visita, por llamada o por checkout',
              'Querés escalar sin quemar presupuesto en pruebas sin método',
              'Te tomás el mercado argentino en serio y querés competir de verdad',
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: '#d4d0c8', fontSize: '0.9rem', lineHeight: 1.5 }}>{item}</p>
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
                Pedí tu diagnóstico gratuito →
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FASE 1 ── */}
      <section style={{ padding: 'clamp(42px, 8vw, 96px) 20px', backgroundColor: '#f0eeea', borderTop: '1px solid #d8d4cd', borderBottom: '1px solid #d8d4cd' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}><FaseTag>FASE 1 · VALIDAR ANTES DE QUEMAR</FaseTag></motion.div>
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
      <section style={{ padding: 'clamp(42px, 8vw, 96px) 20px', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
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
            className="text-left mb-14"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}><FaseTag>FASE 2 · MEDIR LO QUE IMPORTA</FaseTag></motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '16px' }}>
              El ROAS miente.<br />
              El <span style={{ color: '#f5a623' }}>CPA real</span> decide<br />
              si tu negocio es rentable.
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#888', fontSize: '1rem', maxWidth: '480px', lineHeight: 1.7 }}>
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

      {/* ── SECCIÓN DIVISORA: MARQUEE ── */}
      <section style={{ padding: '0', backgroundColor: '#f0eeea', overflow: 'hidden' }}>
        <div className="max-w-6xl mx-auto" style={{ padding: 'clamp(42px, 8vw, 96px) 20px 48px' }}>

          {/* Título + copy: 2 cols en desktop, 1 col en mobile */}
          <div className="grid md:grid-cols-2 gap-10 items-start" style={{ marginBottom: '40px' }}>
            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}><FaseTag>FASE 3 · ESCALAR CON SISTEMA</FaseTag></motion.div>
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

          {/* Tarjetas: 2x2 en mobile, 4 en desktop */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            style={{ marginBottom: '40px' }}
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {[
              { icon: '🎨', label: 'Ángulos creativos', desc: 'Desarrollamos distintos enfoques para un mismo producto basándonos en insights.' },
              { icon: '📐', label: 'Formatos múltiples', desc: 'Producimos Video, UGC, Estáticos y Carruseles para evitar la saturación.' },
              { icon: '🪝', label: 'Hook + Retención', desc: 'Los primeros 3 segundos atrapan el scroll; los siguientes 15 cierran la venta.' },
              { icon: '📈', label: 'Escala sostenida', desc: 'Mantenemos el CPA estable mientras subimos la inversión cada mes.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', transition: { duration: 0.2 } }}
                style={{ 
                  border: '1px solid #d8d4cd', 
                  borderRadius: '16px', 
                  padding: '24px 20px', 
                  backgroundColor: '#e8e6e2', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'default'
                }}
              >
                <motion.span 
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                  style={{ fontSize: '1.5rem', display: 'block' }}
                >
                  {item.icon}
                </motion.span>
                <div>
                  <p style={{ fontWeight: 800, color: '#111', fontSize: '1rem', marginBottom: '8px', lineHeight: 1.2 }}>{item.label}</p>
                  <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#111', padding: '18px 0' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px', zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to right, #111, transparent)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px', zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to left, #111, transparent)' }} />
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
      <section style={{ padding: 'clamp(42px, 8vw, 96px) 20px', backgroundColor: '#e8e6e2' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-left mb-8 md:mb-14"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}><SectionLabel>Clientes reales</SectionLabel></motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111', lineHeight: 1.1 }}>
              Lo que cambia cuando<br />el proceso funciona.
            </motion.h2>
          </motion.div>

          <TestimonialGrid />
        </div>
      </section>

      {/* ── DOS CAMINOS ── */}
      <section style={{ padding: 'clamp(42px, 8vw, 96px) 20px', backgroundColor: '#e8e6e2' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-left mb-8 md:mb-12"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}><SectionLabel>Personalizá tu estrategia</SectionLabel></motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111', lineHeight: 1.05, marginBottom: '12px' }}>
              ¿Cómo es tu proceso<br />
              <span style={{ color: '#d48a0a' }}>de venta hoy?</span>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-stretch">
            {/* Selector lateral / superior */}
            <div className="space-y-2 md:space-y-4">
              {[
                { id: 'ecommerce', label: 'Vendo por Tienda Online', icon: '🛍️', sub: 'Proceso automatizado' },
                { id: 'whatsapp', label: 'Vendo por WhatsApp', icon: '💬', sub: 'Cierro por mensajes' },
              ].map((opt) => (
                <motion.button
                  key={opt.id}
                  onClick={() => setStrategy(opt.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: strategy === opt.id ? '#d48a0a' : '#d8d4cd',
                    backgroundColor: strategy === opt.id ? '#fff' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  whileHover={{ scale: strategy === opt.id ? 1 : 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
                  <div>
                    <p style={{ fontWeight: 800, color: '#111', fontSize: '0.9rem', margin: 0 }}>{opt.label}</p>
                    <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>{opt.sub}</p>
                  </div>
                  {strategy === opt.id && (
                    <motion.div
                      layoutId="active-bg"
                      style={{
                        position: 'absolute',
                        right: 12,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#d48a0a',
                      }}
                    />
                  )}
                </motion.button>
              ))}
              
              <p style={{ fontSize: '0.75rem', color: '#888', padding: '8px 12px', lineHeight: 1.5 }}>
                Seleccioná tu modelo para ver cómo<br className="hidden md:block" /> 
                <strong style={{ color: '#111' }}>escalamos</strong> tu negocio específicamente.
              </p>
            </div>

            {/* Contenedor dinámico */}
            <div className="flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={strategy}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty('--x', `${x}px`);
                    e.currentTarget.style.setProperty('--y', `${y}px`);
                  }}
                  className="group relative"
                  style={{
                    backgroundColor: '#111',
                    borderRadius: '24px',
                    padding: 'clamp(24px, 5vw, 48px)',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                    minHeight: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flex: 1,
                    cursor: 'default',
                  }}
                >
                  {/* Spotlight Effect */}
                  <div 
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(400px circle at var(--x, 0) var(--y, 0), rgba(212,138,10,0.12), transparent 80%)`,
                    }}
                  />
                  {/* Glow decorativo */}
                  <div style={{
                    position: 'absolute', top: '-10%', right: '-10%',
                    width: '60%', height: '60%',
                    background: 'radial-gradient(circle, rgba(212,138,10,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />

                  {strategy === 'ecommerce' ? (
                    <div className="space-y-6">
                      <div style={{ display: 'inline-block', backgroundColor: 'rgba(212,138,10,0.1)', border: '1px solid rgba(212,138,10,0.3)', borderRadius: '100px', padding: '6px 16px', color: '#d48a0a', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                        INVERSIÓN INTELIGENTE
                      </div>
                      <h3 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        Sabemos en qué productos invertir<br />
                        <span style={{ color: '#d48a0a' }}>y cuándo escalar.</span>
                      </h3>
                      <p style={{ color: '#aaa', lineHeight: 1.7, fontSize: '1.05rem' }}>
                        Analizamos tu catálogo para <strong style={{ color: '#fff' }}>encontrar los productos ganadores</strong>. No desperdiciamos presupuesto en lo que no funciona; solo <strong style={{ color: '#d48a0a' }}>escalamos productos validados</strong> por el mercado para asegurar que cada peso rinda al máximo.
                      </p>
                      <div className="pt-4 mt-2 border-t border-white/10 flex gap-8">
                        <div>
                          <p style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', marginBottom: '2px' }}>Métrica clave</p>
                          <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>ROAS Real</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', marginBottom: '2px' }}>Objetivo</p>
                          <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>Escala Estratégica</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 md:space-y-6">
                      <div style={{ display: 'inline-block', backgroundColor: 'rgba(212,138,10,0.1)', border: '1px solid rgba(212,138,10,0.3)', borderRadius: '100px', padding: '4px 14px', color: '#d48a0a', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                        FILTRO DE ALTA INTENCIÓN
                      </div>
                      <h3 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        Validamos tus ofertas llegando<br />
                        <span style={{ color: '#d48a0a' }}>a gente dispuesta a comprar.</span>
                      </h3>
                      <p style={{ color: '#aaa', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        No gastamos dinero en curiosos. Tu equipo recibe conversaciones de personas con intención clara de cierre. Validamos tus ofertas para conocer tu <strong style={{ color: '#fff' }}>CPA Real</strong> y escalar solo lo que funciona.
                      </p>
                      <div className="pt-4 mt-2 border-t border-white/10 flex gap-8">
                        <div>
                          <p style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', marginBottom: '2px' }}>Métrica clave</p>
                          <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>CPA Real</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', marginBottom: '2px' }}>Objetivo</p>
                          <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>Cierre & Escala</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: 'clamp(56px, 12vw, 120px) 20px', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
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
          <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(2rem, 7vw, 4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.0, marginBottom: '16px', textTransform: 'uppercase' }}>
            Publicidad que<br />
            <span style={{ color: '#25D366' }}>cierra ventas.</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 10px' }}>
            30 minutos. Sin compromiso. Si te podemos ayudar, te lo decimos. Si no, tambien.
          </motion.p>
          <motion.p variants={fadeUp} style={{ color: 'rgba(37,211,102,0.7)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '28px', letterSpacing: '0.04em' }}>
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
              Pedí tu diagnóstico gratuito →
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
