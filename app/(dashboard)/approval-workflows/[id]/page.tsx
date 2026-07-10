import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Edit,
  CheckCircle2,
  Circle,
  Star,
  UserCheck,
  Clock,
  ArrowRight,
  ClipboardList,
} from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getWorkflowById } from '@/lib/supabase/approvals'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { WorkflowToggleButton } from '@/components/approval-workflows/workflow-toggle-button'
import { WorkflowDeleteButton } from '@/components/approval-workflows/workflow-delete-button'
import { APPROVAL_ENTITY_LABELS, APPROVAL_ROLE_LABELS } from '@/types/approval'
import { formatDate } from '@/lib/utils'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: 'Workflow — VendorFlow' }
  const companyId = await getCompanyId()
  const wf = await getWorkflowById(id, companyId)
  return { title: wf ? `${wf.name} — VendorFlow` : 'Workflow — VendorFlow' }
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const companyId = await getCompanyId()
  const workflow = await getWorkflowById(id, companyId)
  if (!workflow) notFound()

  const steps = workflow.steps ?? []

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={workflow.name}
        description={`${APPROVAL_ENTITY_LABELS[workflow.entity_type]} Approval Workflow`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/approval-workflows">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <WorkflowToggleButton workflowId={workflow.id} isActive={workflow.is_active} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/approval-workflows/${workflow.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <WorkflowDeleteButton workflowId={workflow.id} />
          </div>
        }
      />

      <PageContainer className="max-w-3xl">
        <div className="space-y-6">
          {/* Meta card */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  workflow.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[--color-muted] text-[--color-foreground-muted]'
                }`}
              >
                {workflow.is_active ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                {workflow.is_active ? 'Active' : 'Inactive'}
              </span>
              {workflow.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3.5 w-3.5" />
                  Default for {APPROVAL_ENTITY_LABELS[workflow.entity_type]}
                </span>
              )}
              <span className="rounded-full bg-[--color-accent] px-2.5 py-1 text-xs text-[--color-foreground-muted]">
                {APPROVAL_ENTITY_LABELS[workflow.entity_type]}
              </span>
            </div>

            {workflow.description && (
              <p className="text-sm text-[--color-foreground-muted] leading-relaxed">
                {workflow.description}
              </p>
            )}

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[--color-foreground-muted]">Total Steps</p>
                <p className="mt-0.5 font-semibold text-[--color-foreground]">{steps.length}</p>
              </div>
              <div>
                <p className="text-[--color-foreground-muted]">Created</p>
                <p className="mt-0.5 font-semibold text-[--color-foreground]">
                  {formatDate(workflow.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
            <div className="border-b border-[--color-border] px-6 py-4">
              <h2 className="text-sm font-semibold text-[--color-foreground]">Approval Steps</h2>
              <p className="text-xs text-[--color-foreground-muted] mt-0.5">
                Executed in sequence — top to bottom
              </p>
            </div>

            {steps.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[--color-foreground-muted]">
                  No steps configured yet.{' '}
                  <Link
                    href={`/approval-workflows/${workflow.id}/edit`}
                    className="text-[--color-primary] hover:underline"
                  >
                    Edit this workflow
                  </Link>{' '}
                  to add approval steps.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[--color-border]">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-start gap-4 px-6 py-4">
                    {/* Step number */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[--color-primary]/10 text-xs font-bold text-[--color-primary]">
                      {step.step_order}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[--color-foreground]">
                          {step.name}
                        </p>
                        {step.is_optional && (
                          <span className="rounded-full bg-[--color-muted] px-1.5 py-0.5 text-[10px] text-[--color-foreground-muted]">
                            Optional
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-4 text-xs text-[--color-foreground-muted]">
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {APPROVAL_ROLE_LABELS[step.role_required]}
                        </span>
                        {step.approver && (
                          <span>
                            Assigned: {step.approver.full_name ?? step.approver.email}
                          </span>
                        )}
                        {step.timeout_hours != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {step.timeout_hours}h timeout
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow to next step */}
                    {idx < steps.length - 1 && (
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[--color-foreground-subtle]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-[--color-primary]/20 bg-[--color-primary]/5 px-5 py-4">
            <p className="text-sm font-medium text-[--color-foreground]">
              Ready to use this workflow?
            </p>
            <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
              When this workflow is set as default for{' '}
              <strong>{APPROVAL_ENTITY_LABELS[workflow.entity_type]}</strong>, new approval
              requests of that type will automatically use this sequence.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/approvals/new">
                <ClipboardList className="h-4 w-4" />
                Create Approval Request
              </Link>
            </Button>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
