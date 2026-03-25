import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetaAction { action_type: string; value: string }
interface MetaInsight {
  date_start: string; spend: string; impressions: string; clicks: string
  reach: string; cpm: string; ctr: string; frequency?: string
  actions?: MetaAction[]; action_values?: MetaAction[]
  campaign_id?: string; campaign_name?: string
  adset_id?: string; adset_name?: string
  ad_id?: string; ad_name?: string
}

function act(actions: MetaAction[] | undefined, type: string): number {
  return actions ? parseInt(actions.find((a) => a.action_type === type)?.value ?? '0') : 0
}
function actVal(values: MetaAction[] | undefined, type: string): number {
  return values ? parseFloat(values.find((a) => a.action_type === type)?.value ?? '0') : 0
}

async function fetchPages(url: string): Promise<any[]> {
  const all: any[] = []
  let next: string | null = url
  while (next) {
    const res = await fetch(next)
    const json = await res.json()
    if (!res.ok || json.error) throw new Error(json.error?.message ?? `Meta API ${res.status}`)
    all.push(...(json.data ?? []))
    next = json.paging?.next ?? null
  }
  return all
}

function buildRow(i: MetaInsight) {
  return {
    spend: parseFloat(i.spend ?? '0'),
    impressions: parseInt(i.impressions ?? '0'),
    clicks: parseInt(i.clicks ?? '0'),
    reach: parseInt(i.reach ?? '0'),
    cpm: i.cpm ? parseFloat(i.cpm) : null,
    ctr: i.ctr ? parseFloat(i.ctr) : null,
    frequency: i.frequency ? parseFloat(i.frequency) : null,
    leads: act(i.actions, 'onsite_conversion.messaging_first_reply'),
    conversations: act(i.actions, 'onsite_conversion.messaging_conversation_started_7d'),
    landing_page_view: act(i.actions, 'landing_page_view'),
    add_to_cart: act(i.actions, 'add_to_cart'),
    initiate_checkout: act(i.actions, 'initiate_checkout'),
    purchases: act(i.actions, 'purchase'),
    purchase_value: actVal(i.action_values, 'purchase'),
    fetched_at: new Date().toISOString(),
  }
}

async function upsertBatch(supabase: any, table: string, rows: any[], conflict: string, clientName: string) {
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 100), { onConflict: conflict })
    if (error) {
      await supabase.from('system_logs').insert({
        level: 'warn', message: `${table} upsert warning for ${clientName}: ${error.message}`,
      })
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { client_id, date_from: df, date_to: dt } = await req.json()
    const today = new Date()
    const yyyy = today.getUTCFullYear()
    const mm = String(today.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(today.getUTCDate()).padStart(2, '0')
    const dateFrom = df ?? `${yyyy}-${mm}-01`
    const dateTo = dt ?? `${yyyy}-${mm}-${dd}`

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: client } = await supabase
      .from('clients').select('id, name, meta_ad_account_id, funnel_type')
      .eq('id', client_id).single()

    if (!client) return new Response(JSON.stringify({ error: 'Client not found' }), {
      status: 404, headers: { ...cors, 'Content-Type': 'application/json' },
    })
    if (!client.meta_ad_account_id) return new Response(JSON.stringify({ error: 'No Meta ad account' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    })

    const token = Deno.env.get('META_ACCESS_TOKEN')!
    const acct = client.meta_ad_account_id
    const fields = 'spend,impressions,clicks,reach,cpm,ctr,frequency,actions,action_values'
    const tr = encodeURIComponent(JSON.stringify({ since: dateFrom, until: dateTo }))
    const base = `https://graph.facebook.com/v25.0/${acct}`

    // Fetch all insight levels + entity lists + demographic breakdown in parallel
    const [accountR, campaignR, adsetR, adR, campEntR, adEntR, demoR] = await Promise.allSettled([
      fetchPages(`${base}/insights?fields=${fields}&time_range=${tr}&time_increment=1&limit=500&access_token=${token}`),
      fetchPages(`${base}/insights?fields=campaign_id,campaign_name,${fields}&time_range=${tr}&time_increment=1&level=campaign&limit=500&access_token=${token}`),
      fetchPages(`${base}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,${fields}&time_range=${tr}&time_increment=1&level=adset&limit=500&access_token=${token}`),
      fetchPages(`${base}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,${fields}&time_range=${tr}&time_increment=1&level=ad&limit=500&access_token=${token}`),
      fetchPages(`${base}/campaigns?fields=id,name,effective_status&limit=500&access_token=${token}`),
      fetchPages(`${base}/ads?fields=id,name,effective_status,creative{thumbnail_url,body,title}&limit=500&access_token=${token}`),
      fetchPages(`${base}/insights?fields=spend,impressions,clicks,reach,actions&breakdowns=age,gender&time_range=${tr}&time_increment=1&limit=500&access_token=${token}`),
    ])

    const accountData = accountR.status === 'fulfilled' ? accountR.value : []
    const campaignData = campaignR.status === 'fulfilled' ? campaignR.value : []
    const adsetData = adsetR.status === 'fulfilled' ? adsetR.value : []
    const adData = adR.status === 'fulfilled' ? adR.value : []
    const campEntities = campEntR.status === 'fulfilled' ? campEntR.value : []
    const adEntities = adEntR.status === 'fulfilled' ? adEntR.value : []
    const demoData = demoR.status === 'fulfilled' ? demoR.value : []

    // Build lookup maps for entity data
    const campStatusMap: Record<string, string> = {}
    for (const c of campEntities) campStatusMap[c.id] = c.effective_status

    const adCreativeMap: Record<string, { status: string; thumbnail_url: string | null; creative_body: string | null; creative_title: string | null }> = {}
    for (const a of adEntities) {
      adCreativeMap[a.id] = {
        status: a.effective_status ?? 'UNKNOWN',
        thumbnail_url: a.creative?.thumbnail_url ?? null,
        creative_body: a.creative?.body ?? null,
        creative_title: a.creative?.title ?? null,
      }
    }

    // 1 — Account snapshots
    if (accountData.length > 0) {
      const rows = accountData.map((i: MetaInsight) => ({ client_id, date: i.date_start, ...buildRow(i) }))
      await upsertBatch(supabase, 'meta_snapshots', rows, 'client_id,date', client.name)
    }

    // 2 — Campaign snapshots (with effective_status)
    if (campaignData.length > 0) {
      const rows = campaignData.map((i: MetaInsight) => ({
        client_id,
        campaign_id: i.campaign_id ?? 'unknown',
        campaign_name: i.campaign_name ?? null,
        effective_status: campStatusMap[i.campaign_id ?? ''] ?? null,
        date: i.date_start,
        ...buildRow(i),
      }))
      await upsertBatch(supabase, 'campaign_snapshots', rows, 'client_id,campaign_id,date', client.name)
    }

    // 3 — Adset snapshots
    if (adsetData.length > 0) {
      const rows = adsetData.map((i: MetaInsight) => ({
        client_id,
        campaign_id: i.campaign_id ?? 'unknown',
        campaign_name: i.campaign_name ?? null,
        adset_id: i.adset_id ?? 'unknown',
        adset_name: i.adset_name ?? null,
        effective_status: null,
        date: i.date_start,
        ...buildRow(i),
      }))
      await upsertBatch(supabase, 'adset_snapshots', rows, 'client_id,adset_id,date', client.name)
    }

    // 4 — Ad snapshots (with creative info)
    if (adData.length > 0) {
      const rows = adData.map((i: MetaInsight) => {
        const creative = adCreativeMap[i.ad_id ?? ''] ?? {}
        return {
          client_id,
          campaign_id: i.campaign_id ?? 'unknown',
          campaign_name: i.campaign_name ?? null,
          adset_id: i.adset_id ?? 'unknown',
          adset_name: i.adset_name ?? null,
          ad_id: i.ad_id ?? 'unknown',
          ad_name: i.ad_name ?? null,
          effective_status: creative.status ?? null,
          thumbnail_url: creative.thumbnail_url ?? null,
          creative_body: creative.creative_body ?? null,
          creative_title: creative.creative_title ?? null,
          date: i.date_start,
          ...buildRow(i),
        }
      })
      await upsertBatch(supabase, 'ad_snapshots', rows, 'client_id,ad_id,date', client.name)
    }

    // 5 — Demographic snapshots (age × gender breakdown)
    if (demoData.length > 0) {
      const rows = demoData.map((i: MetaInsight & { age?: string; gender?: string }) => ({
        client_id,
        date: i.date_start,
        age: i.age ?? 'unknown',
        gender: i.gender ?? 'unknown',
        spend: parseFloat(i.spend ?? '0'),
        impressions: parseInt(i.impressions ?? '0'),
        clicks: parseInt(i.clicks ?? '0'),
        reach: parseInt(i.reach ?? '0'),
        leads: act(i.actions, 'onsite_conversion.messaging_first_reply'),
      }))
      await upsertBatch(supabase, 'demographic_snapshots', rows, 'client_id,date,age,gender', client.name)
    }

    // Log errors for any failed fetches
    for (const [name, result] of [['account', accountR], ['campaign', campaignR], ['adset', adsetR], ['ad', adR], ['camp_entities', campEntR], ['ad_entities', adEntR], ['demographics', demoR]] as const) {
      if (result.status === 'rejected') {
        await supabase.from('system_logs').insert({
          level: 'warn', message: `Meta ${name} fetch failed for ${client.name}: ${String(result.reason)}`,
        })
      }
    }

    await supabase.from('system_logs').insert({
      level: 'info',
      message: `Meta sync OK: ${client.name} — ${accountData.length} days, ${campaignData.length} camp rows, ${adsetData.length} adset rows, ${adData.length} ad rows, ${demoData.length} demo rows`,
      metadata: { client_id, dateFrom, dateTo },
    })

    return new Response(JSON.stringify({
      synced: accountData.length, campaigns: campaignData.length,
      adsets: adsetData.length, ads: adData.length, client: client.name,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
