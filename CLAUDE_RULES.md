# REGLAS DE TRABAJO (CACHE OS)

## 🛡️ Seguridad y Control de Cambios
- **Umbral de Cambio**: Si vas a modificar más de 3 archivos o más de 50 líneas de código en un solo archivo, **PIDE PERMISO PRIMERO** explicando el impacto.
- **Dudas y Ambigüedad**: Si una instrucción es vaga o puede interpretarse de varias formas, detente y pregunta. No asumas riesgos en la lógica de negocio (Pacing Engine).
- **Consistencia Visual**: Antes de crear UI, revisa `src/components/` para reutilizar elementos HUD existentes.

## 📉 Eficiencia de Tokens
- **Lectura Selectiva**: No leas directorios enteros si no es necesario. Prefiere leer archivos específicos.
- **Resúmenes**: No repitas todo el archivo en la respuesta si el usuario solo pidió un cambio pequeño. Usa fragmentos/diffs.
- **Checkpoints**: Consulta `PROJECT_PLAN.md` para saber en qué fase estamos y no salirte del roadmap.

## 🚀 Tecnología
- Stack: React 19, Tailwind v4, Supabase. No intentes degradar versiones ni usar librerías externas sin preguntar.
