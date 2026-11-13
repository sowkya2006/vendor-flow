import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVendorInvoiceSchema } from '@/lib/validations/vendor-portal'
import { getVendorUser, createVendorInvoice } from '@/lib/supabase/vendor-portal'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get vendor user
    const vu = await getVendorUser()
    if (!vu) {
      return NextResponse.json({ error: 'Not a vendor account' }, { status: 403 })
    }

    // Parse and validate body
    const body = await req.json()
    const parsed = createVendorInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
      return NextResponse.json({ error: firstError ?? 'Invalid invoice data' }, { status: 400 })
    }

    // Resolve company_id from the PO if not on vendor user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let companyId = vu.company_id
    if (!companyId && parsed.data.purchase_order_id) {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = createAdminClient() as any
      const { data: po } = await admin
        .from('purchase_orders')
        .select('company_id')
        .eq('id', parsed.data.purchase_order_id)
        .maybeSingle()
      if (po?.company_id) companyId = po.company_id
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Could not determine company for this invoice' }, { status: 400 })
    }

    // Create the invoice
    const invoice = await createVendorInvoice(
      vu.vendor_id,
      companyId,
      user.id,
      parsed.data,
    )

    // Notify finance manager
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = createAdminClient() as any
      const { data: financeUsers } = await admin
        .from('users')
        .select('id')
        .eq('company_id', companyId)
        .in('role', ['finance_manager', 'administrator', 'admin'])
        .eq('status', 'active')

      if (financeUsers?.length) {
        const rows = (financeUsers as { id: string }[]).map((u) => ({
          company_id:   companyId,
          recipient_id: u.id,
          request_id:   null,
          type:         'invoice_submitted',
          title:        `Invoice Submitted by ${vu.vendor?.name ?? 'Vendor'}`,
          body:         `A new invoice has been submitted and is awaiting your review.`,
          link:         `/payments/invoices/${invoice.id}`,
          entity_type:  'invoice',
          entity_id:    invoice.id,
          is_read:      false,
          sent_at:      new Date().toISOString(),
        }))
        await admin.from('approval_notifications').insert(rows)
      }
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true, invoiceId: invoice.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    console.error('[create-invoice]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
