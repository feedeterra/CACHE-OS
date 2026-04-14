import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AGE_ORDER = ['13-17','18-24','25-34','35-44','45-54','55-64','65+']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { token, dateFrom: reqFrom, dateTo: reqTo } = await req.json()
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
    const dateFrom = reqFrom || `${yyyy}-${mm}-01`
    const dateTo = reqTo || today.toISOString().slice(0, 10)

    const results = await Promise.allSettled([
      supabase.from('meta_snapshots').select('date, spend, leads, conversations').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('portal_sales_daily').select('date, count, revenue, category').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo).order('date', { ascending: false }),
      supabase.from('campaign_snapshots').select('*').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('adset_snapshots').select('*').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('ad_snapshots').select('ad_id, ad_name, thumbnail_url, creative_body, creative_title, spend, leads, purchases').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('demographic_snapshots').select('age, gender, spend, leads, reach').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo),
      supabase.from('geographic_snapshots').select('region, spend, leads, reach').eq('client_id', client.id).gte('date', dateFrom).lte('date', dateTo),
    ])

    const getData = (i: number) => results[i].status === 'fulfilled' ? (results[i] as any).value.data ?? [] : []

    const snapshots: any[]       = getData(0)
    const dailySales: any[]      = getData(1)
    const campaigns: any[]       = getData(2)
    const adsets: any[]          = getData(3)
    const ads: any[]             = getData(4)
    const demographicRows: any[] = getData(5)
    const geographicRows: any[]  = getData(6)

    // ── Totals ────────────────────────────────────────────────────────────
    const totalSpend         = snapshots.reduce((s, r) => s + Number(r.spend), 0)
    const totalLeads         = snapshots.reduce((s, r) => s + Number(r.leads ?? 0), 0)
    const totalConversations = snapshots.reduce((s, r) => s + Number(r.conversations ?? 0), 0)
    // "Contactos" = first replies (leads) si existen, sino conversaciones iniciadas
    const totalContacts      = totalLeads > 0 ? totalLeads : totalConversations
    const cpl                = totalContacts > 0 ? totalSpend / totalContacts : null
    const totalSales         = dailySales.reduce((s, r) => s + Number(r.count), 0)
    const totalRevenue       = dailySales.reduce((s, r) => s + Number(r.revenue || 0), 0)
    const cpaReal            = totalSales > 0 ? totalSpend / totalSales : null
    const roasReal           = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : null
    const todaySpend         = Number(snapshots.find((s: any) => s.date === dateTo)?.spend ?? 0)

    // ── Categories / product metrics ──────────────────────────────────────
    const cpaTargets = client.kpi_goals?.cpa_targets ?? []
    const categories: string[] = cpaTargets.length > 0
      ? cpaTargets.map((t: { name: string }) => t.name.toLowerCase())
      : []

    const productMetrics = cpaTargets.map((target: { name: string; target: number }) => {
      const keywords = target.name.toLowerCase().split(',').map((k: string) => k.trim()).filter(Boolean)
      let productSpend = 0
      const allRows = [...campaigns, ...adsets, ...ads]
      for (const row of allRows) {
        const name = (row.ad_name || row.adset_name || row.campaign_name || '').toLowerCase()
        if (keywords.some((kw: string) => name.includes(kw))) productSpend += Number(row.spend ?? 0)
      }
      const salesByCategory = dailySales
        .filter((d: any) => keywords.some((kw: string) => (d.category || 'general').toLowerCase().includes(kw)))
        .reduce((s: number, d: any) => s + Number(d.count), 0)
      return {
        name: target.name,
        target: target.target,
        spend: productSpend,
        sales: salesByCategory,
        cpa: salesByCategory > 0 && productSpend > 0 ? productSpend / salesByCategory : null,
      }
    })

    // ── Top ads ───────────────────────────────────────────────────────────
    const isLeadsFunnel = client.funnel_type !== 'conversions'
    const adMap: Record<string, any> = {}
    for (const r of ads) {
      const key = r.ad_id ?? 'unknown'
      if (!adMap[key]) adMap[key] = {
        ad_id: key, ad_name: r.ad_name ?? key,
        thumbnail_url: null, creative_body: null, creative_title: null,
        spend: 0, leads: 0, purchases: 0,
      }
      adMap[key].spend     += Number(r.spend     ?? 0)
      adMap[key].leads     += Number(r.leads     ?? 0)
      adMap[key].purchases += Number(r.purchases ?? 0)
      if (!adMap[key].thumbnail_url  && r.thumbnail_url)  adMap[key].thumbnail_url  = r.thumbnail_url
      if (!adMap[key].creative_body  && r.creative_body)  adMap[key].creative_body  = r.creative_body
      if (!adMap[key].creative_title && r.creative_title) adMap[key].creative_title = r.creative_title
    }
    const topAds = Object.values(adMap)
      .filter((a: any) => a.spend > 0)
      .map((a: any) => ({
        ...a,
        results: isLeadsFunnel ? a.leads : a.purchases,
        costPerResult: isLeadsFunnel
          ? (a.leads > 0 ? a.spend / a.leads : null)
          : (a.purchases > 0 ? a.spend / a.purchases : null),
      }))
      .sort((a: any, b: any) => {
        // Ads con resultados primero, ordenados por costo ascendente
        if (a.costPerResult !== null && b.costPerResult !== null) return a.costPerResult - b.costPerResult
        if (a.costPerResult !== null) return -1
        if (b.costPerResult !== null) return 1
        return b.spend - a.spend  // sin resultados: ordenar por spend
      })
      .slice(0, 5)

    // ── Demographics ──────────────────────────────────────────────────────
    const byAgeMap: Record<string, any> = {}
    for (const d of demographicRows) {
      if (!byAgeMap[d.age]) byAgeMap[d.age] = { age: d.age, results: 0, spend: 0 }
      byAgeMap[d.age].results += Number(d.leads ?? 0)
      byAgeMap[d.age].spend   += Number(d.spend ?? 0)
    }
    const byAge = AGE_ORDER.filter((a) => byAgeMap[a]).map((a) => byAgeMap[a])

    const byGenderMap: Record<string, any> = {}
    for (const d of demographicRows) {
      const g = d.gender === 'male' ? 'Hombres' : d.gender === 'female' ? 'Mujeres' : 'Otro'
      if (!byGenderMap[g]) byGenderMap[g] = { gender: g, results: 0, spend: 0 }
      byGenderMap[g].results += Number(d.leads ?? 0)
      byGenderMap[g].spend   += Number(d.spend ?? 0)
    }
    const byGender = Object.values(byGenderMap)
      .filter((g: any) => g.gender !== 'Otro')
      .sort((a: any, b: any) => b.results - a.results)

    // ── Top regions ───────────────────────────────────────────────────────
    const byRegionMap: Record<string, any> = {}
    for (const d of geographicRows) {
      if (!byRegionMap[d.region]) byRegionMap[d.region] = { region: d.region, results: 0, spend: 0 }
      byRegionMap[d.region].results += Number(d.leads ?? 0)
      byRegionMap[d.region].spend   += Number(d.spend ?? 0)
    }
    const topRegions = Object.values(byRegionMap)
      .sort((a: any, b: any) => b.results - a.results || b.spend - a.spend)
      .slice(0, 5)

    // ── Chart data (full range: ventas + facturacion per day) ─────────────
    const salesByDate: Record<string, { ventas: number; facturacion: number }> = {}
    for (const d of dailySales) {
      if (!salesByDate[d.date]) salesByDate[d.date] = { ventas: 0, facturacion: 0 }
      salesByDate[d.date].ventas      += Number(d.count)
      salesByDate[d.date].facturacion += Number(d.revenue || 0)
    }
    const chartData: Array<{ date: string; ventas: number; facturacion: number }> = []
    const cursor = new Date(dateFrom)
    const endDate = new Date(dateTo)
    while (cursor <= endDate) {
      const ds = cursor.toISOString().slice(0, 10)
      chartData.push({ date: ds, ventas: salesByDate[ds]?.ventas ?? 0, facturacion: salesByDate[ds]?.facturacion ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    return new Response(JSON.stringify({
      client: { name: client.name, monthly_budget: client.monthly_budget, kpi_goals: client.kpi_goals, funnel_type: client.funnel_type },
      totalSpend,
      todaySpend,
      totalLeads,
      totalContacts,
      cpl,
      totalSales,
      totalRevenue,
      cpaReal,
      roasReal,
      dailySales,
      categories,
      productMetrics,
      topAds,
      demographics: { byAge, byGender },
      topRegions,
      chartData,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
