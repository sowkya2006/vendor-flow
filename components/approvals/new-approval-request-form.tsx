'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Loader2,
  ChevronDown,
  AlertCircle,
  Package,
  FileText,
  ShoppingCart,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createApprovalRequestSchema } from '@/lib/validations/approval'
import type { CreateApprovalRequestValues } from '@/lib/validations/approval'
import {
  getEntityRecordsAction,
  createApprovalRequestAction,
} from '@/app/(dashboard)/approvals/actions'
import type { ApprovalWorkflow, ApprovalEntityType } from '@/types/approval'
import type { EntityRecord } from '@/lib/supabase/approvals'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTITY_TYPES: { value: ApprovalEntityType; label: string; icon: React.ElementType }[] = [
  { value: 'vendor',         label: 'Vendor',         icon: Building2   },
  { value: 'rfq',            label: 'RFQ',            icon: FileText    },
  { value: 'quotation',      label: 'Quotation',      icon: ShoppingCart },
  { value: 'purchase_order', label: 'Purchase Order', icon: Package     },
]

const PRIORITIES = [
  { value: 'low',    label: 'Low'    },
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High'   },
  { value: 'urgent', label: 'Urgent' },
] as const

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-[--color-foreground]"
    >
      {children}
      {required && <span className="ml-0.5 text-[--color-error]">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-[--color-error]" role="alert">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NewApprovalRequestFormProps {
  /** All workflows for the company, pre-fetched server-side */
  workflows: ApprovalWorkflow[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewApprovalRequestForm({ workflows }: NewApprovalRequestFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Cascade state
  const [entityType, setEntityType]     = useState<ApprovalEntityType | ''>('')
  const [records, setRecords]           = useState<EntityRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  // react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateApprovalRequestValues>({
    resolver: zodResolver(createApprovalRequestSchema),
    defaultValues: {
      entity_type: undefined,
      entity_id:   '',
      entity_ref:  '',
      title:       '',
      description: '',
      priority:    'normal',
      workflow_id: null,
    },
  })

  const selectedEntityId  = watch('entity_id')
  const selectedWorkflowId = watch('workflow_id')

  // ---------------------------------------------------------------------------
  // Filtered workflows for the selected entity type
  // ---------------------------------------------------------------------------
  const availableWorkflows = entityType
    ? workflows.filter((wf) => wf.entity_type === entityType && wf.is_active)
    : []

  // ---------------------------------------------------------------------------
  // Load records when entity type changes
  // ---------------------------------------------------------------------------
  const loadRecords = useCallback(async (type: ApprovalEntityType) => {
    setRecordsLoading(true)
    setRecordsError(null)
    setRecords([])
    // Clear dependent fields
    setValue('entity_id', '')
    setValue('entity_ref', '')
    setValue('workflow_id', null)

    try {
      const data = await getEntityRecordsAction(type)
      setRecords(data)

      // Auto-select the default workflow for this entity type
      const defaultWf = workflows.find(
        (wf) => wf.entity_type === type && wf.is_active && wf.is_default,
      )
      if (defaultWf) {
        setValue('workflow_id', defaultWf.id)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load records'
      setRecordsError(msg)
      toast.error(msg)
    } finally {
      setRecordsLoading(false)
    }
  }, [workflows, setValue])

  // Sync entity_type field into react-hook-form when the controlled state changes
  useEffect(() => {
    if (entityType) {
      setValue('entity_type', entityType as ApprovalEntityType, { shouldValidate: false })
      loadRecords(entityType as ApprovalEntityType)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType])

  // Auto-populate title when a record is selected
  useEffect(() => {
    if (!selectedEntityId || !entityType) return
    const record = records.find((r) => r.id === selectedEntityId)
    if (!record) return
    // Set entity_ref to the record's ref
    setValue('entity_ref', record.ref)
    // Auto-suggest a title if the field is still empty
    const currentTitle = watch('title')
    if (!currentTitle) {
      const typeLabel = ENTITY_TYPES.find((e) => e.value === entityType)?.label ?? entityType
      setValue('title', `${typeLabel} Approval — ${record.ref}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntityId])

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  function onSubmit(values: CreateApprovalRequestValues) {
    startTransition(async () => {
      const result = await createApprovalRequestAction(values)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Approval request submitted successfully')
      reset()
      router.push(`/approvals/${result.id}`)
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]"
    >
      {/* ── Header ── */}
      <div className="border-b border-[--color-border] px-6 py-4">
        <h2 className="text-sm font-semibold text-[--color-foreground]">
          New Approval Request
        </h2>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
          Fill in the details below and submit for approval.
        </p>
      </div>

      {/* ── Form body ── */}
      <div className="space-y-5 px-6 py-6">

        {/* ── Entity Type ── */}
        <div>
          <FieldLabel htmlFor="entity_type" required>Entity Type</FieldLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ENTITY_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setEntityType(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-all',
                  entityType === value
                    ? 'border-[--color-primary] bg-[--color-primary]/5 text-[--color-primary]'
                    : 'border-[--color-border] text-[--color-foreground-muted] hover:border-[--color-primary]/40 hover:bg-[--color-accent] hover:text-[--color-foreground]',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <FieldError message={errors.entity_type?.message} />
          {/* hidden field so RHF validates entity_type */}
          <input type="hidden" {...register('entity_type')} />
        </div>

        {/* ── Record Selector ── */}
        <div>
          <FieldLabel htmlFor="entity_id" required>
            {entityType
              ? `Select ${ENTITY_TYPES.find((e) => e.value === entityType)?.label ?? 'Record'}`
              : 'Select Record'}
          </FieldLabel>

          {!entityType && (
            <div className="flex h-9 items-center rounded-md border border-dashed border-[--color-border] px-3 text-xs text-[--color-foreground-muted]">
              Choose an entity type first
            </div>
          )}

          {entityType && (
            <Select
              value={selectedEntityId}
              onValueChange={(v) => setValue('entity_id', v, { shouldValidate: true })}
              disabled={recordsLoading || !!recordsError}
            >
              <SelectTrigger id="entity_id" className={cn(errors.entity_id && 'border-[--color-error]')}>
                {recordsLoading ? (
                  <span className="flex items-center gap-2 text-[--color-foreground-muted]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading records…
                  </span>
                ) : recordsError ? (
                  <span className="text-[--color-error]">Failed to load — retry below</span>
                ) : (
                  <SelectValue placeholder="Select a record…" />
                )}
              </SelectTrigger>
              <SelectContent>
                {records.length === 0 && !recordsLoading ? (
                  <SelectItem value="__empty__" disabled>
                    No records found
                  </SelectItem>
                ) : (
                  records.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="block truncate max-w-xs">{r.label}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {recordsError && entityType && (
            <button
              type="button"
              onClick={() => loadRecords(entityType as ApprovalEntityType)}
              className="mt-1 text-xs text-[--color-primary] underline"
            >
              Retry loading records
            </button>
          )}
          {/* hidden field for entity_id validation */}
          <input type="hidden" {...register('entity_id')} />
          <FieldError message={errors.entity_id?.message} />
        </div>

        {/* ── Workflow Selector ── */}
        <div>
          <FieldLabel htmlFor="workflow_id">Approval Workflow</FieldLabel>
          {!entityType && (
            <div className="flex h-9 items-center rounded-md border border-dashed border-[--color-border] px-3 text-xs text-[--color-foreground-muted]">
              Choose an entity type to see available workflows
            </div>
          )}
          {entityType && availableWorkflows.length === 0 && (
            <div className="flex h-9 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              No active workflows for this entity type — request will use manual approval
            </div>
          )}
          {entityType && availableWorkflows.length > 0 && (
            <Select
              value={selectedWorkflowId ?? ''}
              onValueChange={(v) =>
                setValue('workflow_id', v || null, { shouldValidate: false })
              }
            >
              <SelectTrigger id="workflow_id">
                <SelectValue placeholder="Select a workflow…" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkflows.map((wf) => (
                  <SelectItem key={wf.id} value={wf.id}>
                    <span className="flex items-center gap-2">
                      {wf.name}
                      {wf.is_default && (
                        <span className="ml-1 rounded-full bg-[--color-primary]/10 px-1.5 py-0.5 text-[10px] font-medium text-[--color-primary]">
                          Default
                        </span>
                      )}
                      {wf.steps && (
                        <span className="text-[--color-foreground-muted] text-xs">
                          · {wf.steps.length} step{wf.steps.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input type="hidden" {...register('workflow_id')} />
          <FieldError message={errors.workflow_id?.message} />
        </div>

        {/* ── Title ── */}
        <div>
          <FieldLabel htmlFor="title" required>Title</FieldLabel>
          <Input
            id="title"
            placeholder="e.g. Vendor Approval — Acme Corp"
            aria-invalid={!!errors.title}
            className={cn(errors.title && 'border-[--color-error]')}
            {...register('title')}
          />
          <FieldError message={errors.title?.message} />
        </div>

        {/* ── Description ── */}
        <div>
          <FieldLabel htmlFor="description">Description / Comments</FieldLabel>
          <Textarea
            id="description"
            placeholder="Provide context or reasons for this approval request…"
            rows={4}
            aria-invalid={!!errors.description}
            className={cn(
              'resize-none text-sm',
              errors.description && 'border-[--color-error]',
            )}
            {...register('description')}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* ── Priority ── */}
        <div>
          <FieldLabel htmlFor="priority">Priority</FieldLabel>
          <Select
            defaultValue="normal"
            onValueChange={(v) =>
              setValue('priority', v as CreateApprovalRequestValues['priority'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register('priority')} />
          <FieldError message={errors.priority?.message} />
        </div>

      </div>

      {/* ── Footer / Submit ── */}
      <div className="flex items-center justify-between gap-3 border-t border-[--color-border] px-6 py-4">
        <p className="text-xs text-[--color-foreground-muted]">
          Submitting will immediately route this request through the selected workflow.
        </p>
        <Button
          type="submit"
          disabled={isPending}
          className="shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit for Approval
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
