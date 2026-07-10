import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getRFQById } from '@/lib/supabase/rfqs'
import { getVendors } from '@/lib/supabase/vendors'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { RFQFormClient } from '@/components/rfqs/rfq-form-client'
import { Button } from '@/components/ui/button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId()
  const rfq = await getRFQById(id, companyId)
  return { title: rfq ? `Edit ${rfq.title} — VendorFlow` : 'Edit RFQ — VendorFlow' }
}

export default async function EditRFQPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const companyId = await getCompanyId()

  const [rfq, { data: vendors }] = await Promise.all([
    getRFQById(id, companyId),
    getVendors(companyId, { status: 'active', pageSize: 200 }),
  ])

  if (!rfq) notFound()

  // Prevent editing if already awarded or cancelled
  if (rfq.status === 'awarded' || rfq.status === 'cancelled') {
    return (
      <div className="min-h-full">
        <WorkspaceHeader
          title={`Edit RFQ`}
          description={`${rfq.title} cannot be edited because it is ${rfq.status}.`}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href={`/rfqs/${id}`}>
                <ChevronLeft className="h-4 w-4" />
                Back to RFQ
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
        title="Edit RFQ"
        description={`Editing: ${rfq.title}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/rfqs/${id}`}>
              <ChevronLeft className="h-4 w-4" />
              Back to RFQ
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <RFQFormClient rfq={rfq} vendors={vendors} mode="edit" />
      </PageContainer>
    </div>
  )
}
