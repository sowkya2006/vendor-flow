import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getCompanyUsers } from '@/lib/supabase/approvals'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { WorkflowForm } from '@/components/approval-workflows/workflow-form'
import { createWorkflowAction } from '@/app/(dashboard)/approval-workflows/actions'

export const metadata: Metadata = { title: 'New Approval Workflow — VendorFlow' }

export default async function NewWorkflowPage() {
  const companyId = await getCompanyId()
  const users = await getCompanyUsers(companyId)

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New Approval Workflow"
        description="Define the approval chain for a procurement entity type"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/approval-workflows">
              <ChevronLeft className="h-4 w-4" />
              Back to Workflows
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <WorkflowForm users={users} onSubmit={createWorkflowAction} mode="create" />
      </PageContainer>
    </div>
  )
}
