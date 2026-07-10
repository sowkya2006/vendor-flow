import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { QuotationFormClient } from '@/components/quotations/quotation-form-client'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendors } from '@/lib/supabase/vendors'
import { getRFQs } from '@/lib/supabase/rfqs'
import { createQuotationAction } from '@/app/(dashboard)/quotations/actions'

export const metadata: Metadata = { title: 'New Quotation — VendorFlow' }

interface PageProps {
  searchParams: Promise<{ rfq_id?: string }>
}

export default async function NewQuotationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const companyId = await getCompanyId()

  const [vendorsResult, rfqsResult] = await Promise.all([
    getVendors(companyId, { status: 'active', pageSize: 200 }),
    getRFQs(companyId, { pageSize: 200 }),
  ])

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New Quotation"
        description="Create a vendor quotation in response to an RFQ"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/quotations">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <PageContainer className="max-w-5xl">
        <QuotationFormClient
          vendors={vendorsResult.data}
          rfqs={rfqsResult.data}
          onSubmit={createQuotationAction}
          mode="create"
          defaultRfqId={params.rfq_id}
        />
      </PageContainer>
    </div>
  )
}
