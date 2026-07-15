/**
 * Debug + Live 3-way match data endpoint
 * GET /api/debug-invoice?invoice_id=XXX
 * Returns the invoice, linked PO, and all GRNs for that PO
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const invoice_id = req.nextUrl.searchParams.get('invoice_id')
  if (!invoice_id) return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // 1. Get invoice
  const { data: invoice, error: invErr } = await db
    .from('invoices')
    .select('id, invoice_number, status, purchase_order_id, total_amount')
    .eq('id', invoice_id)
    .maybeSingle()

  if (invErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found', invErr }, { status: 404 })
  }

  // 2. Get PO
  const { data: po } = invoice.purchase_order_id
    ? await db.from('purchase_orders').select('id, po_number, status').eq('id', invoice.purchase_order_id).maybeSingle()
    : { data: null }

  // 3. Get ALL GRNs for this PO (any status)
  const { data: grns } = invoice.purchase_order_id
    ? await db.from('grn').select('id, grn_number, status, purchase_order_id, created_at').eq('purchase_order_id', invoice.purchase_order_id)
    : { data: [] }

  // 4. Get completed GRNs specifically
  const completedGrns = (grns ?? []).filter((g: { status: string }) => g.status === 'completed')

  return NextResponse.json({
    invoice: { id: invoice.id, number: invoice.invoice_number, status: invoice.status, po_id: invoice.purchase_order_id },
    po: po ? { id: po.id, number: po.po_number, status: po.status } : null,
    all_grns: grns ?? [],
    completed_grns: completedGrns,
    match_status: !invoice.purchase_order_id ? 'no_po' : completedGrns.length === 0 ? 'no_grn' : 'matched',
  })
}
