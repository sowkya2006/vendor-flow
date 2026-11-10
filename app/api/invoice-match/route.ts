import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/invoice-match?invoice_id=XXX
 * Returns 3-way match data (Invoice → PO → GRNs) for the given invoice.
 * Requires an authenticated session.
 */
export async function GET(req: NextRequest) {
  // Auth check — must be logged in
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const invoice_id = req.nextUrl.searchParams.get('invoice_id')
  if (!invoice_id) {
    return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // 1. Get invoice (scoped to user's company via users table)
  const { data: userRow } = await admin
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  const companyId = userRow?.company_id
  if (!companyId) {
    return NextResponse.json({ error: 'Company not found' }, { status: 403 })
  }

  const { data: invoice, error: invErr } = await admin
    .from('invoices')
    .select('id, invoice_number, status, purchase_order_id, total_amount')
    .eq('id', invoice_id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (invErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // 2. Get PO if linked
  let po = null
  if (invoice.purchase_order_id) {
    const { data } = await admin
      .from('purchase_orders')
      .select('id, po_number, status')
      .eq('id', invoice.purchase_order_id)
      .maybeSingle()
    po = data ? { id: data.id, number: data.po_number, status: data.status } : null
  }

  // 3. Get ALL GRNs for this PO
  let all_grns: Array<{ id: string; grn_number: string; status: string; purchase_order_id: string }> = []
  if (invoice.purchase_order_id) {
    const { data } = await admin
      .from('grn')
      .select('id, grn_number, status, purchase_order_id')
      .eq('purchase_order_id', invoice.purchase_order_id)
    all_grns = data ?? []
  }

  const completed_grns = all_grns.filter((g) => g.status === 'completed')

  const match_status = !invoice.purchase_order_id
    ? 'no_po'
    : completed_grns.length === 0
    ? 'no_grn'
    : 'matched'

  return NextResponse.json({
    invoice: {
      id: invoice.id,
      number: invoice.invoice_number,
      status: invoice.status,
      po_id: invoice.purchase_order_id,
    },
    po,
    all_grns,
    completed_grns,
    match_status,
  })
}
