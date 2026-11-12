import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { getVendorUser, getVendorRFQsForQuotation, getVendorRfqById } from '@/lib/supabase/vendor-portal'
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

  const rfqOptions = await getVendorRFQsForQuotation(vu.vendor_id)

  // Load items for ALL available RFQs server-side so the client form can
  // switch between them without any fetch calls (avoids auth issues)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const rfqItemsMap: Record<string, LineItem[]> = {}

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

  // Pre-fill from URL param if provided
  let defaultItems: LineItem[] | undefined
  if (params.rfq_id && rfqItemsMap[params.rfq_id]?.length) {
    defaultItems = rfqItemsMap[params.rfq_id]
  } else if (params.rfq_id) {
    // Fallback: fetch directly in case RFQ is not in rfqOptions (e.g. different vendor_id)
    const rfq = await getVendorRfqById(params.rfq_id, vu.vendor_id)
    if (rfq?.items?.length) {
      defaultItems = rfq.items.map((item: { description: string; quantity: number; estimated_unit_price?: number | null }) => ({
        description:    item.description,
        quantity:       item.quantity,
        unit_price:     item.estimated_unit_price ?? 0,
        tax_percentage: 0,
      }))
      rfqItemsMap[params.rfq_id] = defaultItems
    }
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link href="/vendor/quotations" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]">
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
        defaultValues={defaultItems ? { items: defaultItems } : undefined}
        onSubmit={createVendorQuotationAction}
        submitLabel="Create Quotation"
      />
    </div>
  )
}
