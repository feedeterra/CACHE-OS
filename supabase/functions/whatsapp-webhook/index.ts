import { createClient } from 'jsr:@supabase/supabase-js@2'
import { processWithGroq } from './groqProcessor.ts'
import { pauseCampaign, activateCampaign, pauseAdset, updateAdsetBudget } from '../telegram-bot/metaWriter.ts'

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

// Handle CONFIRMAR: atomically claim and execute a pending write operation
async function handleConfirmation(from: string, supabase: any): Promise<boolean> {
  const { data: rows } = await supabase
    .from('pending_confirmations')
    .delete()
    .eq('chat_id', from)
    .eq('source', 'whatsapp')
    .gt('expires_at', new Date().toISOString())
    .select()

  if (!rows || rows.length === 0) {
    await sendMessage(from, 'No hay ninguna operación pendiente de confirmar. La solicitud expiró o ya fue procesada.', supabase)
    return true
  }

  const conf = rows[0]
  let resultMsg = ''

  try {
    switch (conf.operation) {
      case 'pause_campaign': {
        const result = await pauseCampaign(conf.entity_id)
        resultMsg = result.success
          ? `✅ Campaña *${conf.entity_name}* pausada correctamente.`
          : `❌ No se pudo pausar la campaña: ${result.error}`
        break
      }
      case 'activate_campaign': {
        const result = await activateCampaign(conf.entity_id)
        resultMsg = result.success
          ? `✅ Campaña *${conf.entity_name}* activada correctamente.`
          : `❌ No se pudo activar la campaña: ${result.error}`
        break
      }
      case 'pause_adset': {
        const result = await pauseAdset(conf.entity_id)
        resultMsg = result.success
          ? `✅ Ad Set *${conf.entity_name}* pausado correctamente.`
          : `❌ No se pudo pausar el ad set: ${result.error}`
        break
      }
      case 'update_budget': {
        const budgetUsd = conf.params?.new_budget_usd
        if (!budgetUsd) { resultMsg = '❌ Error: no se especificó el nuevo presupuesto.'; break }
        const budgetCents = Math.round(Number(budgetUsd) * 100)
        const result = await updateAdsetBudget(conf.entity_id, budgetCents)
        resultMsg = result.success
          ? `✅ Presupuesto de *${conf.entity_name}* actualizado a $${budgetUsd} USD/día.`
          : `❌ No se pudo actualizar el presupuesto: ${result.error}`
        break
      }
      default:
        resultMsg = `❌ Operación desconocida: ${conf.operation}`
    }
  } catch (err: any) {
    resultMsg = `❌ Error ejecutando la operación: ${err.message}`
  }

  await sendMessage(from, resultMsg, supabase)
  await supabase.from('system_logs').insert({
    level: 'info',
    message: `[WhatsApp] Operación ejecutada: ${conf.operation} en ${conf.entity_name}`,
    metadata: { from, operation: conf.operation, entity_id: conf.entity_id },
  })
  return true
}

// Store a pending write operation and ask the user to confirm
async function requestConfirmation(
  from: string,
  action: string,
  entityId: string,
  entityName: string,
  params: Record<string, unknown>,
  supabase: any
) {
  await supabase.from('pending_confirmations').insert({
    chat_id: from,
    operation: action,
    entity_id: entityId,
    entity_name: entityName,
    params,
    source: 'whatsapp',
  })

  let actionDesc = ''
  switch (action) {
    case 'pause_campaign':    actionDesc = `pausar la campaña *${entityName}*`; break
    case 'activate_campaign': actionDesc = `activar la campaña *${entityName}*`; break
    case 'pause_adset':       actionDesc = `pausar el ad set *${entityName}*`; break
    case 'update_budget': {
      const usd = params.new_budget_usd
      actionDesc = `actualizar el presupuesto de *${entityName}* a $${usd} USD/día`
      break
    }
    default: actionDesc = `ejecutar "${action}" en *${entityName}*`
  }

  await sendMessage(
    from,
    `⚠️ Estás por ${actionDesc} (ID: ${entityId}).\n\nRespondé *CONFIRMAR* para ejecutar, o ignorá este mensaje para cancelar (expira en 5 min).`,
    supabase
  )
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

    // 1. NORMALIZAR ENTRADA
    const events = Array.isArray(body) ? body : [body]
    const processedSenders = new Set<string>()

    for (const event of events) {
      const incoming = parseIncoming(event)
      if (!incoming) continue

      const { from, text: rawText, id: msgId } = incoming
      const text = rawText.trim()

      if (processedSenders.has(`${from}:${msgId}`)) continue
      processedSenders.add(`${from}:${msgId}`)

      // 2. ATOMIC DEDUPLICATION
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

      // 3. LOG
      await supabase.from('system_logs').insert({
        level: 'info',
        message: `[WhatsApp] MSG de ${from}: ${text}`,
        metadata: { message_id: msgId }
      })

      // 4. CONFIRMAR flow
      if (/^confirmar$/i.test(text)) {
        await handleConfirmation(from, supabase)
        continue
      }

      // 5. FETCH CLIENTS
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, name, monthly_budget, funnel_type, kpi_goals')
        .eq('is_active', true)

      if (clientErr) console.error('Supabase Client Error:', clientErr)

      // 6. FETCH CHAT HISTORY (Memory)
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
          const content = h.message.split(': ').slice(1).join(': ')
          return {
            role: (isAI ? 'assistant' : 'user') as 'assistant' | 'user',
            content: content || h.message
          }
        })

      // 7. COMANDOS RÁPIDOS (slash o texto exacto)
      const cmd = text.toLowerCase().replace(/^\//, '')

      if (cmd === 'start' || cmd === 'ayuda') {
        await sendMessage(from, [
          '🗂 *CACHE-OS Bot*',
          '',
          'Podés escribirme en lenguaje natural. Ejemplos:',
          '• "¿Cómo está el pacing de todos los clientes?"',
          '• "Dame el reporte de hoy"',
          '• "Pausa la campaña de retargeting de Acme"',
          '• "¿Qué recomendás para mejorar el CPL de Beta Corp?"',
          '',
          '*Comandos rápidos:*',
          '/reporte — Resumen MTD de todos los clientes',
          '/alertas — Campañas en rojo o fuera de pacing',
          '/ayuda — Ver este mensaje',
        ].join('\n'), supabase)
        continue
      }

      if (cmd === 'reporte') {
        try {
          const reply = await processWithGroq(
            'Dame un resumen ejecutivo del rendimiento MTD de todos los clientes: pacing, spend, leads o ventas, y si hay alguna alerta importante.',
            clients ?? [],
            supabase,
            [],
            'whatsapp'
          )
          await sendMessage(from, reply, supabase)
          await supabase.from('system_logs').insert({
            level: 'info',
            message: `[WhatsApp] Respuesta a ${from}: ${reply}`,
            metadata: { to: from, command: '/reporte' }
          })
        } catch (err: any) {
          await sendMessage(from, `Error al generar reporte: ${err.message}`, supabase)
        }
        continue
      }

      if (cmd === 'alertas') {
        try {
          const reply = await processWithGroq(
            'Analizá todos los clientes y listá únicamente los que tienen problemas: overspending (pacing > 110%), CPA por encima del objetivo, CPL alto, o frecuencia > 2.5. Sé directo y específico.',
            clients ?? [],
            supabase,
            [],
            'whatsapp'
          )
          await sendMessage(from, reply, supabase)
          await supabase.from('system_logs').insert({
            level: 'info',
            message: `[WhatsApp] Respuesta a ${from}: ${reply}`,
            metadata: { to: from, command: '/alertas' }
          })
        } catch (err: any) {
          await sendMessage(from, `Error al generar alertas: ${err.message}`, supabase)
        }
        continue
      }

      // 8. LENGUAJE NATURAL — incluye detección de write-intent
      try {
        const reply = await processWithGroq(text, clients ?? [], supabase, chatHistory, 'whatsapp')

        // Intentar parsear como JSON action (write intent detectado por Groq)
        let isWriteIntent = false
        try {
          const parsed = JSON.parse(reply)
          if (parsed?.action && parsed?.entity_id) {
            isWriteIntent = true
            await requestConfirmation(
              from,
              parsed.action,
              parsed.entity_id,
              parsed.entity_name ?? parsed.entity_id,
              parsed.params ?? {},
              supabase
            )
          }
        } catch {
          // No es JSON — respuesta normal de texto
        }

        if (!isWriteIntent) {
          await sendMessage(from, reply, supabase)
        }

        await supabase.from('system_logs').insert({
          level: 'info',
          message: `[WhatsApp] Respuesta a ${from}: ${isWriteIntent ? '[CONFIRMACIÓN SOLICITADA]' : reply}`,
          metadata: { to: from, source: 'kapso', message_id: msgId }
        })
      } catch (groqErr: any) {
        console.error('Groq Error:', groqErr)
        await sendMessage(from, `Error procesando tu mensaje: ${groqErr.message}`, supabase)
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
