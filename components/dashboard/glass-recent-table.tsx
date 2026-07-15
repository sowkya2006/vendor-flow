/**
 * GlassRecentTable — split into:
 * • GlassRecentTable (server): fetches data, passes to client
 * • GlassRecentTableClient (client): renders with hover handlers
 */
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { GlassRecentTableClient } from './glass-recent-table-client'

interface PORow {
  id: string
  po_number: string
  status: string
  total_amount: number | null
  created_at: string
  vendor: { name: string } | null
}

export async function GlassRecentTable() {
  let rows: PORow[] = []

  try {
    const companyId = await getCompanyId()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('purchase_orders')
      .select('id, po_number, status, total_amount, created_at, vendor:vendors(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(6)
    rows = (data ?? []) as PORow[]
  } catch { /* safe fallback */ }

  return <GlassRecentTableClient rows={rows} />
}
