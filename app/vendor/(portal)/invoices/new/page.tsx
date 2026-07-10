import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Receipt } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getVendorUser, getVendorPOsForInvoice } from '@/lib/supabase/vendor-portal'
import { VendorInvoiceForm } from '@/components/vendor-portal/vendor-invoice-form'
import { createVendorInvoiceAction } from '@/app/vendor/actions'

export const metadata: Metadata = { title: 'New Invoice' }

export default async function NewVendorInvoicePage() {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const poOptions = await getVendorPOsForInvoice(vu.vendor_id)

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link href="/vendor/invoices" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><Receipt className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-semibold text-[--color-foreground]">New Invoice</h1><p className="text-xs text-[--color-foreground-muted]">Submit an invoice to the procurement team</p></div>
        </div>
      </div>
      <VendorInvoiceForm poOptions={poOptions} onSubmit={createVendorInvoiceAction} />
    </div>
  )
}
