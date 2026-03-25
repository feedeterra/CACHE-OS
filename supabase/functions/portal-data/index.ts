import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { token } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: client } = await supabase
      .from('clients')
      .select('id, name, monthly_budget, kpi_goals, funnel_type')
      .eq('magic_link_token', token)
      .eq('is_active', true)
      .single()

    if (!client) {
      return new Response(JSON.stringify({ error: 'ACCESS_DENIED' }), {
        status: 403, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dateFrom = `${yyyy}-${mm}-01`
    const dateTo = today.toISOString().slice(0, 10)

    const [{ data: snapshots }, { data: dailySales }] = await Promise.all([
      supabase.from('meta_snapshots').select('date, spend, leads').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('portal_sales_daily').select('date, count, revenue, category').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo).order('date', { ascending: false }),
    ])

    const totalSpend = (snapshots ?? []).reduce((s, r) => s + Number(r.spend), 0)
    const totalLeads = (snapshots ?? []).reduce((s, r) => s + Number(r.leads ?? 0), 0)
    const totalSales = (dailySales ?? []).reduce((s, r) => s + Number(r.count), 0)
    const totalRevenue = (dailySales ?? []).reduce((s, r) => s + Number(r.revenue || 0), 0)
    const cpaReal = totalSales > 0 ? totalSpend / totalSales : null
    const roasReal = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : null

    // Extract unique categories from CPA targets config
    const cpaTargets = client.kpi_goals?.cpa_targets ?? []
    const categories = cpaTargets.length > 0
      ? cpaTargets.map((t: { name: string }) => t.name.toLowerCase())
      : []

    return new Response(JSON.stringify({
      client: { name: client.name, monthly_budget: client.monthly_budget, kpi_goals: client.kpi_goals, funnel_type: client.funnel_type },
      totalSpend,
      totalLeads,
      totalSales,
      totalRevenue,
      cpaReal,
      roasReal,
      dailySales: dailySales ?? [],
      categories,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
