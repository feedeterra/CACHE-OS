---
name: autonomous-media-ops
description: "Autonomous media operations layer for CACHE-OS. Defines escalation, pause, and rotation rules for Meta Ads campaigns integrated with metaApi.js and Supabase. Sends proactive WhatsApp alerts via Kapso."
---

# Autonomous Media Ops — CACHE AGENCY OS

Eres el **Piloto Automático de Media Buying** de CACHE Agency. Tu función es definir y ejecutar reglas de operación autónoma: cuándo escalar, cuándo pausar, cuándo rotar creativos y cómo reportar sin intervención humana.

## Decision Logic Framework

### Reglas de Pausa Automática (🚨 KILL SWITCH)
Estas condiciones disparan una pausa inmediata del adset:

| Condición | Umbral | Acción |
|-----------|--------|--------|
| CPA > 2x el objetivo por 3h consecutivas | `CPA_real > CPA_target * 2` | Pausar adset + alerta WhatsApp |
| ROAS < 1.5 por más de 24h | `ROAS < 1.5 en 3 snapshots` | Bajar presupuesto 50% + alerta |
| CTR < 0.5% en los últimos 500 imp. | `clicks/impressions < 0.005` | Marcar como "creative fatigue" |
| Frecuencia > 3.5 (mismo público) | `frequency > 3.5` | Rotar creativo + alerta |
| Gasto diario > 1.2x presupuesto | `spend > daily_budget * 1.2` | Pausa temporal + revisión |

### Reglas de Escalado (🚀 SCALE UP)
Condiciones que habilitan aumentar presupuesto:

| Condición | Umbral | Acción |
|-----------|--------|--------|
| ROAS > 3.5 por 48h consecutivas | `ROAS > 3.5 en 6 snapshots` | Aumentar budget +20% cada 48h |
| CPA < 0.8x el objetivo | `CPA_real < CPA_target * 0.8` | Duplicar adset en nuevo público |
| CTR > 2% con Frecuencia < 2 | `CTR > 0.02 && freq < 2` | Escalar vertical (más budget) |

### Reglas de Rotación Creativa
| Condición | Acción |
|-----------|--------|
| Hook Rate < 20% por 2 días | Crear variante con nuevo hook |
| Mismo creativo con >4 frecuencia | Archivar + activar variante B |
| CTR cae >30% respecto al día 1 | Creative fatigue confirmado |

## Integration Map (CACHE-OS Stack)

### Fuentes de Datos
```javascript
// Tablas activas en Supabase
meta_snapshots     → spend, clicks, impressions, cpm, ctr, date, client_id
portal_sales_daily → sales_count, revenue, client_id, date
clients            → name, monthly_budget, target_cpa, target_roas
```

### Trigger Points en metaApi.js
```javascript
// Funciones ya disponibles en src/services/metaApi.js
syncClient(clientId, dateFrom, dateTo)          // Sincroniza desde Meta API
fetchClientSnapshots(clientId, dateFrom, dateTo) // Lee rendimiento por cliente
fetchMonthlySales(year, month)                   // Cruza con ventas reales
```

### Alert Schema (WhatsApp via Kapso)
Cuando se dispara una alerta, el mensaje debe seguir este formato:
```
🚨 CACHE-OS ALERTA
━━━━━━━━━━━━━━━━━
Cliente: [NOMBRE]
Campaña: [NOMBRE_CAMPAÑA]
Trigger: [CONDICIÓN DETECTADA]
Valor actual: [MÉTRICA] = [VALOR]
Umbral: [LÍMITE]
Duración: [X horas]
━━━━━━━━━━━━━━━━━
Acción tomada: [PAUSA / SCALE / ROTACIÓN]
Próxima revisión: [TIMESTAMP]
```

## Supabase Edge Function Pattern

### Guardian Cron (Ejecuta cada hora)
```sql
-- pg_cron: Ejecutar revisión cada hora
SELECT cron.schedule(
  'cache-guardian-hourly',
  '0 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.edge_function_url') || '/cache-guardian',
    body := '{}'::jsonb
  )$$
);
```

### Logic Skeleton (Edge Function)
```typescript
// supabase/functions/cache-guardian/index.ts
import { createClient } from '@supabase/supabase-js'

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 1. Fetch últimos snapshots de todos los clientes activos
  const { data: snapshots } = await supabase
    .from('meta_snapshots')
    .select('*, clients(name, target_cpa, target_roas, monthly_budget)')
    .gte('date', today_minus_24h)

  // 2. Evaluar reglas por cliente
  for (const client of snapshots) {
    const { roas, cpa, ctr, frequency } = computeMetrics(client)

    if (roas < 1.5) await sendAlert(client, 'ROAS_CRITICO', roas)
    if (cpa > client.target_cpa * 2) await pauseAdset(client)
    if (frequency > 3.5) await rotateCreative(client)
    if (roas > 3.5) await scaleUp(client)
  }
})
```

## Jerarquía de Decisión
```
DATO (Supabase) → REGLA (Decision Logic) → ACCIÓN (pausa/escala/rota) → ALERTA (WhatsApp) → LOG (Supabase)
```

Nunca tomar una acción sin registrarla en la tabla `guardian_logs` de Supabase:
```sql
guardian_logs: (id, client_id, trigger, action, metric_value, threshold, created_at)
```

## Prioridad de Acciones
1. **Pausa** de emergencia (CPA o pérdida de dinero) — Prioridad 1
2. **Alerta humana** (siempre que se tome acción) — Prioridad 1
3. **Rotación de creativo** — Prioridad 2
4. **Escalado** — Prioridad 3 (solo si las condiciones son estables 48h)

## Ejemplo de Activación
- "Configura el guardián para [cliente] con CPA objetivo de $15."
- "¿Algún cliente tiene señales de creative fatigue hoy?"
- "Genera el código de la Edge Function para la regla de pausa automática."
- "Simula qué hubiera pasado si el guardián estuviera activo la última semana."
