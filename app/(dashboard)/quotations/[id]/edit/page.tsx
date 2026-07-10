import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { QuotationFormClient } from '@/components/quotations/quotation-form-client'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getQuotationById } from '@/lib/supabase/quotations'
import { getVendors } from '@/lib/supabase/vendors'
import { getRFQs } from '@/lib/supabase/rfqs'
import { updateQuotationAction } from '@/app/(dashboard)/quotations/actions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId()
  const quotation = await getQuotationById(id, companyId)
  return {
    title: quotation
      ? `Edit ${quotation.quotation_number} — VendorFlow`
      : 'Edit Quotation — VendorFlow',
  }
}

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const companyId = await getCompanyId()

  const [quotation, vendorsResult, rfqsResult] = await Promise.all([
    getQuotationById(id, companyId),
    getVendors(companyId, { status: 'active', pageSize: 200 }),
    getRFQs(companyId, { pageSize: 200 }),
  ])

  if (!quotation) notFound()

  // Only allow editing draft and under_review quotations
  if (!['draft', 'under_review'].includes(quotation.status)) {
    notFound()
  }

  async function handleUpdate(values: Parameters<typeof updateQuotationAction>[1]) {
    'use server'
    await updateQuotationAction(id, values)
  }

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={`Edit ${quotation.quotation_number}`}
        description="Update quotation details and line items"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/quotations/${id}`}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <PageContainer className="max-w-5xl">
        <QuotationFormClient
          quotation={quotation}
          vendors={vendorsResult.data}
          rfqs={rfqsResult.data}
          onSubmit={handleUpdate}
          mode="edit"
        />
      </PageContainer>
    </div>
  )
}
