/**
 * /quotations/new — PERMANENTLY DISABLED for company portal
 *
 * Quotation creation is VENDOR PORTAL ONLY.
 * Vendors create quotations at /vendor/quotations/new in response to RFQs.
 * Company portal users can only review, compare, approve, or reject quotations.
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Quotations — VendorFlow' }

export default async function NewQuotationPage() {
  redirect('/quotations')
}
