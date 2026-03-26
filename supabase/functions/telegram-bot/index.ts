import { createClient } from 'jsr:@supabase/supabase-js@2'
import { processWithGroq } from '../_shared/groqProcessor.ts'
import { pauseCampaign, activateCampaign, pauseAdset, updateAdsetBudget } from './metaWriter.ts'

const TELEGRAM_TOKEN = () => Deno.env.get('TELEGRAM_BOT_TOKEN')!
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendTelegramMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })
}

// Handle a pending CONFIRMAR from the user
async function handleConfirmation(chatId: string, supabase: any): Promise<boolean> {
  // Use DELETE ... RETURNING to atomically claim the confirmation (prevents double-execution)
  const { data: rows } = await supabase
    .from('pending_confirmations')
    .delete()
    .eq('chat_id', chatId)
    .eq('source', 'telegram')
    .gt('expires_at', new Date().toISOString())
    .select()

  if (!rows || rows.length === 0) {
    await sendTelegramMessage(chatId, 'No hay ninguna operación pendiente de confirmar. La solicitud expiró o ya fue procesada.')
    return true
  }

  const conf = rows[0]
  let resultMsg = ''

  try {
    switch (conf.operation) {
      case 'pause_campaign': {
        const result = await pauseCampaign(conf.entity_id)
        resultMsg = result.success
          ? `Campaña <b>${conf.entity_name}</b> pausada correctamente.`
          : `No se pudo pausar la campaña: ${result.error}`
        break
      }
      case 'activate_campaign': {
        const result = await activateCampaign(conf.entity_id)
        resultMsg = result.success
          ? `Campaña <b>${conf.entity_name}</b> activada correctamente.`
          : `No se pudo activar la campaña: ${result.error}`
        break
      }
      case 'pause_adset': {
        const result = await pauseAdset(conf.entity_id)
        resultMsg = result.success
          ? `Ad Set <b>${conf.entity_name}</b> pausado correctamente.`
          : `No se pudo pausar el ad set: ${result.error}`
        break
      }
      case 'update_budget': {
        const budgetUsd = conf.params?.new_budget_usd
        if (!budgetUsd) {
          resultMsg = 'Error: no se especificó el nuevo presupuesto.'
          break
        }
        const budgetCents = Math.round(Number(budgetUsd) * 100)
        const result = await updateAdsetBudget(conf.entity_id, budgetCents)
        resultMsg = result.success
          ? `Presupuesto de <b>${conf.entity_name}</b> actualizado a $${budgetUsd} USD/día.`
          : `No se pudo actualizar el presupuesto: ${result.error}`
        break
      }
      default:
        resultMsg = `Operación desconocida: ${conf.operation}`
    }
  } catch (err: any) {
    resultMsg = `Error ejecutando la operación: ${err.message}`
  }

  await sendTelegramMessage(chatId, resultMsg)
  await supabase.from('system_logs').insert({
    level: 'info',
    message: `[Telegram] Operación ejecutada: ${conf.operation} en ${conf.entity_name}`,
    metadata: { chat_id: chatId, operation: conf.operation, entity_id: conf.entity_id, result: resultMsg },
  })
  return true
}

// Store a pending write-operation confirmation and ask the user to confirm
async function requestConfirmation(
  chatId: string,
  action: string,
  entityId: string,
  entityName: string,
  params: Record<string, unknown>,
  supabase: any
) {
  await supabase.from('pending_confirmations').insert({
    chat_id: chatId,
    operation: action,
    entity_id: entityId,
    entity_name: entityName,
    params,
    source: 'telegram',
  })

  let actionDesc = ''
  switch (action) {
    case 'pause_campaign':    actionDesc = `pausar la campaña <b>${entityName}</b>`; break
    case 'activate_campaign': actionDesc = `activar la campaña <b>${entityName}</b>`; break
    case 'pause_adset':       actionDesc = `pausar el ad set <b>${entityName}</b>`; break
    case 'update_budget': {
      const usd = params.new_budget_usd
      actionDesc = `actualizar el presupuesto de <b>${entityName}</b> a $${usd} USD/día`
      break
    }
    default: actionDesc = `ejecutar "${action}" en <b>${entityName}</b>`
  }

  await sendTelegramMessage(
    chatId,
    `⚠️ Estás por ${actionDesc} (ID: <code>${entityId}</code>).\n\nRespondé <code>CONFIRMAR</code> para ejecutar, o ignorá este mensaje para cancelar (expira en 5 min).`
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  // Always return 200 to Telegram — it retries on non-200 responses
  const ok = new Response(JSON.stringify({ ok: true }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

  try {
    // Verify origin via secret token header
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secret = req.headers.get('X-Telegram-Bot-Api-Secret-Token') ?? ''
      if (secret !== TELEGRAM_WEBHOOK_SECRET) {
        console.warn('[Telegram] Invalid secret token — ignoring update')
        return ok
      }
    }

    const body = await req.json()

    // Only handle message updates
    const message = body?.message
    if (!message?.text) return ok

    const chatId = String(message.chat.id)
    const updateId = String(body.update_id)
    const text: string = message.text.trim()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Atomic deduplication — Telegram can resend updates if we don't respond fast enough
    const { error: lockErr } = await supabase
      .from('processed_webhooks')
      .insert({ message_id: updateId, sender_phone: chatId, status: 'processing', source: 'telegram' })

    if (lockErr?.code === '23505') {
      console.log(`[Telegram] Duplicate update_id ${updateId} blocked.`)
      return ok
    }

    // Log incoming message
    await supabase.from('system_logs').insert({
      level: 'info',
      message: `[Telegram] MSG de ${chatId}: ${text}`,
      metadata: { update_id: updateId, telegram_chat_id: chatId },
    })

    // Handle CONFIRMAR flow (case-insensitive)
    if (/^confirmar$/i.test(text)) {
      await handleConfirmation(chatId, supabase)
      return ok
    }

    // Handle slash commands with direct prompt templates (no LLM overhead)
    if (text.startsWith('/')) {
      const cmd = text.split(' ')[0].toLowerCase()

      if (cmd === '/ayuda' || cmd === '/start') {
        await sendTelegramMessage(chatId, [
          '<b>CACHE-OS Bot</b>',
          '',
          'Podés preguntarme en lenguaje natural. Ejemplos:',
          '• "¿Cómo está el pacing de todos los clientes?"',
          '• "Dame el reporte de hoy"',
          '• "Pausa la campaña de retargeting de Acme"',
          '• "¿Qué recomiendas para mejorar el CPL de Beta Corp?"',
          '',
          '<b>Comandos rápidos:</b>',
          '/reporte — Resumen MTD de todos los clientes',
          '/alertas — Campañas en rojo o fuera de pacing',
          '/ayuda — Ver este mensaje',
        ].join('\n'))
        return ok
      }

      if (cmd === '/reporte') {
        const { data: clients } = await supabase.from('clients').select('id, name, monthly_budget, funnel_type, kpi_goals').eq('is_active', true)
        const reply = await processWithGroq(
          'Dame un resumen ejecutivo del rendimiento MTD de todos los clientes: pacing, spend, leads o ventas, y si hay alguna alerta importante.',
          clients ?? [],
          supabase,
          [],
          'telegram'
        )
        await sendTelegramMessage(chatId, reply)
        await supabase.from('system_logs').insert({
          level: 'info',
          message: `[Telegram] Respuesta a ${chatId}: ${reply}`,
          metadata: { telegram_chat_id: chatId, command: '/reporte' },
        })
        return ok
      }

      if (cmd === '/alertas') {
        const { data: clients } = await supabase.from('clients').select('id, name, monthly_budget, funnel_type, kpi_goals').eq('is_active', true)
        const reply = await processWithGroq(
          'Analizá todos los clientes y listá únicamente los que tienen problemas: overspending (pacing > 110%), CPA por encima del objetivo, CPL alto, o frecuencia > 2.5. Sé directo y específico.',
          clients ?? [],
          supabase,
          [],
          'telegram'
        )
        await sendTelegramMessage(chatId, reply)
        await supabase.from('system_logs').insert({
          level: 'info',
          message: `[Telegram] Respuesta a ${chatId}: ${reply}`,
          metadata: { telegram_chat_id: chatId, command: '/alertas' },
        })
        return ok
      }
    }

    // Free-form natural language — fetch clients and chat history, then call Groq
    const [{ data: clients }, { data: rawHistory }] = await Promise.all([
      supabase.from('clients').select('id, name, monthly_budget, funnel_type, kpi_goals').eq('is_active', true),
      supabase
        .from('system_logs')
        .select('message, metadata')
        .eq('metadata->>telegram_chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const chatHistory = (rawHistory ?? [])
      .reverse()
      .map((h: any) => {
        const isAI = h.message.startsWith('[Telegram] Respuesta')
        const content = h.message.split(': ').slice(1).join(': ')
        return {
          role: (isAI ? 'assistant' : 'user') as 'assistant' | 'user',
          content: content || h.message,
        }
      })

    const reply = await processWithGroq(text, clients ?? [], supabase, chatHistory, 'telegram')

    // Check if Groq returned a write-intent JSON action block
    let isWriteIntent = false
    try {
      const parsed = JSON.parse(reply)
      if (parsed?.action && parsed?.entity_id) {
        isWriteIntent = true
        await requestConfirmation(
          chatId,
          parsed.action,
          parsed.entity_id,
          parsed.entity_name ?? parsed.entity_id,
          parsed.params ?? {},
          supabase
        )
      }
    } catch {
      // Not JSON — normal text reply
    }

    if (!isWriteIntent) {
      await sendTelegramMessage(chatId, reply)
    }

    await supabase.from('system_logs').insert({
      level: 'info',
      message: `[Telegram] Respuesta a ${chatId}: ${isWriteIntent ? '[CONFIRMACIÓN SOLICITADA]' : reply}`,
      metadata: { telegram_chat_id: chatId, update_id: updateId },
    })

    return ok
  } catch (err) {
    console.error('[Telegram] Unhandled error:', err)
    return ok // Always 200 to prevent Telegram retry loops
  }
})
