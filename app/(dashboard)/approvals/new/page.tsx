import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ClipboardList, Info } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getWorkflows } from '@/lib/supabase/approvals'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { NewApprovalRequestForm } from '@/components/approvals/new-approval-request-form'
import { APPROVAL_ENTITY_LABELS } from '@/types/approval'

export const metadata: Metadata = { title: 'New Approval Request — VendorFlow' }

export default async function NewApprovalRequestPage() {
  const companyId = await getCompanyId()
  const workflows = await getWorkflows(companyId)
  const activeWorkflows = workflows.filter((wf) => wf.is_active)

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New Approval Request"
        description="Submit a procurement item for multi-level approval"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/approvals">
              <ChevronLeft className="h-4 w-4" />
              Back to Approvals
            </Link>
          </Button>
        }
      />

      <PageContainer className="max-w-3xl">
        <div className="space-y-6">

          {/* ── Info banner ── */}
          <div className="flex items-start gap-3 rounded-xl border border-[--color-primary]/20 bg-[--color-primary]/5 px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[--color-primary]" />
            <div className="text-sm">
              <p className="font-medium text-[--color-foreground]">How approvals work</p>
              <p className="mt-0.5 leading-relaxed text-[--color-foreground-muted]">
                Select the entity type and link the item to an existing record. The system routes the
                request through the configured approval workflow — each approver is notified in
                sequence and can approve, reject, or return for revision.
              </p>
            </div>
          </div>

          {/* ── Configured workflows ── */}
          {activeWorkflows.length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
              <div className="border-b border-[--color-border] px-6 py-4">
                <h2 className="text-sm font-semibold text-[--color-foreground]">
                  Configured Workflows
                </h2>
                <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
                  Active workflows available for your company — the default workflow for each entity
                  type is selected automatically.
                </p>
              </div>
              <ul className="divide-y divide-[--color-border]">
                {activeWorkflows.map((wf) => (
                  <li key={wf.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-[--color-foreground]">{wf.name}</p>
                      <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
                        {APPROVAL_ENTITY_LABELS[wf.entity_type]}
                        {wf.steps && wf.steps.length > 0
                          ? ` · ${wf.steps.length} step${wf.steps.length !== 1 ? 's' : ''}`
                          : ' · No steps configured'}
                        {wf.is_default ? ' · Default' : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── No workflows warning ── */}
          {activeWorkflows.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[--color-border] bg-[--color-accent] py-10 text-center">
              <ClipboardList className="mb-3 h-7 w-7 text-[--color-foreground-muted]" />
              <p className="text-sm font-medium text-[--color-foreground]">
                No active approval workflows
              </p>
              <p className="mt-1 max-w-sm text-xs text-[--color-foreground-muted]">
                You can still create a request, but it will not have automatic routing steps.
                Ask an administrator to configure workflows.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/approval-workflows/new">Configure Workflows</Link>
              </Button>
            </div>
          )}

          {/* ── The form ── */}
          <NewApprovalRequestForm workflows={workflows} />

        </div>
      </PageContainer>
    </div>
  )
}
