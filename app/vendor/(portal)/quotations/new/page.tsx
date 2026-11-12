import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { getVendorUser, getVendorRFQsForQuotation } from '@/lib/supabase/vendor-portal'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { VendorQuotationForm } from '@/components/vendor-portal/vendor-quotation-form'
import { createVendorQuotationAction } from '@/app/vendor/actions'

export const metadata: Metadata = { title: 'New Quotation' }

interface PageProps { searchParams: Promise<{ rfq_id?: string }> }
type LineItem = { description: string; quantity: number; unit_price: number; tax_percentage: number }

export default async function NewVendorQuotationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')

  // Get RFQs this vendor can quote on
  const rfqOptions = await getVendorRFQsForQuotation(vu.vendor_id)

  // Use admin client to load ALL rfq_items server-side — bypasses RLS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const rfqItemsMap: Record<string, LineItem[]> = {}

  // Load items for all RFQs in rfqOptions
  if (rfqOptions.length > 0) {
    const rfqIds = rfqOptions.map((r) => r.id)
    const { data: allItems } = await admin
      .from('rfq_items')
      .select('rfq_id, description, quantity, unit, estimated_unit_price')
      .in('rfq_id', rfqIds)
      .order('created_at', { ascending: true })

    for (const item of (allItems ?? []) as Array<{
      rfq_id: string; description: string; quantity: number
      unit: string | null; estimated_unit_price: number | null
    }>) {
      if (!rfqItemsMap[item.rfq_id]) rfqItemsMap[item.rfq_id] = []
      rfqItemsMap[item.rfq_id].push({
        description:    item.description,
        quantity:       item.quantity || 1,
        unit_price:     item.estimated_unit_price ?? 0,
        tax_percentage: 0,
      })
    }
  }

  // If a specific rfq_id is in the URL but NOT in rfqOptions
  // (happens when vendor_id in rfqs table is stale/mismatched),
  // load it directly by rfq_id using admin client
  if (params.rfq_id && !rfqItemsMap[params.rfq_id]) {
    const { data: extraItems } = await admin
      .from('rfq_items')
      .select('rfq_id, description, quantity, unit, estimated_unit_price')
      .eq('rfq_id', params.rfq_id)
      .order('created_at', { ascending: true })

    if (extraItems?.length) {
      rfqItemsMap[params.rfq_id] = (extraItems as Array<{
        rfq_id: string; description: string; quantity: number
        unit: string | null; estimated_unit_price: number | null
      }>).map((item) => ({
        description:    item.description,
        quantity:       item.quantity || 1,
        unit_price:     item.estimated_unit_price ?? 0,
        tax_percentage: 0,
      }))
    }

    // Add the RFQ itself to rfqOptions if it's missing
    if (!rfqOptions.find((r) => r.id === params.rfq_id)) {
      const { data: rfqRow } = await admin
        .from('rfqs')
        .select('id, rfq_number, title')
        .eq('id', params.rfq_id)
        .maybeSingle()
      if (rfqRow) {
        rfqOptions.push(rfqRow as { id: string; rfq_number: string; title: string })
      }
    }
  }

  // Default items for the form (pre-filled from URL param)
  const defaultItems: LineItem[] | undefined = params.rfq_id
    ? rfqItemsMap[params.rfq_id]
    : undefined

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link
          href="/vendor/quotations"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <FileSearch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">New Quotation</h1>
            <p className="text-xs text-[--color-foreground-muted]">Submit a quotation to the procurement team</p>
          </div>
        </div>
      </div>

      <VendorQuotationForm
        rfqOptions={rfqOptions}
        defaultRfqId={params.rfq_id}
        rfqItemsMap={rfqItemsMap}
        defaultValues={defaultItems?.length ? { items: defaultItems } : undefined}
        onSubmit={createVendorQuotationAction}
        submitLabel="Create Quotation"
      />
    </div>
  )
}
