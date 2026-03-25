# CACHE OS: MODERN TACTICAL UI - STYLE GUIDE

## 🎨 Paleta de Colores
- **Background Main**: `#0D1117`
- **Background Elevado**: `#161b22` (con desenfoque de fondo/glassmorphism)
- **Acento Primario**: `#F97316` (Performance Orange)
- **Acento Secundario**: `#22C55E` (Tactical Green - para Profit/On Track)
- **Alerta**: `#EF4444` (Action Red - para Overspending/Issues)
- **Texto Primario**: `#F8FAFC`
- **Texto Dim**: `#94A3B8`

## ⌨️ Tipografía
- **Datos Técnicos / Números**: `Space Mono` (Google Fonts)
- **Lectura / UI Headers**: `Epilogue` o `Geist` (Sans-Serif modernas)
- **Estilo**: Todo en Uppercase para headers de sección (`// SPEND_ANALYSIS`).

## ✨ Efectos y Animaciones
- **Bordes**: `1px solid rgba(249, 115, 22, 0.2)` con transiciones de color.
- **Glassmorphism**: `backdrop-blur-md bg-bg-secondary/60`.
- **Glow**: `box-shadow: 0 0 15px rgba(249, 115, 22, 0.1)`.
- **Blink**: Animación para cursores y estados de carga.
- **Scan**: Gradiente sutil que recorre los paneles verticalmente (micro-animación).

## 🛠 Componentes Estándar
1. **HudPanel**: Contenedor principal con bordes reforzados en las esquinas.
2. **StatCard**: Tarjeta de métrica con label técnico arriba y valor grande debajo.
3. **BlinkingCursor**: `<span>` parpadeante después de cada título principal.
4. **ActionButton**: Botones con estilo de membrana o tácticos (sin bordes redondeados excesivos).

## 🔳 Layout Rules
- Grid rígida de columnas.
- Espaciado consistente de `gap-2` o `gap-3`.
- Uso de etiquetas tipo terminal: `[ SYS:ONLINE ]`, `[ META:SYNCED ]`.
