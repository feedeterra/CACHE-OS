import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { token, date, count, category, revenue } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .eq('magic_link_token', token)
      .eq('is_active', true)
      .single()

    if (!client) {
      return new Response(JSON.stringify({ error: 'ACCESS_DENIED' }), {
        status: 403, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const safeCount = Math.max(0, parseInt(count) || 0)
    const safeRevenue = Math.max(0, parseFloat(revenue) || 0)
    const safeCategory = (category || 'general').toLowerCase().trim()

    const { error } = await supabase
      .from('portal_sales_daily')
      .upsert(
        { client_id: client.id, date, count: safeCount, category: safeCategory, revenue: safeRevenue, updated_at: new Date().toISOString() },
        { onConflict: 'client_id,date,category' }
      )

    if (error) throw error

    await supabase.from('system_logs').insert({
      level: 'info',
      message: `Portal: ${client.name} — ${date} [${safeCategory}]: ${safeCount} ventas`,
    })

    return new Response(JSON.stringify({ ok: true, count: safeCount }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
