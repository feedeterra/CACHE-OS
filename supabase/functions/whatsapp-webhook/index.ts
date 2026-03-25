import { createClient } from 'jsr:@supabase/supabase-js@2'
import { processWithGroq } from './groqProcessor.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KAPSO_KEY = Deno.env.get('KAPSO_API_KEY')!
const KAPSO_PHONE_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID')!

// Send a text message back via Kapso
async function sendMessage(to: string, text: string, supabase?: any) {
  try {
    const res = await fetch(`https://api.kapso.ai/meta/whatsapp/v24.0/${KAPSO_PHONE_ID}/messages`, {
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
    if (!res.ok) {
      const err = await res.text()
      console.error('Kapso send error:', err)
      if (supabase) {
        await supabase.from('system_logs').insert({
          level: 'error',
          message: `[WhatsApp] Kapso Error: ${res.status}`,
          metadata: { error: err, to }
        })
      }
    }
  } catch (err) {
    console.error('SendMessage throw:', err)
  }
}

// Parse Kapso webhook payload to extract sender + text
function parseIncoming(body: Record<string, unknown>): { from: string; text: string; id: string } | null {
  try {
    // 1. Kapso native format
    const msg = body.message as any
    if (msg?.from && msg?.text?.body) {
      return { from: msg.from, text: msg.text.body, id: msg.id }
    }

    // 2. Meta Standard format (sometimes used by proxies)
    const entry = (body as any).entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const metaMsg = value?.messages?.[0]
    if (metaMsg?.from && metaMsg?.text?.body) {
       return { from: metaMsg.from, text: metaMsg.text.body, id: metaMsg.id }
    }

    return null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  // Meta/Kapso webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const challenge = url.searchParams.get('hub.challenge')
    if (challenge) return new Response(challenge, { status: 200 })
  }

  try {
    const body = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. NORMALIZAR ENTRADA (Soportar lotes de buffering o eventos individuales)
    const events = Array.isArray(body) ? body : [body]
    const processedSenders = new Set<string>()

    for (const event of events) {
      const incoming = parseIncoming(event)
      if (!incoming) continue

      const { from, text, id: msgId } = incoming

      // Si ya procesamos a este remitente en este lote (o es el mismo mensaje), saltar
      if (processedSenders.has(`${from}:${msgId}`)) continue
      processedSenders.add(`${from}:${msgId}`)

      // 2. ATOMIC DEDUPLICATION: Insert into control table
      // This prevents race-conditions when Kapso sends multiple webhooks < 10ms apart
      const { error: lockErr } = await supabase
        .from('processed_webhooks')
        .insert({ message_id: msgId, sender_phone: from, status: 'processing' })
      
      if (lockErr) {
        if (lockErr.code === '23505') {
            console.log(`Duplicate msgId ${msgId} blocked at DB level.`)
            continue
        }
        console.warn('Lock check error:', lockErr)
      }

      // 3. LOG & PROCESS
      await supabase.from('system_logs').insert({
        level: 'info',
        message: `[WhatsApp] MSG de ${from}: ${text}`,
        metadata: { message_id: msgId }
      })

      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, name, monthly_budget, funnel_type')
        .eq('is_active', true)
      
      if (clientErr) console.error('Supabase Client Error:', clientErr)

      // 4. FETCH CHAT HISTORY (Memory)
      const { data: rawHistory } = await supabase
        .from('system_logs')
        .select('message, metadata')
        .or(`message.like.[WhatsApp] MSG de ${from}: %,metadata->>to.eq.${from}`)
        .order('created_at', { ascending: false })
        .limit(10)

      const chatHistory = (rawHistory || []) 
        .reverse()
        .map((h: any) => {
          const isAI = h.message.startsWith('[WhatsApp] Respuesta')
          // Limpiar prefijo para el modelo
          const content = h.message.split(': ').slice(1).join(': ')
          return {
            role: isAI ? 'assistant' : 'user',
            content: content || h.message
          }
        })

      try {
        const reply = await processWithGroq(text, clients ?? [], supabase, chatHistory)
        await sendMessage(from, reply, supabase)
        
        await supabase.from('system_logs').insert({
          level: 'info',
          message: `[WhatsApp] Respuesta a ${from}: ${reply}`,
          metadata: { to: from, source: 'kapso', message_id: msgId }
        })
      } catch (groqErr: any) {
        console.error('Groq Error:', groqErr)
        await sendMessage(from, `Error Groq: ${groqErr.message}`, supabase)
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: processedSenders.size }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
