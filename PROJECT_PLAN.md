# CACHE AGENCY OS — MASTER PLAN (TACTICAL VISION)

## 🎯 NÚCLEO VISUAL: MODERN TACTICAL UI
- **Estética**: "Modern Tactical" — Centro de mando de alto rendimiento.
- **Tipografía**: `Space Mono` (Datos/Cifras), `Epilogue/Geist` (Textos/UI).
- **Colores**: Fondo `#0D1117` con gradiente radial de `#161b22`. Acento `Performance Orange` (#F97316).
- **Efectos**: Glassmorphism, bordes 1px con glow, micro-animaciones de escaneo.

---

## 🟢 FASE 1: FOUNDATION (COMPLETADA)
- [x] Inicializar Vite + React (React 19)
- [x] Configurar Tailwind v4 + @tailwindcss/vite
- [x] Design System Base (index.css): Space Mono, Performance Orange
- [x] Componentes Core Tactical: `BlinkingCursor`, `HudPanel`, `StatCard`, `HudButton`
- [x] Layouts base de Administración y Portal

## 🟡 FASE 2: BACKEND + COMMAND CENTER (EN PROCESO)
- [x] Esquema inicial Supabase (profiles, clients, sales, meta_snapshots)
- [x] Auth via Magic Link
- [x] Servicio `metaApi.js` + `mathHelpers.js` (CPA Real)
- [x] Admin Dashboard v1 (Telemetría global)
- [ ] **[TODO]** Verificar flujo de sincronización automática Meta -> Supabase

## 🟠 FASE 3: SMART PACING ENGINE ("THE FRICTION KILLER")
- [ ] Algoritmo de Proyección EOM (End of Month) basado en promedio diario
- [ ] Sistema de Semáforo de Alertas (Verde/Naranja/Azul)
- [ ] **Simulador Táctico**: Slider para proyectar impacto de cambios de presupuesto en tiempo real
- [ ] Portal de Cliente v2: Botones masivos [+] y [-] para reporte de ventas mobile-first
- [ ] HUD de Rentabilidad en Portal (ROAS & CPA Real instantáneo)

## 🔴 FASE 4: OMNICHANNEL AI AGENT (GEMINI + KAPSO)
- [ ] Integración Kapso.ai (WhatsApp/IG)
- [ ] **Gemini NLU**: Procesamiento de comandos por voz/texto ("Pausá la campaña X")
- [ ] Agente de Calificación 24/7 con Lead Sentiment Analysis
- [ ] Ejecutor de Acciones en Meta Ads API desde comandos de chat

## 🟣 FASE 5: CONTENT LAB (GENERATIVE ASSETS)
- [ ] Generador de Carruseles: Conversión de Audio/Prompt -> Guion estructurado
- [ ] Integración Canva API: Generación en lote (Bulk Create) desde copies de IA
- [ ] Módulo de visualización de creativos con métricas de performance integradas

## 🔵 FASE 6: NEURAL SYNC (ADVANCED CRM)
- [ ] Sincronización bidireccional Kommo CRM
- [ ] Inyección de contexto de conversación AI en fichas de lead
- [ ] Trazabilidad total: Origen del anuncio -> Conversación AI -> Venta final

---

## 🛠 ARQUITECTURA TÉCNICA
- **Frontend**: React 19 + Vite + Tailwind + Framer Motion (para escaneo)
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions)
- **AI**: Gemini 1.5 Pro / Flash (vía Edge Functions)
- **Project Memory**: `PROJECT_PLAN.md` + `CLAUDE_RULES.md`
