---
name: proactive-ai-cron
description: Patrón arquitectónico estandarizado para crear "Guardianes IA" o Edge Functions proactivas usando Supabase (pg_cron), Groq (Llama 3.3) y Kapso (WhatsApp).
---

# Proactive AI Cron (Guardian Agent Pattern)

Esta skill documenta el patrón exacto para crear Edge Functions en Supabase que se ejecutan automáticamente por tiempo (cron), analizan datos usando un LLM (Groq) y toman decisiones asíncronas notificando al usuario vía webhook o WhatsApp (Kapso).

## 1. La Vía de Trigger (`pg_cron`)
Para que Supabase ejecute una función de forma autónoma sin depender de un cliente UI, usamos la extensión `pg_cron` llamando a `pg_net`. No escribas cronjobs locales; siempre provee este bloque SQL:

```sql
-- Ejecutar a las 19:30 todos los días (UTC)
SELECT cron.schedule(
  'guardian-daily-alert',
  '30 19 * * *',
  $$
    SELECT net.http_post(
        url:='https://[PROYECTO].supabase.co/functions/v1/agency-guardian',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
        body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

## 2. Estructura de la Edge Function (Deno)
Toda función Cron proactiva debe tener las siguientes fases:
1. **Recolección:** Hacer queries a la base de datos (Supabase) simulando la vista del humano.
2. **Contextualización:** Serializar los datos en texto plano legible (ej. strings) para el prompt.
3. **Inferencia (Groq):** Llamar a Llama 3.3 inyectando "Reglas de Negocio / Vault" + Contexto.
4. **Acción/Observabilidad:** Decidir si enviar una alerta (Kapso) y SIEMPRE hacer un `insert` en `system_logs` para dejar registro en el dashboard.

### Template Estándar de Ejecución:
```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // 1. Inicializar cliente con Service Role para saltar RLS en background
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 2. Obtener data a evaluar (Ej: Pacing o ROAS bajos)
  const { data: accounts } = await supabase.from('clients').select('*')
  
  // 3. Evaluar con GROQ
  const prompt = \`Analiza estos datos y SI hay una alerta crítica, genera un mensaje corto. Si todo está normal, responde EXACTAMENTE: ALL_GOOD. Datos: \${JSON.stringify(accounts)}\`;
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${Deno.env.get('GROQ_API_KEY')}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.1, // Baja porque es analítico
    }),
  })

  const { choices } = await response.json()
  const reply = choices[0].message.content.trim()

  // 4. Acción Categórica
  if (reply !== 'ALL_GOOD' && reply.length > 5) {
     // A. Mandar WhatsApp al ADMIN
     await sendKapsoAlert(reply);
     
     // B. Registrar en Dashboard UI
     await supabase.from('system_logs').insert({ level: 'warn', message: \`⚠️ AI Guardian: \${reply}\` })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})
```

## 3. Best Practices de esta Skill
*   **Zero-Hallucination Prompting:** Siempre decile al modelo que si no hay anomalías, devuelva un `keyword` de control (ej. `ALL_GOOD` o `OK`). Si el modelo no usa el keyword, dispara la alerta.
*   **Timeout & Costos:** Los Cron de Supabase Edge Functions tienen timeout (por defecto 2 seg para free tier, hasta 115 seg en pro). Groq responde en < 1s, si falla o hace timeout, crasheará. Maneja `try/catch` para cada petición web si procesas clientes en lote.
*   **Logging en Sistema:** Para que el usuario humano sepa que la IA está trabajando sola en background, SIEMPRE escribe en `system_logs`. Esto da un sentido de "agencia viva".
