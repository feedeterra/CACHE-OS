# REGLAS DE TRABAJO — CACHE OS

## 🗺️ Mapa de Arquitectura (leer esto PRIMERO)

```
CACHE-OS es una app React 19 + Vite + Tailwind v4 + Supabase.
Se despliega en Vercel. NO hay backend propio; todo es Supabase (Auth, DB, Edge Functions).

src/
├── pages/          ← Rutas principales de la app
│   ├── LandingPage.jsx      (marketing, ruta "/")
│   ├── Login.jsx            (auth)
│   ├── AuthCallback.jsx     (OAuth redirect)
│   ├── AdminDashboard.jsx   (admin, ruta "/admin")
│   ├── AdminClients.jsx     (admin, ruta "/admin/clients")
│   ├── ClientDashboard.jsx  (admin, ruta "/admin/client/:id") ⚠️ ARCHIVO GRANDE
│   ├── ClientPortal.jsx     (cliente, ruta "/portal/:token") ⚠️ ARCHIVO GRANDE
│   └── LogsPage.jsx         (admin, ruta "/admin/logs")
├── components/     ← Componentes HUD reutilizables
│   ├── HudPanel.jsx         (contenedor HUD genérico)
│   ├── HudButton.jsx
│   ├── StatCard.jsx
│   ├── TrafficLight.jsx
│   ├── BlinkingCursor.jsx
│   ├── Sidebar.jsx
│   ├── TopNav.jsx
│   ├── TerminalLog.jsx
│   ├── PerformanceTabs.jsx
│   └── TopCreatives.jsx
├── layouts/        ← Wrappers de ruta con protección de auth
│   ├── AdminLayout.jsx      (sidebar + topnav para admin)
│   └── PortalLayout.jsx     (wrapper minimalista para cliente)
├── lib/            ← Utilidades y contextos globales
│   ├── AuthContext.jsx      (sesion + perfil de usuario)
│   ├── supabaseClient.js    (instancia única de Supabase)
│   ├── dateRanges.js        (helpers de fechas)
│   └── mathHelpers.js       (cálculos de ROAS, CPA, Pacing)
└── services/
    └── metaApi.js           (llamadas a Supabase: sync, snapshots, ventas)
```

## 📊 Modelo de Datos Clave (Supabase)
```
clients         → id, name, monthly_budget, target_cpa, target_roas
meta_snapshots  → client_id, date, spend, impressions, clicks, cpm, ctr
sales           → client_id, logged_at, delta
portal_sales_daily → client_id, date, sales_count, revenue
profiles        → id (= auth.user.id), role ('admin' | 'client')
```

## 🛡️ Seguridad y Control de Cambios
- **Umbral**: Si vas a modificar más de 3 archivos o +50 líneas, **PIDE PERMISO PRIMERO**.
- **Ambigüedad**: Si una instrucción es vaga, pregunta. No asumas riesgos en la lógica de negocio.
- **UI**: Antes de crear un componente nuevo, verifica si existe algo reutilizable en `src/components/`.

## 📉 Eficiencia de Tokens
- **No explores directorios** si ya tienes el mapa arriba. Lee archivos específicos directamente.
- **Archivos grandes** (`ClientDashboard.jsx`, `ClientPortal.jsx`): lee solo las líneas relevantes, nunca el archivo completo a menos que sea necesario.
- **Respuestas**: Usa diffs/fragmentos, nunca repitas el archivo entero.
- **Contexto**: Este archivo ya contiene el mapa. No necesitas leer `PROJECT_PLAN.md` ni `STYLE_GUIDE.md` salvo que el usuario los mencione.

## 🚀 Stack
- React 19, Tailwind v4, Supabase, Vite, Vercel.
- NO degradar versiones ni agregar librerías sin preguntar.
- Las Edge Functions viven en `supabase/functions/` (TypeScript + Deno).
