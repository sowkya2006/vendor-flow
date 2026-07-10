import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getWorkflowById, getCompanyUsers } from '@/lib/supabase/approvals'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { WorkflowForm } from '@/components/approval-workflows/workflow-form'
import { updateWorkflowAction } from '@/app/(dashboard)/approval-workflows/actions'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: 'Edit Workflow — VendorFlow' }
  const companyId = await getCompanyId()
  const wf = await getWorkflowById(id, companyId)
  return { title: wf ? `Edit ${wf.name} — VendorFlow` : 'Edit Workflow — VendorFlow' }
}

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const companyId = await getCompanyId()

  const [workflow, users] = await Promise.all([
    getWorkflowById(id, companyId),
    getCompanyUsers(companyId),
  ])

  if (!workflow) notFound()

  async function handleUpdate(
    values: Parameters<typeof updateWorkflowAction>[1],
  ) {
    'use server'
    await updateWorkflowAction(id, values)
  }

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={`Edit: ${workflow.name}`}
        description="Update the approval sequence and configuration"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/approval-workflows/${id}`}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <WorkflowForm
          workflow={workflow}
          users={users}
          onSubmit={handleUpdate}
          mode="edit"
        />
      </PageContainer>
    </div>
  )
}
