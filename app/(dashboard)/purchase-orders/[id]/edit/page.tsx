import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getPurchaseOrderById } from '@/lib/supabase/purchase-orders'
import { getVendors } from '@/lib/supabase/vendors'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { POFormClient } from '@/components/purchase-orders/po-form-client'
import { Button } from '@/components/ui/button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId()
  const po = await getPurchaseOrderById(id, companyId)
  return { title: po ? `Edit ${po.po_number} — VendorFlow` : 'Edit PO — VendorFlow' }
}

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const companyId = await getCompanyId()

  const [po, { data: vendors }] = await Promise.all([
    getPurchaseOrderById(id, companyId),
    getVendors(companyId, { status: 'active', pageSize: 200 }),
  ])

  if (!po) notFound()

  if (po.status === 'completed' || po.status === 'cancelled') {
    return (
      <div className="min-h-full">
        <WorkspaceHeader
          title="Edit Purchase Order"
          description={`${po.po_number} cannot be edited because it is ${po.status}.`}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href={`/purchase-orders/${id}`}>
                <ChevronLeft className="h-4 w-4" />
                Back to PO
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Edit Purchase Order"
        description={`Editing: ${po.po_number}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/purchase-orders/${id}`}>
              <ChevronLeft className="h-4 w-4" />
              Back to PO
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <POFormClient po={po} vendors={vendors} mode="edit" />
      </PageContainer>
    </div>
  )
}
