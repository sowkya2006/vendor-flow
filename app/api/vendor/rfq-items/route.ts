import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/vendor/rfq-items?rfq_id=XXX
 * Returns the line items for a given RFQ so the quotation form can auto-fill.
 * Uses admin client so vendor RLS doesn't block the read.
 */
export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const rfq_id = req.nextUrl.searchParams.get('rfq_id')
  if (!rfq_id) return NextResponse.json({ error: 'rfq_id required' }, { status: 400 })

  // Use admin client to bypass RLS — vendor users can't read rfq_items directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data, error } = await admin
    .from('rfq_items')
    .select('id, description, quantity, unit, estimated_unit_price, notes')
    .eq('rfq_id', rfq_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = ((data ?? []) as Array<{
    id: string
    description: string
    quantity: number
    unit: string | null
    estimated_unit_price: number | null
    notes: string | null
  }>).map((item) => ({
    description: item.description,
    quantity: item.quantity || 1,
    unit_price: item.estimated_unit_price ?? 0,
    tax_percentage: 0,
    unit: item.unit ?? '',
  }))

  return NextResponse.json({ items })
}
