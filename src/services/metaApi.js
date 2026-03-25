import { supabase } from '../lib/supabaseClient'

/**
 * Trigger meta-sync Edge Function for a specific client + date range.
 */
export async function syncClient(clientId, dateFrom, dateTo) {
  const { data, error } = await supabase.functions.invoke('meta-sync', {
    body: { client_id: clientId, date_from: dateFrom, date_to: dateTo },
  })
  if (error) throw error
  return data
}

/**
 * Fetch aggregated monthly spend from meta_snapshots for all active clients.
 * Returns array of { client_id, name, total_spend, days }
 */
export async function fetchMonthlySpend(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to   = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabase
    .from('meta_snapshots')
    .select('client_id, date, spend, clients(name, monthly_budget)')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Fetch daily snapshots for a single client (for chart rendering).
 */
export async function fetchClientSnapshots(clientId, dateFrom, dateTo) {
  const { data, error } = await supabase
    .from('meta_snapshots')
    .select('date, spend, impressions, clicks, cpm, ctr')
    .eq('client_id', clientId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Count sales for all clients this month.
 * Returns array of { client_id, count, delta_sum }
 */
export async function fetchMonthlySales(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`
  const to   = `${year}-${String(month).padStart(2, '0')}-31T23:59:59`

  const { data, error } = await supabase
    .from('sales')
    .select('client_id, delta')
    .gte('logged_at', from)
    .lte('logged_at', to)

  if (error) throw error

  const map = {}
  for (const row of data ?? []) {
    if (!map[row.client_id]) map[row.client_id] = 0
    map[row.client_id] += row.delta
  }
  return map
}
