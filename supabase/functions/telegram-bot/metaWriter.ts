// Meta Ads API write operations (pause/activate campaigns, update budgets)
// Meta Graph API write endpoints use application/x-www-form-urlencoded (not JSON)

const BASE = 'https://graph.facebook.com/v25.0'
const getToken = () => Deno.env.get('META_ACCESS_TOKEN')!

interface WriteResult {
  success: boolean
  error?: string
}

async function metaPost(entityId: string, params: Record<string, string>): Promise<WriteResult> {
  const body = new URLSearchParams({ ...params, access_token: getToken() })
  try {
    const res = await fetch(`${BASE}/${entityId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message ?? `HTTP ${res.status}` }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function pauseCampaign(campaignId: string): Promise<WriteResult> {
  return metaPost(campaignId, { status: 'PAUSED' })
}

export async function activateCampaign(campaignId: string): Promise<WriteResult> {
  return metaPost(campaignId, { status: 'ACTIVE' })
}

export async function pauseAdset(adsetId: string): Promise<WriteResult> {
  return metaPost(adsetId, { status: 'PAUSED' })
}

export async function activateAdset(adsetId: string): Promise<WriteResult> {
  return metaPost(adsetId, { status: 'ACTIVE' })
}

// dailyBudgetCents: amount in account currency subunits (e.g. $50 USD = 5000 cents)
export async function updateAdsetBudget(adsetId: string, dailyBudgetCents: number): Promise<WriteResult> {
  return metaPost(adsetId, { daily_budget: String(dailyBudgetCents) })
}

// Parse user-provided budget strings into cents
// Handles: "50000", "$50,000", "50k", "$50k", "50.5k"
export function parseBudgetToCents(raw: string): number | null {
  const normalized = raw.toLowerCase().replace(/[\$,\s]/g, '').replace('k', '000')
  const parsed = parseFloat(normalized)
  if (isNaN(parsed)) return null
  return Math.round(parsed * 100)
}
