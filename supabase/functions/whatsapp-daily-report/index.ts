import { createClient } from 'jsr:@supabase/supabase-js@2'
import { processWithGroq } from '../whatsapp-webhook/groqProcessor.ts'

const KAPSO_KEY = Deno.env.get('KAPSO_API_KEY')!
const KAPSO_PHONE_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID')!
const ADMIN_PHONE = '542346306562' // El número del usuario para recibir los reportes

async function sendMessage(to: string, text: string) {
  await fetch(`https://api.kapso.ai/meta/whatsapp/v24.0/${KAPSO_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'X-API-Key': KAPSO_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // 1. Obtener clientes activos
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, monthly_budget')
      .eq('is_active', true)

    if (!clients || clients.length === 0) return new Response('No clients')

    await sendMessage(ADMIN_PHONE, `⚡️ *INICIO DE AUDITORÍA TÁCTICA (20:00 HS)* ⚡️\nProcesando ${clients.length} cuentas...`)

    for (const client of clients) {
      // 2. Obtener métricas de hoy (último snapshot)
      const { data: metrics } = await supabase
        .from('meta_snapshots')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(1)

      const prompt = `Genera un REPORTE TÁCTICO DIARIO para el cliente "${client.name}". 
      Métricas actuales: ${JSON.stringify(metrics?.[0] || {})}
      Presupuesto: ${client.monthly_budget}
      
      Reglas:
      - Sé muy profesional y directo.
      - Resalta ROAS y CPA.
      - Menciona si el "Pacing" es correcto.
      - Usa emojis estratégicos.
      - Finaliza con una recomendación de acción (Scalability o Fix).`

      const report = await processWithGroq(prompt, [client], supabase)
      await sendMessage(ADMIN_PHONE, `*REPORTE: ${client.name}*\n\n${report}`)
    }

    return new Response('Reports sent')
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, { status: 500 })
  }
})
