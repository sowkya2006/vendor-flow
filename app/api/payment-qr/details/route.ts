/**
 * GET /api/payment-qr/details?token=XXX
 * Returns invoice details for the QR scan page.
 * No auth required — the token contains the invoice ID.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    // Decode short token: base64url({ i: invoiceId, c: companyId })
    let invoiceId: string
    let companyId: string
    try {
      // Convert base64url to standard base64 and decode
      let b64 = token.replace(/-/g, '+').replace(/_/g, '/')
      while (b64.length % 4 !== 0) b64 += '='
      const decoded = Buffer.from(b64, 'base64').toString('utf8')
      const data = JSON.parse(decoded)
      invoiceId = data.i
      companyId = data.c
      if (!invoiceId || !companyId) throw new Error('invalid')
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data: invoice, error } = await admin
      .from('invoices')
      .select('id, invoice_number, status, remaining_amount, currency, vendor:vendors(name)')
      .eq('id', invoiceId)
      .maybeSingle()

    if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    return NextResponse.json({
      invoiceId:     invoice.id,
      invoiceNumber: invoice.invoice_number,
      vendorName:    (invoice.vendor as { name: string } | null)?.name ?? 'Vendor',
      amount:        invoice.remaining_amount,
      currency:      invoice.currency ?? 'INR',
      status:        invoice.status,
    })
  } catch (err) {
    console.error('[payment-qr/details]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
