import type { Metadata } from 'next'
import Link from 'next/link'
import { GitBranch, Plus, CheckCircle2, Circle, Star } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getWorkflows } from '@/lib/supabase/approvals'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { WorkflowToggleButton } from '@/components/approval-workflows/workflow-toggle-button'
import { APPROVAL_ENTITY_LABELS, APPROVAL_ROLE_LABELS } from '@/types/approval'

export const metadata: Metadata = { title: 'Approval Workflows — VendorFlow' }

export default async function ApprovalWorkflowsPage() {
  const companyId = await getCompanyId()
  const workflows = await getWorkflows(companyId)

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">
              Approval Workflows
            </h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Configure multi-level approval sequences for each entity type
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/approval-workflows/new">
            <Plus className="h-4 w-4" />
            New Workflow
          </Link>
        </Button>
      </div>

      {/* Workflow list */}
      {workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[--color-border] bg-[--color-background-subtle] py-16 text-center">
          <GitBranch className="mb-3 h-9 w-9 text-[--color-foreground-subtle]" />
          <p className="text-sm font-medium text-[--color-foreground]">No workflows yet</p>
          <p className="mt-1 max-w-sm text-xs text-[--color-foreground-muted]">
            Create your first approval workflow to start routing procurement requests through
            configurable approval chains.
          </p>
          <Button asChild className="mt-4">
            <Link href="/approval-workflows/new">
              <Plus className="h-4 w-4" />
              Create Workflow
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]"
            >
              {/* Workflow header */}
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/approval-workflows/${wf.id}`}
                      className="text-sm font-semibold text-[--color-foreground] hover:text-[--color-primary] transition-colors"
                    >
                      {wf.name}
                    </Link>

                    {/* Active badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        wf.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[--color-muted] text-[--color-foreground-muted]'
                      }`}
                    >
                      {wf.is_active ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                      {wf.is_active ? 'Active' : 'Inactive'}
                    </span>

                    {/* Default badge */}
                    {wf.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Star className="h-3 w-3" />
                        Default
                      </span>
                    )}

                    {/* Entity type badge */}
                    <span className="rounded-full bg-[--color-accent] px-2 py-0.5 text-[10px] text-[--color-foreground-muted]">
                      {APPROVAL_ENTITY_LABELS[wf.entity_type]}
                    </span>
                  </div>

                  {wf.description && (
                    <p className="mt-1 text-xs text-[--color-foreground-muted]">
                      {wf.description}
                    </p>
                  )}

                  {/* Steps preview */}
                  {wf.steps && wf.steps.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {wf.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-1">
                          {idx > 0 && (
                            <span className="text-[--color-foreground-subtle] text-xs">→</span>
                          )}
                          <span className="rounded-md border border-[--color-border] bg-[--color-background-subtle] px-2 py-0.5 text-xs text-[--color-foreground-muted]">
                            {step.name}
                            <span className="ml-1 opacity-60">
                              ({APPROVAL_ROLE_LABELS[step.role_required]})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <WorkflowToggleButton workflowId={wf.id} isActive={wf.is_active} />
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/approval-workflows/${wf.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/approval-workflows/${wf.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
