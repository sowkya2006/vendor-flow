'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createWorkflowSchema, type CreateWorkflowValues } from '@/lib/validations/approval'
import {
  APPROVAL_ENTITY_LABELS,
  APPROVAL_ROLE_LABELS,
} from '@/types/approval'
import type { ApprovalWorkflow } from '@/types/approval'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyUser {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTITY_TYPES = Object.entries(APPROVAL_ENTITY_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}))

const ROLES = Object.entries(APPROVAL_ROLE_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}))

const EMPTY_STEP = {
  step_order: 1,
  name: '',
  role_required: 'manager' as const,
  approver_id: null,
  is_optional: false,
  timeout_hours: null,
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-[--color-foreground-muted] mb-1.5"
    >
      {children}
      {required && <span className="ml-0.5 text-[--color-error]">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-[--color-error]">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
      <div className="border-b border-[--color-border] px-6 py-4">
        <h2 className="text-sm font-semibold text-[--color-foreground]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkflowFormProps {
  workflow?: ApprovalWorkflow
  users: CompanyUser[]
  onSubmit: (values: CreateWorkflowValues) => Promise<void>
  mode: 'create' | 'edit'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowForm({ workflow, users, onSubmit, mode }: WorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultSteps =
    workflow?.steps?.map((s) => ({
      step_order: s.step_order,
      name: s.name,
      role_required: s.role_required,
      approver_id: s.approver_id ?? null,
      is_optional: s.is_optional,
      timeout_hours: s.timeout_hours ?? null,
    })) ?? [{ ...EMPTY_STEP }]

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkflowValues>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {
      name: workflow?.name ?? '',
      description: workflow?.description ?? '',
      entity_type: workflow?.entity_type ?? 'purchase_order',
      is_default: workflow?.is_default ?? false,
      steps: defaultSteps,
    },
  })

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'steps',
  })

  const moveUp = (index: number) => {
    if (index > 0) swap(index, index - 1)
  }

  const moveDown = (index: number) => {
    if (index < fields.length - 1) swap(index, index + 1)
  }

  const handleFormSubmit = handleSubmit(async (values) => {
    // Re-assign step_order after any reordering
    const normalized: CreateWorkflowValues = {
      ...values,
      steps: values.steps.map((s, idx) => ({ ...s, step_order: idx + 1 })),
    }
    setIsSubmitting(true)
    try {
      await onSubmit(normalized)
    } catch (err) {
      if (isRedirectError(err)) throw err
      toast.error('Failed to save workflow. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* ── Basic Info ── */}
      <Section
        title="Workflow Details"
        description="Name this workflow and choose which entity type it applies to."
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <FieldLabel htmlFor="name" required>
              Workflow Name
            </FieldLabel>
            <Input
              id="name"
              placeholder="e.g. Purchase Order Approval"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Description */}
          <div>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              rows={2}
              placeholder="Optional description of when this workflow applies…"
              {...register('description')}
            />
          </div>

          {/* Entity Type + Is Default */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="entity_type" required>
                Entity Type
              </FieldLabel>
              <Controller
                name="entity_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="entity_type" aria-invalid={!!errors.entity_type}>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.entity_type?.message} />
            </div>

            <div className="flex flex-col justify-end pb-1">
              <Controller
                name="is_default"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        'relative h-5 w-9 rounded-full transition-colors',
                        field.value ? 'bg-[--color-primary]' : 'bg-[--color-border]',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                          field.value ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-[--color-foreground]">
                        Set as default
                      </p>
                      <p className="text-xs text-[--color-foreground-muted]">
                        Automatically assigned to new requests of this type
                      </p>
                    </div>
                  </label>
                )}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Approval Steps ── */}
      <Section
        title="Approval Steps"
        description="Define the sequence of approvals. Steps are executed top to bottom."
      >
        <div className="space-y-3">
          {/* Column headers (desktop) */}
          {fields.length > 0 && (
            <div className="hidden grid-cols-[40px_1fr_160px_200px_100px_80px_60px] gap-3 sm:grid px-1">
              {['Order', 'Step Name', 'Role', 'Approver', 'Timeout (h)', 'Optional', ''].map(
                (h) => (
                  <span key={h} className="text-xs font-medium text-[--color-foreground-muted]">
                    {h}
                  </span>
                ),
              )}
            </div>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                'rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-4',
                'sm:grid sm:grid-cols-[40px_1fr_160px_200px_100px_80px_60px] sm:items-start sm:gap-3',
                'sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0',
              )}
            >
              {/* Order + reorder buttons */}
              <div className="mb-3 flex items-center gap-1 sm:mb-0 sm:flex-col sm:pt-1">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="flex h-6 w-6 items-center justify-center rounded text-[--color-foreground-muted] hover:bg-[--color-border] disabled:opacity-30"
                  aria-label="Move step up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <span className="flex h-6 w-6 items-center justify-center text-xs font-bold text-[--color-foreground-muted]">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === fields.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded text-[--color-foreground-muted] hover:bg-[--color-border] disabled:opacity-30"
                  aria-label="Move step down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Step Name */}
              <div className="mb-3 sm:mb-0">
                <FieldLabel required>
                  <span className="sm:hidden">Step Name</span>
                </FieldLabel>
                <Input
                  placeholder="e.g. Manager Review"
                  {...register(`steps.${index}.name`)}
                  aria-invalid={!!errors.steps?.[index]?.name}
                />
                <FieldError message={errors.steps?.[index]?.name?.message} />
              </div>

              {/* Role */}
              <div className="mb-3 sm:mb-0">
                <FieldLabel>
                  <span className="sm:hidden">Role</span>
                </FieldLabel>
                <Controller
                  name={`steps.${index}.role_required`}
                  control={control}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Approver */}
              <div className="mb-3 sm:mb-0">
                <FieldLabel>
                  <span className="sm:hidden">Specific Approver (optional)</span>
                </FieldLabel>
                <Controller
                  name={`steps.${index}.approver_id`}
                  control={control}
                  render={({ field: f }) => (
                    <Select
                      value={f.value ?? 'none'}
                      onValueChange={(v) => f.onChange(v === 'none' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any with role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any with role</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name ?? u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Timeout */}
              <div className="mb-3 sm:mb-0">
                <FieldLabel>
                  <span className="sm:hidden">Timeout (hours)</span>
                </FieldLabel>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="—"
                  {...register(`steps.${index}.timeout_hours`, {
                    setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                  })}
                />
              </div>

              {/* Optional toggle */}
              <div className="mb-3 flex items-start pt-1 sm:mb-0 sm:justify-center">
                <Controller
                  name={`steps.${index}.is_optional`}
                  control={control}
                  render={({ field: f }) => (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={f.value}
                      aria-label="Optional step"
                      onClick={() => f.onChange(!f.value)}
                      className={cn(
                        'relative h-5 w-9 rounded-full transition-colors',
                        f.value ? 'bg-[--color-primary]' : 'bg-[--color-border]',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                          f.value ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                  )}
                />
              </div>

              {/* Remove */}
              <div className="flex items-start sm:justify-center sm:pt-1">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md text-[--color-foreground-muted]',
                    'transition-colors hover:bg-[--color-error-bg] hover:text-[--color-error]',
                    'disabled:pointer-events-none disabled:opacity-30',
                  )}
                  aria-label="Remove step"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {typeof errors.steps?.message === 'string' && (
            <FieldError message={errors.steps.message} />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ ...EMPTY_STEP, step_order: fields.length + 1 })
            }
          >
            <Plus className="h-4 w-4" />
            Add step
          </Button>
        </div>
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Workflow' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
