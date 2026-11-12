import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPaymentToken } from '@/lib/payment-qr'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const data = verifyPaymentToken(token)
    if (!data) return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 401 })

    const { invoiceId, amount, companyId, invoiceNumber } = data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Verify invoice still needs payment
    const { data: invoice } = await admin
      .from('invoices')
      .select('id, invoice_number, status, remaining_amount')
      .eq('id', invoiceId)
      .maybeSingle()

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    if (!['approved', 'partially_paid'].includes(invoice.status)) {
      return NextResponse.json({ error: 'Invoice is not awaiting payment' }, { status: 400 })
    }

    // Fan out notification to all finance managers + admins in this company
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
        type:         'payment_recorded',
        title:        `QR Payment Confirmed: ${invoiceNumber}`,
        body:         `Payment of ₹${Number(amount).toLocaleString('en-IN')} confirmed via QR scan. Please record the payment now.`,
        link:         `/payments/invoices/${invoiceId}/pay`,
        entity_type:  'invoice',
        entity_id:    invoiceId,
        is_read:      false,
        sent_at:      new Date().toISOString(),
      }))
      await admin.from('approval_notifications').insert(rows)
    }

    return NextResponse.json({ ok: true, invoiceNumber, amount })
  } catch (err) {
    console.error('[payment-qr/confirm]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
