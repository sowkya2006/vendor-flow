import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendors } from '@/lib/supabase/vendors'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { POFormClient } from '@/components/purchase-orders/po-form-client'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'New Purchase Order — VendorFlow' }

export default async function NewPurchaseOrderPage() {
  const companyId = await getCompanyId()
  const { data: vendors } = await getVendors(companyId, {
    status: 'active',
    pageSize: 200,
  })

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New Purchase Order"
        description="Create a purchase order for a vendor."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/purchase-orders">
              <ChevronLeft className="h-4 w-4" />
              Back to POs
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <POFormClient vendors={vendors} mode="create" />
      </PageContainer>
    </div>
  )
}
