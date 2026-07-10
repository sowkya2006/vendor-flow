import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { getVendorUser, getVendorRFQsForQuotation } from '@/lib/supabase/vendor-portal'
import { redirect } from 'next/navigation'
import { VendorQuotationForm } from '@/components/vendor-portal/vendor-quotation-form'
import { createVendorQuotationAction } from '@/app/vendor/actions'

export const metadata: Metadata = { title: 'New Quotation' }
interface PageProps { searchParams: Promise<{ rfq_id?: string }> }

export default async function NewVendorQuotationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const rfqOptions = await getVendorRFQsForQuotation(vu.vendor_id)

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link href="/vendor/quotations" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><FileSearch className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-semibold text-[--color-foreground]">New Quotation</h1><p className="text-xs text-[--color-foreground-muted]">Submit a quotation to the procurement team</p></div>
        </div>
      </div>
      <VendorQuotationForm rfqOptions={rfqOptions} defaultRfqId={params.rfq_id} onSubmit={createVendorQuotationAction} submitLabel="Create Quotation" />
    </div>
  )
}
