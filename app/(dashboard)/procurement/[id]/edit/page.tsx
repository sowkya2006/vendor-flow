import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-auth'
import { getPRById } from '@/lib/supabase/purchase-requests'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { PRFormClient } from '@/components/procurement/pr-form-client'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: 'Edit Purchase Request — VendorFlow' }
  const companyId = await getCompanyId()
  const pr = await getPRById(id, companyId)
  return {
    title: pr ? `Edit ${pr.pr_number} — VendorFlow` : 'Edit Purchase Request — VendorFlow',
  }
}

export default async function EditPRPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const companyId = await getCompanyId()
  const pr = await getPRById(id, companyId)
  if (!pr) notFound()

  if (pr.status !== 'draft') {
    return (
      <div className="min-h-full">
        <WorkspaceHeader
          title="Edit Purchase Request"
          description={`${pr.pr_number} cannot be edited because it is ${pr.status}.`}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href={`/procurement/${id}`}>
                <ChevronLeft className="h-4 w-4" />
                Back to PR
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
        title="Edit Purchase Request"
        description={`Editing: ${pr.title}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/procurement/${id}`}>
              <ChevronLeft className="h-4 w-4" />
              Back to PR
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <PRFormClient pr={pr} mode="edit" />
      </PageContainer>
    </div>
  )
}
