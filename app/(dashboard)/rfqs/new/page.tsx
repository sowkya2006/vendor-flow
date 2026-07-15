import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { canCreateRFQ } from '@/config/nav-roles'
import { getVendors } from '@/lib/supabase/vendors'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { RFQFormClient } from '@/components/rfqs/rfq-form-client'
import { Button } from '@/components/ui/button'
import type { VendorSummary } from '@/types/vendor'

export const metadata: Metadata = { title: 'New RFQ — VendorFlow' }

export default async function NewRFQPage() {
  const [companyId, role] = await Promise.all([getCompanyId(), getUserRole()])
  // Only Procurement Officer and Administrator can create RFQs
  if (!canCreateRFQ(role)) redirect('/rfqs')

  // Fetch active vendors for the vendor select dropdown
  const { data: vendors } = await getVendors(companyId, {
    status: 'active',
    pageSize: 200,
  })

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New RFQ"
        description="Create a request for quotation to send to a vendor."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/rfqs">
              <ChevronLeft className="h-4 w-4" />
              Back to RFQs
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <RFQFormClient vendors={vendors} mode="create" />
      </PageContainer>
    </div>
  )
}
