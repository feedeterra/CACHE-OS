const GROQ_KEY = Deno.env.get('GROQ_API_KEY')!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// VAULT: Bóveda de Conocimiento de la Agencia
import { SOP_ESCALADO, SOP_PACING, SOP_RENDIMIENTO } from './vault.ts'

const VAULT_CONTEXT = `
= ACCESO A DOCUMENTOS DE LA BÓVEDA (CACHE-OS VAULT) =
A continuación se presentan los Procedimientos Operativos Estándar (SOPs) oficiales de la agencia.
ESTA ES LA LEY. Cuando el usuario pregunte qué hacer sobre X tema, primero busca la respuesta en estos SOPs, y da recomendaciones PASO A PASO basadas estrictamente en esto:

[DOCUMENTO 1: SOP_ESCALADO.md]
${SOP_ESCALADO}

[DOCUMENTO 2: SOP_PACING.md]
${SOP_PACING}

[DOCUMENTO 3: SOP_RENDIMIENTO.md]
${SOP_RENDIMIENTO}
===================
`

interface ClientData {
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
  impressions: number
  clicks: number
  frequency: number | null
  cpl: number | null
  ctr: number | null
  cpaReal: number | null
  pacing: number | null
  recDaily: number | null
  goals: Record<string, unknown>
  daysElapsed: number
  daysInMonth: number
}

async function buildContext(clients: ClientData[], supabase: any): Promise<ClientContext[]> {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dateFrom = `${yyyy}-${mm}-01`
  const dateTo = today.toISOString().slice(0, 10)
  const daysInMonth = new Date(yyyy, today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()

  return await Promise.all(clients.map(async (c) => {
    const [{ data: snaps }, { data: sales }] = await Promise.all([
      supabase.from('meta_snapshots').select('spend,leads,impressions,clicks,frequency').eq('client_id', c.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('portal_sales_daily').select('count').eq('client_id', c.id).gte('date', dateFrom).lte('date', dateTo),
    ])

    const spend = (snaps ?? []).reduce((s: number, r: any) => s + Number(r.spend ?? 0), 0)
    const leads = (snaps ?? []).reduce((s: number, r: any) => s + Number(r.leads ?? 0), 0)
    const impressions = (snaps ?? []).reduce((s: number, r: any) => s + Number(r.impressions ?? 0), 0)
    const clicks = (snaps ?? []).reduce((s: number, r: any) => s + Number(r.clicks ?? 0), 0)
    const salesCount = (sales ?? []).reduce((s: number, r: any) => s + Number(r.count ?? 0), 0)

    const freqRows = (snaps ?? []).filter((r: any) => r.frequency)
    const frequency = freqRows.length > 0 ? freqRows.reduce((s: number, r: any) => s + Number(r.frequency), 0) / freqRows.length : null

    const cpl = leads > 0 ? spend / leads : null
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null
    const cpaReal = salesCount > 0 ? spend / salesCount : null
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
      impressions,
      clicks,
      frequency,
      cpl,
      ctr,
      cpaReal,
      pacing,
      recDaily,
      goals: (c.kpi_goals as Record<string, unknown>) ?? {},
      daysElapsed,
      daysInMonth,
    }
  }))
}

function formatContext(ctx: ClientContext[]): string {
  return ctx.map((c) => {
    const f = (n: number | null, prefix = '$') => n != null ? `${prefix}${n.toFixed(0)}` : 'sin dato'
    const pct = (n: number | null) => n != null ? `${n.toFixed(1)}%` : 'sin dato'
    return [
      `CLIENTE: ${c.name} | Funnel: ${c.funnel} | Budget: ${f(c.budget)}`,
      `Spend MTD: ${f(c.spend)} | Leads: ${c.leads} | Ventas: ${c.sales}`,
      `CPL: ${f(c.cpl)} | CTR: ${pct(c.ctr)} | Freq: ${c.frequency != null ? c.frequency.toFixed(2) : 'sin dato'}`,
      `CPA Real: ${f(c.cpaReal)} | Pacing: ${pct(c.pacing)} | Daily recomendado: ${f(c.recDaily)}`,
      `Día ${c.daysElapsed}/${c.daysInMonth} del mes`,
      c.goals && Object.keys(c.goals).length > 0 ? `Goals: ${JSON.stringify(c.goals)}` : '',
    ].filter(Boolean).join('\n')
  }).join('\n\n')
}

const SYSTEM_PROMPT = `Sos un media buyer senior especializado en Meta Ads con 8 años de experiencia. Trabajás en Cache Agency y usás este sistema para monitorear cuentas de clientes.

PERSONALIDAD:
- Hablás de forma directa, natural y sin rodeos. Como un colega experto, no un bot.
- Usás español latinoamericano informal cuando el contexto lo permite ("gastó", "está", "tenés").
- Sos preciso con los números. Nunca inventás datos — si no tenés el dato decís "no tengo ese dato ahora".
- Máximo 1 emoji por mensaje, solo si suma. Nada de listas de emojis.
- Respondés lo que se pregunta, nada más. Sin introducciones, sin "¡Claro!", sin "Por supuesto".

EXPERTISE EN PAID MEDIA:
- El usuario (Media Buyer de la agencia) se apoya en vos. Usá los datos de CACHE-OS y cruzalo con la teoría táctica.
- Sabés que un CTR bueno en Meta está entre 1.5% y 3% para tráfico frío, y que >3% es excelente.
- Tus indicaciones DEBEN BASARSE EN LOS DOCUMENTOS DE LA BÓVEDA (VAULT). Nunca contradigas los documentos de la bóveda.

REGLAS DE RESPUESTA:
- Saludos simples ("hola", "buen día") → respuesta corta y humana, sin datos.
- Si preguntan por un cliente específico → usá los datos del contexto y dá un análisis real.
- Si hay un problema claro (pacing mal, CPL alto, freq saturada) → mencionalo directo.
- Si los datos muestran buen rendimiento → reconocelo con naturalidad.
- Si el spend es $0 → probablemente las campañas están pausadas o el sync no corrió.`

// Patterns that indicate a preference change request
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

export async function processWithGroq(
  userMessage: string,
  clients: ClientData[],
  supabase?: any,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  let contextBlock = ''
  let prefsBlock = ''

  if (supabase) {
    const [prefs, detected] = await Promise.all([
      loadPreferences(supabase),
      detectAndSavePreferences(userMessage, supabase),
    ])
    prefsBlock = prefsToPrompt({ ...prefs, ...detected })

    if (clients.length > 0) {
      try {
        const ctx = await buildContext(clients, supabase)
        contextBlock = `\n\nDatos actuales del mes:\n${formatContext(ctx)}`
      } catch (e) {
        console.error('Context build error:', e)
      }
    }
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + '\n' + VAULT_CONTEXT + prefsBlock + contextBlock },
    ...chatHistory.slice(-8),
    { role: 'user', content: userMessage },
  ]

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.55,
      max_tokens: 400,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content?.trim() ?? 'No pude generar una respuesta.'
}
