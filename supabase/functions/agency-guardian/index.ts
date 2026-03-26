import { createClient } from 'jsr:@supabase/supabase-js@2'

// Copiar la bóveda si queremos, o simplemente pasar un prompt que diga qué buscar
// Aquí podemos importar la bóveda si la enlazamos, o inyectar las reglas del SOP_PACING.
const SYSTEM_PROMPT = `Sos el Guardián de Agencia (CACHE-OS AI). Tu tarea es revisar el rendimiento diario de los clientes.
REGLAS ESTRICTAS DE ALERTA:
1. Si un cliente está en "Overspending" (Pacing alto > 110%) o tiene CPA > target_cpa, genera una alerta corta y táctica (máximo 30 palabras).
2. Si el ROAS es menor a 2.5 en E-commerce, genera una alerta táctica sugiriendo apagado o ajuste.
3. SI TODOS LOS CLIENTES ESTÁN ESTABLES Y DENTRO DE LÍMITES, DEBES RESPONDER EXACTAMENTE CON LA PALABRA: ALL_GOOD
No agregues saludos, ni puntuación adicional si todo está bien. SOLO "ALL_GOOD".
`;

const KAPSO_KEY = Deno.env.get('KAPSO_API_KEY')!
const KAPSO_PHONE_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID')!
const ADMIN_PHONE = Deno.env.get('ADMIN_WHATSAPP_PHONE') ?? '+5491100000000' // Placeholder o de DB
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')

async function sendWhatsAppAlert(text: string) {
  await fetch(`https://api.kapso.ai/meta/whatsapp/v24.0/${KAPSO_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'X-API-Key': KAPSO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: ADMIN_PHONE, type: 'text', text: { body: text } }),
  })
}

async function sendTelegramAlert(text: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
  })
}

Deno.serve(async (req) => {
  // Aseguramos que solo puedan llamarlo por POST/Get autorizado o cron
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase.from('system_logs').insert({ level: 'info', message: 'Agency Guardian: Iniciando ciclo de escaneo automatizado.' })

  // 1. Obtener clientes activos
  const { data: clients } = await supabase.from('clients').select('*').eq('is_active', true)
  if (!clients || clients.length === 0) return new Response('No clients', { status: 200 })

  // 2. Sincronizar META ADS de todos (Parallel)
  const syncPromises = clients.map(c => 
    supabase.functions.invoke('meta-sync', { body: { client_id: c.id } })
  )
  await Promise.all(syncPromises)
  
  // 3. Obtener Data de los clientes (Contexto)
  // Utilizamos la función de webhook (o reconstruimos el context builder simplificado aquí)
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dateFrom = `${yyyy}-${mm}-01`
  const dateTo = today.toISOString().slice(0, 10)

  let contextStr = 'DATOS ACTUALES:\n'

  for (const c of clients) {
    const [{ data: snaps }, { data: sales }] = await Promise.all([
      supabase.from('meta_snapshots').select('spend,leads').eq('client_id', c.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('portal_sales_daily').select('count,revenue').eq('client_id', c.id).gte('date', dateFrom).lte('date', dateTo),
    ])
    const spend = (snaps ?? []).reduce((s, r) => s + Number(r.spend), 0)
    const salesCount = (sales ?? []).reduce((s, r) => s + Number(r.count), 0)
    const revenue = (sales ?? []).reduce((s, r) => s + Number(r.revenue), 0)
    
    const cpa = salesCount > 0 ? spend / salesCount : 0
    const roas = spend > 0 ? revenue / spend : 0
    const targetCpa = c.kpi_goals?.target_cpa ?? 'N/A'
    
    contextStr += `[CLIENTE: ${c.name}] Funnel: ${c.funnel_type} | Spend MTD: $${spend.toFixed(0)} | Ventas: ${salesCount} | CPA: $${cpa.toFixed(2)} (Meta: $${targetCpa}) | ROAS: ${roas.toFixed(2)}x\n`
  }

  // 4. Analizar con GROQ
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: contextStr }],
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    await supabase.from('system_logs').insert({ level: 'error', message: `Agency Guardian Groq Error: ${err}` })
    return new Response('Groq error', { status: 500 })
  }

  const { choices } = await response.json()
  const reply = choices[0].message.content.trim()

  // 5. ACCIÓN PROACTIVA
  if (reply !== 'ALL_GOOD' && reply.length > 5) {
     // A. Mandar alertas al ADMIN (WhatsApp + Telegram en paralelo)
     const alertTasks: Promise<void>[] = []
     if (ADMIN_PHONE !== '+5491100000000') {
         alertTasks.push(sendWhatsAppAlert(`🚨 *Alerta CACHE-OS Guardian*\n\n${reply}`))
     }
     const htmlReply = reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
     alertTasks.push(sendTelegramAlert(`🚨 <b>Alerta CACHE-OS Guardian</b>\n\n${htmlReply}`))
     await Promise.allSettled(alertTasks)
     
     // B. Registrar en Dashboard UI
     await supabase.from('system_logs').insert({ level: 'warn', message: `⚠️ Detección Proactiva:\n${reply}` })
  } else {
     await supabase.from('system_logs').insert({ level: 'info', message: 'Agency Guardian: Escaneo OK (ALL_GOOD). Sin alertas.' })
  }

  return new Response(JSON.stringify({ ok: true, status: reply === 'ALL_GOOD' ? 'clean' : 'alert_sent' }), { 
    headers: { 'Content-Type': 'application/json' } 
  })
})
