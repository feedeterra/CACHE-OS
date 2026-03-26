const GROQ_KEY = () => Deno.env.get('GROQ_API_KEY')!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

import { SOP_ESCALADO, SOP_PACING, SOP_RENDIMIENTO } from './vault.ts'

// Vault only injected when user asks for strategy/recommendations
const VAULT_TRIGGER = /\b(qu[eé] hago|recomend|estrategi|escal|optimiz|suger|deber[ií]a|conviene|c[oó]mo mejorar|sop|procedimiento|pasos?)\b/i

const VAULT_CONTEXT = `
= SOPs DE CACHE AGENCY (usar solo cuando el usuario pide recomendaciones o estrategia) =

[SOP_ESCALADO]
${SOP_ESCALADO}

[SOP_PACING]
${SOP_PACING}

[SOP_RENDIMIENTO]
${SOP_RENDIMIENTO}
===================
`

// Write-intent detection for both WhatsApp and Telegram
const WRITE_ADDON = `
DETECCIÓN DE ACCIONES DE ESCRITURA EN META ADS:
Si el usuario pide pausar, activar, o cambiar el presupuesto de una campaña o adset,
buscá el entity_id en las ENTIDADES META ADS del contexto.
Si lo encontrás, respondé ÚNICAMENTE con JSON válido (sin texto adicional):
{
  "action": "pause_campaign" | "activate_campaign" | "pause_adset" | "update_budget",
  "entity_id": "<ID de Meta>",
  "entity_name": "<nombre legible>",
  "params": { "new_budget_usd": 50000 }
}
Si NO encontrás el entity_id, pedile al usuario que sea más específico con el nombre.
Si NO es una acción de escritura, respondé en texto libre como siempre.
`

export interface ClientData {
  id: string
  name: string
  monthly_budget: number | null
  funnel_type: string
  kpi_goals?: Record<string, unknown>
}

interface ClientContext {
  name: string
  funnel: string
  budget: number | null
  spend: number
  leads: number
  sales: number
  purchases: number
  purchaseValue: number
  conversations: number
  impressions: number
  clicks: number
  reach: number
  frequency: number | null
  cpm: number | null
  cpl: number | null
  ctr: number | null
  cpaReal: number | null
  roas: number | null
  pacing: number | null
  recDaily: number | null
  goals: Record<string, unknown>
  daysElapsed: number
  daysInMonth: number
}

export interface CampaignEntry {
  campaign_id: string
  campaign_name: string
  effective_status: string
}

export interface AdsetEntry {
  adset_id: string
  adset_name: string
  campaign_id: string
  effective_status: string
}

// 2 aggregated queries instead of N*2 per-client queries
async function buildContext(clients: ClientData[], supabase: any): Promise<ClientContext[]> {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dateFrom = `${yyyy}-${mm}-01`
  const dateTo = today.toISOString().slice(0, 10)
  const daysInMonth = new Date(yyyy, today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()

  const clientIds = clients.map((c) => c.id)

  const [{ data: snapsRows }, { data: salesRows }] = await Promise.all([
    supabase
      .from('meta_snapshots')
      .select('client_id,spend,leads,impressions,clicks,reach,frequency,cpm,purchases,purchase_value,conversations')
      .in('client_id', clientIds)
      .gte('date', dateFrom)
      .lte('date', dateTo),
    supabase
      .from('portal_sales_daily')
      .select('client_id,count')
      .in('client_id', clientIds)
      .gte('date', dateFrom)
      .lte('date', dateTo),
  ])

  // Aggregate in JS by client_id
  const snapsByClient: Record<string, any[]> = {}
  for (const row of (snapsRows ?? [])) {
    if (!snapsByClient[row.client_id]) snapsByClient[row.client_id] = []
    snapsByClient[row.client_id].push(row)
  }

  const salesByClient: Record<string, number> = {}
  for (const row of (salesRows ?? [])) {
    salesByClient[row.client_id] = (salesByClient[row.client_id] ?? 0) + Number(row.count ?? 0)
  }

  return clients.map((c) => {
    const snaps = snapsByClient[c.id] ?? []
    const spend = snaps.reduce((s: number, r: any) => s + Number(r.spend ?? 0), 0)
    const leads = snaps.reduce((s: number, r: any) => s + Number(r.leads ?? 0), 0)
    const impressions = snaps.reduce((s: number, r: any) => s + Number(r.impressions ?? 0), 0)
    const clicks = snaps.reduce((s: number, r: any) => s + Number(r.clicks ?? 0), 0)
    const reach = snaps.reduce((s: number, r: any) => s + Number(r.reach ?? 0), 0)
    const purchases = snaps.reduce((s: number, r: any) => s + Number(r.purchases ?? 0), 0)
    const purchaseValue = snaps.reduce((s: number, r: any) => s + Number(r.purchase_value ?? 0), 0)
    const conversations = snaps.reduce((s: number, r: any) => s + Number(r.conversations ?? 0), 0)
    const salesCount = salesByClient[c.id] ?? 0

    const freqRows = snaps.filter((r: any) => r.frequency)
    const frequency = freqRows.length > 0
      ? freqRows.reduce((s: number, r: any) => s + Number(r.frequency), 0) / freqRows.length
      : null

    const cpmRows = snaps.filter((r: any) => r.cpm)
    const cpm = cpmRows.length > 0
      ? cpmRows.reduce((s: number, r: any) => s + Number(r.cpm), 0) / cpmRows.length
      : null

    const cpl = leads > 0 ? spend / leads : null
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null
    const cpaReal = salesCount > 0 ? spend / salesCount : null
    const roas = purchaseValue > 0 && spend > 0 ? purchaseValue / spend : null
    const budget = c.monthly_budget ? Number(c.monthly_budget) : null
    const pacing = budget && daysElapsed > 0 ? (spend / budget) * 100 : null
    const daysRemaining = daysInMonth - daysElapsed
    const recDaily = budget && daysRemaining > 0 ? (budget - spend) / daysRemaining : null

    return {
      name: c.name,
      funnel: c.funnel_type,
      budget,
      spend,
      leads,
      sales: salesCount,
      purchases,
      purchaseValue,
      conversations,
      impressions,
      clicks,
      reach,
      frequency,
      cpm,
      cpl,
      ctr,
      cpaReal,
      roas,
      pacing,
      recDaily,
      goals: (c.kpi_goals as Record<string, unknown>) ?? {},
      daysElapsed,
      daysInMonth,
    }
  })
}

export async function buildWriteContext(clients: ClientData[], supabase: any): Promise<{ campaigns: CampaignEntry[]; adsets: AdsetEntry[] }> {
  const today = new Date()
  const dateFrom = today.toISOString().slice(0, 10)

  const clientIds = clients.map((c) => c.id)
  if (clientIds.length === 0) return { campaigns: [], adsets: [] }

  const [{ data: campaignRows }, { data: adsetRows }] = await Promise.all([
    supabase
      .from('campaign_snapshots')
      .select('campaign_id, campaign_name, effective_status')
      .in('client_id', clientIds)
      .eq('date', dateFrom)
      .order('campaign_name'),
    supabase
      .from('adset_snapshots')
      .select('adset_id, adset_name, campaign_id, effective_status')
      .in('client_id', clientIds)
      .eq('date', dateFrom)
      .order('adset_name'),
  ])

  const campaigns = Object.values(
    Object.fromEntries((campaignRows ?? []).map((r: CampaignEntry) => [r.campaign_id, r]))
  ) as CampaignEntry[]

  const adsets = Object.values(
    Object.fromEntries((adsetRows ?? []).map((r: AdsetEntry) => [r.adset_id, r]))
  ) as AdsetEntry[]

  return { campaigns, adsets }
}

function formatContext(ctx: ClientContext[]): string {
  return ctx.map((c) => {
    const f = (n: number | null, prefix = '$') => n != null ? `${prefix}${n.toFixed(0)}` : 'sin dato'
    const f2 = (n: number | null, prefix = '$') => n != null ? `${prefix}${n.toFixed(2)}` : 'sin dato'
    const pct = (n: number | null) => n != null ? `${n.toFixed(1)}%` : 'sin dato'
    const lines = [
      `CLIENTE: ${c.name} | Funnel: ${c.funnel} | Budget: ${f(c.budget)} | Día ${c.daysElapsed}/${c.daysInMonth}`,
      `Spend MTD: ${f(c.spend)} | Pacing: ${pct(c.pacing)} | Daily recomendado: ${f(c.recDaily)}`,
      `Leads: ${c.leads} | CPL: ${f2(c.cpl)} | Conversaciones: ${c.conversations}`,
      `Ventas (portal): ${c.sales} | Compras (Meta): ${c.purchases} | Revenue: ${f(c.purchaseValue > 0 ? c.purchaseValue : null)}`,
      `ROAS: ${c.roas != null ? c.roas.toFixed(2) + 'x' : 'sin dato'} | CPA Real: ${f2(c.cpaReal)}`,
      `Impresiones: ${c.impressions.toLocaleString()} | Reach: ${c.reach.toLocaleString()} | Clicks: ${c.clicks}`,
      `CTR: ${pct(c.ctr)} | CPM: ${f2(c.cpm)} | Freq: ${c.frequency != null ? c.frequency.toFixed(2) : 'sin dato'}`,
    ]
    if (c.goals && Object.keys(c.goals).length > 0) lines.push(`Goals: ${JSON.stringify(c.goals)}`)
    return lines.join('\n')
  }).join('\n\n')
}

function formatWriteContext(campaigns: CampaignEntry[], adsets: AdsetEntry[]): string {
  if (campaigns.length === 0 && adsets.length === 0) return ''
  const lines: string[] = ['\n\nENTIDADES META ADS:']
  if (campaigns.length > 0) {
    lines.push('CAMPAÑAS:')
    campaigns.forEach((c) => lines.push(`  ID: ${c.campaign_id} | ${c.campaign_name} | ${c.effective_status}`))
  }
  if (adsets.length > 0) {
    lines.push('AD SETS:')
    adsets.forEach((a) => lines.push(`  ID: ${a.adset_id} | ${a.adset_name} | ${a.effective_status}`))
  }
  return lines.join('\n')
}

const SYSTEM_PROMPT = `Sos un media buyer senior de Cache Agency, especializado en Meta Ads.

PERSONALIDAD:
- Directo, sin rodeos. Como un colega experto, no un bot.
- Español latinoamericano informal ("gastó", "está", "tenés").
- Preciso con los números. Nunca inventás datos — si no tenés el dato decís "no tengo ese dato ahora".
- Máximo 1 emoji por mensaje, solo si suma.
- Respondés lo que se pregunta, nada más. Sin "¡Claro!", sin "Por supuesto".

EXPERTISE:
- CTR bueno en Meta: 1.5%-3% frío, >3% excelente.
- Frecuencia >2.5 = fatiga creativa.
- Pacing ideal: 90%-110% del presupuesto mensual.
- ROAS bueno e-commerce: >2.5x. Peligro: <2x.
- CPM alto + CTR bajo = problema creativo o de audiencia.

REGLAS:
- Saludos simples → respuesta corta, sin datos.
- Cliente específico → usá los datos del contexto, análisis real.
- Spend $0 → campañas pausadas o sync no corrió.
- Si hay problema claro → mencionalo directo.`

const PREF_PATTERNS: { pattern: RegExp; key: string; value: string }[] = [
  { pattern: /sin emojis?|no (uses?|pongas?) emojis?|cero emojis?/i,        key: 'emoji_style', value: 'none' },
  { pattern: /menos emojis?|pocos? emojis?|1 emoji/i,                        key: 'emoji_style', value: 'minimal' },
  { pattern: /(más|mas) emojis?|usá emojis?/i,                               key: 'emoji_style', value: 'normal' },
  { pattern: /(más|mas) corto|respondé? (corto|breve)|sé (breve|conciso)/i,  key: 'length',      value: 'short' },
  { pattern: /(más|mas) (detallado|largo|completo|explicado)/i,              key: 'length',      value: 'detailed' },
  { pattern: /sin formato|texto (simple|plano)|no (uses?|pongas?) asteriscos/i, key: 'format',   value: 'plain' },
  { pattern: /de usted|háblame de usted|tratame de usted/i,                  key: 'tone',        value: 'formal' },
  { pattern: /de vos|tuteo|informal/i,                                        key: 'tone',        value: 'informal' },
]

async function loadPreferences(supabase: any): Promise<Record<string, string>> {
  const { data } = await supabase.from('agent_preferences').select('key, value')
  return Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))
}

async function detectAndSavePreferences(message: string, supabase: any): Promise<Record<string, string>> {
  const detected: Record<string, string> = {}
  for (const { pattern, key, value } of PREF_PATTERNS) {
    if (pattern.test(message)) detected[key] = value
  }
  if (Object.keys(detected).length > 0) {
    await Promise.all(
      Object.entries(detected).map(([key, value]) =>
        supabase.from('agent_preferences').upsert({ key, value, updated_at: new Date().toISOString() })
      )
    )
  }
  return detected
}

function prefsToPrompt(prefs: Record<string, string>): string {
  const lines: string[] = []
  if (prefs.emoji_style === 'none')    lines.push('No uses emojis en ningún mensaje.')
  if (prefs.emoji_style === 'minimal') lines.push('Usá máximo 1 emoji por mensaje y solo si aporta.')
  if (prefs.emoji_style === 'normal')  lines.push('Podés usar emojis con moderación.')
  if (prefs.length === 'short')        lines.push('Respondé siempre de forma muy concisa, máximo 2-3 líneas.')
  if (prefs.length === 'detailed')     lines.push('Dá respuestas detalladas con contexto y análisis.')
  if (prefs.format === 'plain')        lines.push('No uses asteriscos ni formato markdown. Solo texto plano.')
  if (prefs.tone === 'formal')         lines.push('Usá tratamiento de usted.')
  if (prefs.tone === 'informal')       lines.push('Usá tuteo y lenguaje informal.')
  return lines.length > 0 ? `\n\nPREFERENCIAS DEL USUARIO:\n${lines.join('\n')}` : ''
}

// Detect if user needs write access (to include campaign/adset IDs)
const WRITE_TRIGGER = /\b(paus[ao]|activ[ao]|resum[io]|encend[eé]|apag[ao]|cambi[ao]|actualiz[ao]|modific[ao]|presupuesto|budget)\b/i

export async function processWithGroq(
  userMessage: string,
  clients: ClientData[],
  supabase?: any,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  channel: 'whatsapp' | 'telegram' = 'whatsapp'
): Promise<string> {
  let contextBlock = ''
  let prefsBlock = ''
  let writeContextBlock = ''

  const needsVault = VAULT_TRIGGER.test(userMessage)
  const needsWriteContext = WRITE_TRIGGER.test(userMessage)

  if (supabase) {
    const [prefs, detected] = await Promise.all([
      loadPreferences(supabase),
      detectAndSavePreferences(userMessage, supabase),
    ])
    prefsBlock = prefsToPrompt({ ...prefs, ...detected })

    if (clients.length > 0) {
      try {
        const [ctx, writeCtx] = await Promise.all([
          buildContext(clients, supabase),
          needsWriteContext ? buildWriteContext(clients, supabase) : Promise.resolve(null),
        ])
        contextBlock = `\n\nDatos actuales del mes:\n${formatContext(ctx)}`
        if (writeCtx) {
          writeContextBlock = formatWriteContext(writeCtx.campaigns, writeCtx.adsets)
        }
      } catch (e) {
        console.error('Context build error:', e)
      }
    }
  }

  const vaultBlock = needsVault ? '\n' + VAULT_CONTEXT : ''
  const writeBlock = needsWriteContext ? '\n' + WRITE_ADDON : ''

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + vaultBlock + writeBlock + prefsBlock + contextBlock + writeContextBlock },
    ...chatHistory.slice(-6),
    { role: 'user', content: userMessage },
  ]

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content?.trim() ?? 'No pude generar una respuesta.'
}
