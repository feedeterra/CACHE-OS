import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function getTacticalSummary(clientId) {
  const { data: snaps, error } = await supabase
    .from('meta_snapshots')
    .select('spend, impressions, clicks, ctr, cpm')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(7)

  if (error) throw error
  return snaps
}
